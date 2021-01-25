import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import { MAX_INT } from '../utils/constants';

import { floorDecimal, mulDecimal, splitLiquidity, ONE } from '../utils/yieldMath';

import { ISignListItem, IYieldSeries } from '../types';

import PoolProxy from '../contracts/PoolProxy.json';
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
 * Hook for interacting with the Yield Pool Proxy Contract.
 * 
 * @returns { function } addLiquidity
 * @returns { function } removeLiquidity
 * 
 */
export const usePoolProxy = () => {

  /* contexts */
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { authorization: { dsProxyAddress, hasDelegatedDsProxy } } }  = useContext<any>(UserContext);

  /* hooks */ 
  const { signer, provider } = useSignerAccount();
  const { previewPoolTx, checkPoolDelegate, addPoolDelegate } = usePool();

  const { getBalance, approveToken, getTokenAllowance } = useToken();
  
  const { addControllerDelegate } = useController();

  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, handleSignList } = useSigning();

  const { abi: poolProxyAbi } = PoolProxy;
  const { abi: controllerAbi } = Controller;

  /* Preset the yieldProxy controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  
  useEffect(()=>{
    deployedContracts?.PoolProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.PoolProxy), 
      poolProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
  }, [signer, deployedContracts]);

  /**
   * @dev Add liquidity to a pool 
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} daiUsed amount of Dai to use to mint liquidity. 
   * @note if BigNumber is used make sure it is in WEI
   */
  const addLiquidity = async (
    series:IYieldSeries,
    daiUsed:number|BigNumber,
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedDaiUsed = BigNumber.isBigNumber(daiUsed)? daiUsed : ethers.utils.parseEther(daiUsed.toString());

    const overrides = {
      gasLimit: BigNumber.from('800000'),
      value: ethers.utils.parseEther('0')
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.addLiquidityCheck(poolAddr);
    console.log(checkSigs);

    /* calculate max expected fyDai value and factor in slippage */
    const daiReserves = await getBalance(deployedContracts.Dai, 'Dai', poolAddr);
    const fyDaiReserves = await getBalance(series.fyDaiAddress, 'FYDai', poolAddr);
    const [ ,fyDaiSplit ] = splitLiquidity( parsedDaiUsed, daiReserves, fyDaiReserves );
    const maxFYDai = floorDecimal( mulDecimal(fyDaiSplit, '1.1') );

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    
    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });

    // dsProxy must be spender
    requestedSigs.set('daiSig',
      { id: genTxCode('AUTH_TOKEN', series),
        desc: 'Allow transfers of Dai to your Proxy',
        conditional: (await getTokenAllowance(deployedContracts.Dai, 'Dai', dsProxyAddress)) > 0,
        signFn: () => daiPermitSignature(deployedContracts.Dai, dsProxyAddress), 
        fallbackFn: () => approveToken(deployedContracts.Dai, dsProxyAddress, MAX_INT, series), // executed as user!
      });
  
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('ADD_LIQUIDITY', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    console.log(signedSigs.get('daiSig'), signedSigs.get('controllerSig'));

    // contract fn used: addLiquidityWithSignature(IPool pool,uint256 daiUsed,uint256 maxFYDai,bytes memory daiSig,bytes memory controllerSig)
    const calldata = proxyContract.interface.encodeFunctionData( 
      'addLiquidityWithSignature', 
      [ poolAddr, parsedDaiUsed, maxFYDai, signedSigs.get('daiSig'), signedSigs.get('controllerSig') ]
    );

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Adding ${daiUsed} DAI liquidity to ${series.displayNameMobile}`, type:'ADD_LIQUIDITY', series  }
    );

  };

  /**
   * @dev removes liquidity from a pool - redirects to removal with/without signature
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} tokens amount of tokens to remove. 
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidity = async (
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());
    
    const overrides = { 
      gasLimit: BigNumber.from('1000000')
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.removeLiquidityEarlyDaiFixedCheck(poolAddr);
    console.log(checkSigs);

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });
        
    requestedSigs.set('poolSig',
      { id: genTxCode('AUTH_POOL', series),
        desc: `Allow your proxy to interact with the ${series.displayName} pool`,
        conditional: await checkPoolDelegate(poolAddr, dsProxyAddress),
        signFn: () => delegationSignature(poolContract, dsProxyAddress),    
        fallbackFn: () => addPoolDelegate(series, dsProxyAddress), 
      });
    
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('REMOVE_LIQUIDITY', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* Build the call data based, function dependant on series maturity */ 
    let calldata:any;

    if (!series.isMature()) {
      /* calculate expected trade values  */ 
      let minFYDaiPrice:string | BigNumber;

      const preview = await previewPoolTx('sellfydai', series, ethers.utils.parseEther('1'));

      if ( !(preview instanceof Error) ) {
        const _oneRay = ONE.mul('1e18');
        minFYDaiPrice = floorDecimal( ( _oneRay.sub( (_oneRay.sub( preview.toString())).mul('1.1') )).toFixed() );
      } else {
        throw(preview);
      }
      // contract fn used: removeLiquidityEarlyDaiFixedWithSignature(IPool pool,uint256 poolTokens,uint256 minimumFYDaiPrice,bytes memory controllerSig,bytes memory poolSig)
      calldata = proxyContract.interface.encodeFunctionData( 
        'removeLiquidityEarlyDaiFixedWithSignature', 
        [ poolAddr, parsedTokens, minFYDaiPrice, signedSigs.get('controllerSig'), signedSigs.get('poolSig') ]
      );
    } else {
      // contract fn used: removeLiquidityMatureWithSignature(IPool pool,uint256 poolTokens,bytes memory controllerSig,bytes memory poolSig)
      calldata = proxyContract.interface.encodeFunctionData( 
        'removeLiquidityMatureWithSignature', 
        [ poolAddr, parsedTokens, signedSigs.get('controllerSig'), signedSigs.get('poolSig') ]
      );
    }

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Removing ${tokens} liquidity tokens from ${series.displayNameMobile}`, type:'REMOVE_LIQUIDITY', series  }
    );

  };
  
  return {
    /* exported liquidity pool fns */
    addLiquidity,
    removeLiquidity,

  } as const;
};
