import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { IYieldSeries } from '../types';

import PoolProxy from '../contracts/PoolProxy.json';
import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';

import { TxContext } from '../contexts/TxContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useTxHelpers } from './txHooks';
import { useController } from './controllerHook';

import { useTxSigning } from './txSigningHook';

/**
 * Hook for interacting with the Temporary/ Alternate Yield Proxy Contract.
 * 
 * @returns { function } removeLiquidity
 * @returns { boolean } removeLiquidityActive
 * 
 */

export const useTempProxy = () => {

  /* hooks */ 
  const { signer, provider } = useSignerAccount();

  const { previewPoolTx, addPoolDelegate } = usePool();
  const { addControllerDelegate } = useController();
  const { handleTx, handleTxRejectError } = useTxHelpers();

  const { delegationSignature, handleSignError } = useTxSigning();

  /* contexts */
  const  { dispatch }  = useContext<any>(TxContext);
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { authorizations, preferences: { useTxApproval } } }  = useContext<any>(UserContext);

  const { abi: tempProxyAbi } = PoolProxy;

  /* Temporary signing messages */
  const auths = new Map([
    [1, { id: 'removeLiquidity1', desc:'Authorize Yield proxy to interact with Dai' }],
    [2, { id: 'removeLiquidity2', desc:'Authorize Yield to move your fyDai tokens to repay Dai debt.' }],
  ]);
  
  /* Preset the poolProxy contract to be used with all fns */
  const [ tempProxyContract, setTempProxyContract] = useState<any>();
  useEffect(()=>{
    deployedContracts?.PoolProxy && signer &&
    setTempProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.PoolProxy), 
      tempProxyAbi,
      signer
    ));
  }, [signer, deployedContracts, tempProxyAbi ]);


  /**
   * LIQUIDITY REMOVAL
   */

  /**
   * @dev removes liquidity from a pool
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} tokens amount of tokens to remove. 
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidityWithSignature = async (
    // removeLiquidityEarly(address from, uint256 poolTokens, uint256 DaiLimit)
    // removeLiquidityMature(address from, uint256 poolTokens)
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {
    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());
    const overrides = { 
      gasLimit: BigNumber.from('1000000')
    };

    const controllerContract = new ethers.Contract( deployedContracts.Controller, Controller.abi as any, provider);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);

    const fallback = useTxApproval;

    if (!fallback ) {

      let controllerSig: any = '0x'; 
      let poolSig: any = '0x';

      dispatch({ 
        type: 'requestSigs', 
        payload:[ 
          { ...auths.get(1), signed: authorizations.hasDelegatedAltProxy }, 
          { ...auths.get(2), signed: series.hasPoolDelegatedAltProxy }
        ] });

      /* Deal wth the signtures  */ 
      try {

        /* AltProxy | Controller delegation if required */       
        controllerSig = authorizations.hasDelegatedAltProxy ? '0x' : await delegationSignature( controllerContract, deployedContracts.PoolProxy);
        dispatch({ type: 'signed', payload: auths.get(1) });

        /* altProxy | pool delegation */
        poolSig = series.hasPoolDelegatedAltProxy ? '0x' : await delegationSignature( poolContract, deployedContracts.PoolProxy);
        dispatch({ type: 'signed', payload: auths.get(2) });

      } catch (e) {
      /* If there is a problem with the signing, use the approve txs as a fallback, but ignore if error code 4001 (user reject) */
        if ( e.code !== 4001 ) {
          handleSignError(e);
          // eslint-disable-next-line no-console
          console.log('Fallback to approval transactions');
          await fallbackRemoveLiquidity(series, tokens);
          return;
        }
        handleSignError(e);
        return;
      }

      /* Contract interaction */
      let tx:any;
      // let minDai:BigNumber;
      let minFYDai:BigNumber;

      try {
        if ( !series.isMature() ) {

          // eslint-disable-next-line no-console
          console.log('Removing liquidity BEFORE maturity with signature');

          /* calculate expected trade values  */      
          const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
          if ( !(preview instanceof Error) ) {
            minFYDai = utils.divRay( preview.mul(BigNumber.from('1000000000')), utils.toRay(1.1));
          } else {
            throw(preview);
          }

          tx = await tempProxyContract.removeLiquidityEarlyDaiFixedWithSignature(
            poolAddr, 
            parsedTokens, 
            minFYDai,
            controllerSig,
            poolSig,
            overrides );

        } else {
          // eslint-disable-next-line no-console
          console.log('Removing liquidity AFTER maturity with signature ');

          tx = await tempProxyContract.removeLiquidityMatureWithSignature(
            poolAddr, 
            parsedTokens,
            controllerSig,
            poolSig,
            { gasLimit: BigNumber.from('1000000') } );
        }
      } catch (e) {
        handleTxRejectError(e);
        dispatch({ type: 'requestSigs', payload:[] });
        return;
      }
      await handleTx({ tx, msg: `Removing ${tokens} DAI liquidity from ${series.displayNameMobile}`, type:'REMOVE_LIQUIDITY', series });
      dispatch({ type: 'requestSigs', payload:[] });

    } else {
      handleSignError('Fallback to approval transactions');
      dispatch({ type: 'requestSigs', payload:[] });
      await fallbackRemoveLiquidity(series, tokens);
    }
  };

  /* or, if the user is using the fallback approval transactions  */ 
  const fallbackRemoveLiquidity = async (
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {

    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());
    const overrides = { 
      gasLimit: BigNumber.from('1000000')
    };

    dispatch({ 
      type: 'requestSigs', 
      payload:[ 
        { ...auths.get(1), signed: authorizations.hasDelegatedAltProxy }, 
        { ...auths.get(2), signed: series.hasPoolDelegatedAltProxy }
      ] });

    try {

      await Promise.all([
        !authorizations.hasDelegatedAltProxy ? addControllerDelegate(deployedContracts.PoolProxy): null,
        !series.hasPoolDelegatedAltProxy ? addPoolDelegate(series, deployedContracts.PoolProxy): null, 
      ]).catch((e:any) => handleSignError(e));

      dispatch({ type: 'requestSigs', payload:[] });

      let tx:any;
      let minFYDai:BigNumber;

      if ( !series.isMature() ) {
        // eslint-disable-next-line no-console
        console.log('Removing liquidity BEFORE maturity "with signature" with FALLBACK to approval txs');

        /* calculate expected trade values  */    
        const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
        if ( !(preview instanceof Error) ) {
          minFYDai = utils.divRay( preview.mul(BigNumber.from('1000000000')), utils.toRay(1.1));
        } else {
          throw(preview);
        }

        tx = await tempProxyContract.removeLiquidityEarlyDaiFixedWithSignature(
          poolAddr, 
          parsedTokens, 
          minFYDai,
          '0x',
          '0x',
          overrides );

      } else {
        // eslint-disable-next-line no-console
        console.log('Removing liquidity AFTER maturity "with signature" with FALLBACK to approval txs'); 

        tx = await tempProxyContract.removeLiquidityMatureWithSignature(
          poolAddr, 
          parsedTokens,
          '0x',
          '0x',
          { gasLimit: BigNumber.from('1000000') } );
      }

      await handleTx({ tx, msg: `Removing ${tokens} DAI liquidity from ${series.displayNameMobile}`, type:'REMOVE_LIQUIDITY', series });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      dispatch({ type: 'requestSigs', payload:[] });
    }
  };

  return {   
    /* liquidityProxy eq. fns */
    removeLiquidityWithSignature

  } as const;
};