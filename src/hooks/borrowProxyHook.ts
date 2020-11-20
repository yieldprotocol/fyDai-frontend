import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import { concat } from 'ethers/lib/utils';
import * as utils from '../utils';

import { ISignListItem, IYieldSeries } from '../types';

import BorrowProxy from '../contracts/BorrowProxy.json';
import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';

import { TxContext } from '../contexts/TxContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useToken } from './tokenHook';
import { useTxHelpers } from './txHooks';

import { useSigning } from './signingHook';

import { useDsProxy } from './dsProxyHook';

import { useController } from './controllerHook';
import { genTxCode } from '../utils';

const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/**
 * Hook for interacting with the Yield Proxy Contract.
 * 
 * @returns { function } postEth
 * @returns { function } withdrawEth
 * @returns { function } borrowDai
 * @returns { function } repayDaiDebt
 * @returns { function } buyDai
 * @returns { function } sellDai
 * @returns { function } addDaiLiquidity
 * @returns { function } removfyDaiLiquidity
 * 
 * @returns { boolean } postActive
 * @returns { boolean } withdrawActive
 * @returns { boolean } borrowActive
 * @returns { boolean } repayActive
 * @returns { boolean } addLiquidityActive
 * @returns { boolean } removeLiquidityActive
 * @returns { boolean } buyActive
 * @returns { boolean } sellActive
 * 
 */
export const useBorrowProxy = () => {

  /* contexts */
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { preferences: { slippage }, authorization: { dsProxyAddress, hasDelegatedDsProxy, hasAuthorisedTreasury } } }  = useContext<any>(UserContext);

  /* hooks */ 
  const { signer, provider, account } = useSignerAccount();
  const { previewPoolTx, checkPoolDelegate, addPoolDelegate } = usePool();
  const { approveToken } = useToken();
  const { handleTx, handleTxRejectError } = useTxHelpers();
  const { addControllerDelegate } = useController();

  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, ERC2612PermitSignature, handleSignList } = useSigning();
  
  const { abi: borrowProxyAbi } = BorrowProxy;
  const { abi: controllerAbi } = Controller;

  /* Temporary signing messages */
  const auths = new Map([
    [1, { id: 1, desc:'Authorize Yield to move Dai to repay debt.' }],
    [2, { id: 2, desc:'Authorize Yield to move your fyDai tokens to repay Dai debt.' }],
  ]);

  // TODO: deal with big number rather also, put this out in a hook
  const valueWithSlippage = (value:BigNumber, minimise:boolean=false ) => {
    const slippageAsRay = utils.toRay(slippage);
    const slippageAmount = utils.mulRay(value, slippageAsRay);
    if (minimise) {
      return value.sub(slippageAmount);
    } 
    return value.add(slippageAmount);
  };

  /* Preset the yieldProxy and contorller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  useEffect(()=>{
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

    /* Check the signature requirements */
    const checkSigs = await proxyContract.withdrawCheck();

    /* build and use signatures if required */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Authorise Yield Protocol',
        conditional: checkSigs[1],
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
      gasLimit: BigNumber.from('400000'),
      value: 0,
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.borrowDaiForMaximumFYDaiCheck(poolAddr);

    /* get estimated maxFYDai */
    let maxFYDai:BigNumber;
    const preview = await previewPoolTx('buydai', series, daiToBorrow); 
    if ( !(preview instanceof Error) ) {
      maxFYDai = valueWithSlippage(preview);
    } else {
      throw(preview);
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Authorise Yield Protocol',
        conditional: checkSigs[1],
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
      [ poolAddr, collatType, parsedMaturity, toAddr, maxFYDai, dai, signedSigs.get('controllerSig') ]
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
      gasLimit: BigNumber.from('350000')
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.repayDaiCheck();

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Authorise Yield Protocol',
        conditional: checkSigs[2],
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });

    requestedSigs.set('daiSig',
      { id: genTxCode('AUTH_TOKEN', series),
        desc: 'Authorise Yield Treasury with Dai',
        conditional: checkSigs[1],
        signFn: () => daiPermitSignature( deployedContracts.Dai, deployedContracts.Treasury ),    
        fallbackFn: () => approveToken(deployedContracts.Dai, deployedContracts.Treasury, MAX_INT, series ),
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
    const parsedDaiIn = BigNumber.isBigNumber(daiIn)? daiIn : ethers.utils.parseEther(daiIn.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    const overrides = { 
      gasLimit: BigNumber.from('200000')
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.sellDaiCheck(poolAddr);

    /* calculate expected trade values and factor in slippage */
    let minFYDaiOut:BigNumber;
    const preview = await previewPoolTx('selldai', series, daiIn);
    if ( !(preview instanceof Error) ) {
      minFYDaiOut = valueWithSlippage(preview, true);
    } else {
      throw(preview);
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);
            
    requestedSigs.set('poolSig',
      { id: genTxCode('AUTH_POOL', series),
        desc: 'Authorise Proxy to interact with the liquidity pool',
        conditional: checkSigs[1],
        signFn: () => delegationSignature( poolContract, dsProxyAddress ),    
        fallbackFn: () => addPoolDelegate(series, dsProxyAddress),
      });

    requestedSigs.set('daiSig',
      { id: genTxCode('AUTH_TOKEN', series),
        desc: 'Authorise Yield Pool Address with Dai',
        conditional: checkSigs[2],
        signFn: () => daiPermitSignature( deployedContracts.Dai, poolAddr ),    
        fallbackFn: () => approveToken(deployedContracts.Dai, poolAddr, MAX_INT, series ), 
      });
        
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('SELL_DAI', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* construct the calldata. Fn selection Based on current authorisation status */
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
      gasLimit: BigNumber.from('250000')
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.buyDaiCheck(poolAddr);
  
    /* calculate expected trade values and factor in slippage */
    let maxFYDaiIn:BigNumber;
    const preview = await previewPoolTx('buydai', series, daiOut);
    if ( !(preview instanceof Error) ) {
      maxFYDaiIn = valueWithSlippage(preview);
    } else {
      throw(preview);
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
               
    requestedSigs.set('poolSig',
      { id: genTxCode('AUTH_POOL', series),
        desc: 'Authorise Proxy to interact with the liquidity pool',
        conditional: checkSigs[1],
        signFn: () => delegationSignature( poolContract, dsProxyAddress ),    
        fallbackFn: () => addPoolDelegate(series, dsProxyAddress),
      });
    
    requestedSigs.set('fyDaiSig',
      { id: genTxCode('AUTH_TOKEN', series),
        desc: 'Authorise Yield Pool with fyDai',
        conditional: checkSigs[2],
        signFn: () => ERC2612PermitSignature( fyDaiAddr, poolAddr ),    
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
