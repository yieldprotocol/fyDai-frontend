import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';
import { MAX_INT } from '../utils/constants';
import { calculateSlippage } from '../utils/yieldMath';

import { ISignListItem, IYieldSeries } from '../types';

import BorrowProxy from '../contracts/BorrowProxy.json';
import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useToken } from './tokenHook';

import { useSigning } from './signingHook';

import { useDsProxy } from './dsProxyHook';

import { useController } from './controllerHook';
import { genTxCode } from '../utils';

/**
 * Hook for interacting with the Yield Proxy Contract.
 * 
 * @returns { function } postEth
 * @returns { function } withdrawEth
 * @returns { function } borrowDai
 * @returns { function } repayDaiDebt
 * @returns { function } buyDai
 * @returns { function } sellDai
 * 
 */
export const useBorrowProxy = () => {

  /* contexts */
  const { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const { state: userState }  = useContext<any>(UserContext);
  const { preferences: { slippage }, authorization: { dsProxyAddress, hasDelegatedDsProxy } } = userState; 

  /* hooks */ 
  const { signer, provider, account } = useSignerAccount();
  const { previewPoolTx, addPoolDelegate, checkPoolDelegate } = usePool();
  const { approveToken, getTokenAllowance } = useToken();
  const { addControllerDelegate } = useController();

  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, ERC2612PermitSignature, handleSignList } = useSigning();
  
  const { abi: borrowProxyAbi } = BorrowProxy;
  const { abi: controllerAbi } = Controller;

  /* Preset the yieldProxy and controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  useEffect(()=> {
    deployedContracts?.BorrowProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.BorrowProxy), 
      borrowProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
  }, [ signer, deployedContracts ]);

  /**
   * @dev Post ETH collateral via yieldProxy
   * @param {string | BigNumber} amount amount of ETH to post (asa string in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const postEth = async (
    amount:string | BigNumber,
  ) => {

    /* Processing and/or sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(utils.cleanValue(amount));
    const toAddr = account && ethers.utils.getAddress(account); /* 'to' in this case represents the vault to be depositied into within controller */

    /* NB. postEth is the only function with NO sig requirements - nevertheless, send to empty array to handleSignList() */
    /* build and use signatures if required */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    /* NB. fn POSTETH is the only function with NO sig requirements - nevertheless, send to empty Map to handleSignList() */
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('POST', null));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* construct the calldata from method and reqd. args */ 
    const calldata = proxyContract.interface.encodeFunctionData( 'post', [ toAddr ] );

    /* send to the proxy for execution */
    await proxyExecute(
      proxyContract.address,
      calldata,
      { value: parsedAmount },
      { tx:null, msg: `Depositing ${amount} ETH`, type:'POST', series: null }
    );
  };

  /**
   * @dev Withdraw ETH collateral via YieldProxy
   * @param {string|BigNumber} amount amount of ETH to withdraw (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const withdrawEth = async (
    amount:string|BigNumber
  ) => {
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(utils.cleanValue(amount));
    const toAddr = account && ethers.utils.getAddress(account);

    /* build and use signatures if required */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('WITHDRAW', null));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* construct the calldata from method and reqd. args and sigs */
    const calldata = proxyContract.interface.encodeFunctionData( 
      'withdrawWithSignature', 
      [ toAddr, parsedAmount, signedSigs.get('controllerSig') ] 
    );
    
    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address,
      calldata,
      { },
      { tx:null, msg: `Withdrawing ${amount} ETH `, type:'WITHDRAW', series: null }
    );

  };

  /**
   * @dev Borrow fyDai from Controller and sell it immediately for Dai, for a maximum fyDai debt.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} daiToBorrow Exact amount of Dai that should be obtained.
   * 
   * @return Amount of fyDai that will be taken from `from` wallet
   *
   */
  const borrowDai = async (
    series:IYieldSeries,
    collateralType: string,
    daiToBorrow: number,
  ) => {
    const dai = ethers.utils.parseEther(daiToBorrow.toString());
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const overrides = { 
      gasLimit: BigNumber.from('400000')
    };

    /* get estimated maxFYDai */
    let maxFYDai:string;
    const preview = await previewPoolTx('buydai', series, daiToBorrow); 
    if ( !(preview instanceof Error) ) {
      maxFYDai = calculateSlippage(preview, slippage);
    } else {
      throw(preview);
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('BORROW', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* construct the calldata from method and reqd. args */
    const calldata = proxyContract.interface.encodeFunctionData( 
      'borrowDaiForMaximumFYDaiWithSignature', 
      [ poolAddr, collatType, parsedMaturity, toAddr, dai, maxFYDai, signedSigs.get('controllerSig') ]
    );

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Borrowing ${daiToBorrow} Dai from ${series.displayNameMobile}`, type:'BORROW', series }
    );
  };

  /**
   * @dev Repay an amount of fyDai debt in Controller using a given amount of Dai exchanged for fyDai at pool rates, with a minimum of fyDai debt required to be paid.
   * Post maturity the user is asked for a signature allowing the treasury access to dai
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} repaymentInDai Exact amount of Dai that should be spent on the repayment.
   * 
   * @return Amount 
   *
   */
  const repayDaiDebt = async (
    series: IYieldSeries,
    collateralType: string,
    repaymentInDai: number,
  ) => {

    const dai = ethers.utils.parseEther(repaymentInDai.toString());   
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();
    const overrides = {
      gasLimit: BigNumber.from('350000'),
      value: 0,
    };

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });
 
    // User to treasury no ds proxy 
    requestedSigs.set('daiSig',
      { id: genTxCode('AUTH_TOKEN', series),
        desc: 'Allow Dai transfers to the fyDai Treasury',
        conditional: ( await getTokenAllowance(deployedContracts.Dai, 'Dai', deployedContracts.Treasury) ) > 0,
        signFn: () => daiPermitSignature( deployedContracts.Dai, deployedContracts.Treasury),
        fallbackFn: () => approveToken(deployedContracts.Dai, deployedContracts.Treasury, MAX_INT, series),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('REPAY', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
          
    // repayDaiWithSignature(bytes32 collateral, uint256 maturity, address to, uint256 daiAmount, bytes memory daiSig, bytes memory controllerSig)
    const calldata = proxyContract.interface.encodeFunctionData( 
      'repayDaiWithSignature', 
      [ collatType, parsedMaturity, toAddr, dai, signedSigs.get('daiSig'), signedSigs.get('controllerSig')]
    );
    
    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Repaying ${repaymentInDai} Dai to ${series.displayNameMobile}`, type:'REPAY', series  }
    );

  };

  /**
   * @dev Sell Dai for fyDai
   * 
   * @param {IYieldSeries} series series to act on.
   * @param daiIn Amount of dai being bought (if in BigNumber make sure its in Wei. )
   * */
  const sellDai = async (  
    series: IYieldSeries,
    daiIn: number| BigNumber, 
  ) => {

    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);

    const parsedDaiIn = BigNumber.isBigNumber(daiIn)? daiIn : ethers.utils.parseEther(daiIn.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    const overrides = { 
      gasLimit: BigNumber.from('250000'),
      value: 0,
    };

    /* calculate expected trade values and factor in slippage */
    let minFYDaiOut:string;
    const preview = await previewPoolTx('selldai', series, daiIn);
    if ( !(preview instanceof Error) ) {
      minFYDaiOut = calculateSlippage(preview, slippage, true);
    } else {
      throw(preview);
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('poolSig',
      { id: genTxCode('AUTH_POOL', series),
        desc: `Allow your proxy to interact with the ${series.displayName} pool`,
        conditional: await checkPoolDelegate(poolAddr, dsProxyAddress),
        signFn: () => delegationSignature(poolContract, dsProxyAddress),    
        fallbackFn: () => addPoolDelegate(series, dsProxyAddress),
      });

    requestedSigs.set('daiSig',
      { id: genTxCode('AUTH_TOKEN', series),
        desc: `Allow Dai transfers to the ${series.displayName} pool`,
        conditional: await getTokenAllowance(deployedContracts.Dai, 'Dai', poolAddr) > 0,
        signFn: () => daiPermitSignature(deployedContracts.Dai, poolAddr),
        fallbackFn: () => approveToken(deployedContracts.Dai, poolAddr, MAX_INT, series), 
      });
        
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('SELL_DAI', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* construct the calldata. Fn selection Based on current authorization status */
    const calldata = proxyContract.interface.encodeFunctionData( 
      'sellDaiWithSignature',
      [ poolAddr, toAddr, parsedDaiIn, minFYDaiOut, signedSigs.get('daiSig'), signedSigs.get('poolSig') ]
    );

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address,
      calldata,
      overrides,
      { tx:null, msg: `Lending ${daiIn} DAI to ${series.displayNameMobile} `, type:'SELL_DAI', series  }
    );

  };

  /**
   * @dev buy dai - closing a position
   * @param {IYieldSeries} series yield series to act on.
   * @param daiOut Amount of dai being bought
   * */ 
  const buyDai = async ( 
    series: IYieldSeries, 
    daiOut:number,
  ) => {
    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);

    const fyDaiAddr = ethers.utils.getAddress(series.fyDaiAddress);
    const parsedDaiOut = BigNumber.isBigNumber(daiOut)? daiOut : ethers.utils.parseEther(daiOut.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    const overrides = { 
      gasLimit: BigNumber.from('250000'),
      value: 0,
    };
  
    /* calculate expected trade values and factor in slippage */
    let maxFYDaiIn:string;
    const preview = await previewPoolTx('buydai', series, daiOut);
    if ( !(preview instanceof Error) ) {
      maxFYDaiIn = calculateSlippage(preview, slippage);
    } else {
      throw(preview);
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('poolSig',
      { id: genTxCode('AUTH_POOL', series),
        desc: `Allow your proxy to interact with the ${series.displayName} pool`,
        conditional: await checkPoolDelegate(poolAddr, dsProxyAddress),
        signFn: () => delegationSignature(poolContract, dsProxyAddress),    
        fallbackFn: () => addPoolDelegate(series, dsProxyAddress),
      });

    requestedSigs.set('fyDaiSig',
      { id: genTxCode('AUTH_TOKEN', series),
        desc: `Allow fyDai transfers to the ${series.displayName} pool`,
        conditional: ( await getTokenAllowance(fyDaiAddr, 'FYDai', poolAddr) ) > 0,
        signFn: () => ERC2612PermitSignature(fyDaiAddr, poolAddr),    
        fallbackFn: () => approveToken(fyDaiAddr, poolAddr, MAX_INT, series ), 
      });
          
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('BUY_DAI', series));

    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* contract fn: buyDaiWithSignature( IPool pool, address to, uint128 daiOut, uint128 maxFYDaiIn, bytes memory fyDaiSig, bytes memory poolSig ) */
    const calldata = proxyContract.interface.encodeFunctionData( 
      'buyDaiWithSignature',
      [ poolAddr, toAddr, parsedDaiOut, maxFYDaiIn, signedSigs.get('fyDaiSig'), signedSigs.get('poolSig') ]
    );
    
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Closing ${daiOut} DAI from ${series.displayNameMobile}`, type:'BUY_DAI', series  }
    );
  };


  return {

    /* ethProxy eq. fns */
    postEth,
    withdrawEth,

    /* daiProxy eq. fns */
    borrowDai,
    repayDaiDebt,

    /* Trade fns */
    sellDai,
    buyDai,

  } as const;
};
