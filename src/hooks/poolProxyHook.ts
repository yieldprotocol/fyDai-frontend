import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { ISignListItem, IYieldSeries } from '../types';

import PoolProxy from '../contracts/PoolProxy.json';
import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useMath } from './mathHooks';
import { useToken } from './tokenHook';
import { useTxSigning } from './txSigningHook';
import { useDsProxy } from './dsProxyHook';
import { useController } from './controllerHook';

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
  const  { state: { authorization: { dsProxyAddress, hasDelegatedDsProxy, hasDelegatedPoolProxy } } }  = useContext<any>(UserContext);

  /* hooks */ 
  const { signer, provider } = useSignerAccount();
  const { previewPoolTx, checkPoolDelegate, addPoolDelegate } = usePool();
  const { splitDaiLiquidity } = useMath();
  const { getBalance, approveToken } = useToken();
  
  const { addControllerDelegate } = useController();

  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, handleSignList } = useTxSigning();

  const { abi: poolProxyAbi } = PoolProxy;
  const { abi: controllerAbi } = Controller;
  
  /* Activity flags */
  const [ addLiquidityActive, setAddLiquidityActive ] = useState<boolean>(false);
  const [ removeLiquidityActive, setRemoveLiquidityActive ] = useState<boolean>(false);

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
      gasLimit: BigNumber.from('600000'),
      value: ethers.utils.parseEther('0')
    };

    /* calculate max expected fyDai value and factor in slippage */
    const daiReserves = await getBalance(deployedContracts.Dai, 'Dai', poolAddr);
    const fyDaiReserves = await getBalance(series.fyDaiAddress, 'FYDai', poolAddr);
    const [ , fyDaiSplit ] = splitDaiLiquidity( parsedDaiUsed, daiReserves, fyDaiReserves );
    const maxFYDai = utils.mulRay(fyDaiSplit, utils.toRay(1.1));

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    
    requestedSigs.set('controllerSig',
      { id: 'addLiquidityAuth_1',
        desc: 'Authorise Yield Protocol Controller',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });
    
    requestedSigs.set('daiSig',
      { id: 'addLiquidityAuth_2',
        desc: 'Authorise Yield Treasury with Dai',
        conditional: false,
        signFn: () => daiPermitSignature( deployedContracts.Dai, deployedContracts.Treasury ),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress), // fallbakc > 
      });
        
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs);
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }


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
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());
    
    const overrides = { 
      gasLimit: BigNumber.from('1000000')
    };

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);
        
    requestedSigs.set('controllerSig',
      { id: 'removeLiquidityAuth_1',
        desc: 'Authorise Yield PoolProxy with the controller',
        conditional: hasDelegatedPoolProxy,
        signFn: () => delegationSignature(controllerContract, deployedContracts.PoolProxy),    
        fallbackFn: () => addControllerDelegate(deployedContracts.PoolProxy), 
      });
        
    requestedSigs.set('poolSig',
      { id: 'removeLiquidityAuth_2',
        desc: 'Authorise Yield PoolProxy with the series/pool',
        conditional: series.hasPoolDelegatedAltProxy,
        signFn: () => delegationSignature(poolContract, deployedContracts.PoolProxy),    
        fallbackFn: () => addPoolDelegate(series, deployedContracts.PoolProxy), 
      });
    
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs);
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* Build the call data based , function dependant on series maturity */ 
    let calldata:any;

    if (!series.isMature()) {
      // contract fn used: removeLiquidityEarlyDaiFixedWithSignature(IPool pool,uint256 poolTokens,uint256 minimumFYDaiPrice,bytes memory controllerSig,bytes memory poolSig)
      calldata = proxyContract.interface.encodeFunctionData( 
        'removeLiquidityWithSignature', 
        [ poolAddr, parsedTokens,  signedSigs.get('controllerSig'), signedSigs.get('poolSig'), ]
      );

    } else {
      /* calculate expected trade values  */  
      let minFYDai:BigNumber;    
      const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
      if ( !(preview instanceof Error) ) {
        minFYDai = utils.divRay( preview.mul(BigNumber.from('1000000000')), utils.toRay(1.1));
      } else {
        throw(preview);
      }
      // contract fn used: removeLiquidityMatureWithSignature(IPool pool,uint256 poolTokens,bytes memory controllerSig,bytes memory poolSig)
      calldata = proxyContract.interface.encodeFunctionData( 
        'removeLiquidityMatureWithSignature', 
        [ poolAddr, parsedTokens, minFYDai, signedSigs.get('daiSig'), signedSigs.get('controllerSig') ]
      );
    }

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Removing ${tokens} DAI liquidity from ${series.displayNameMobile}`, type:'REMOVE_LIQUIDITY', series  }
    );
  };
  
  return {

    /* exported liquidity pool fns */
    addLiquidity,
    removeLiquidity,

  } as const;
};
