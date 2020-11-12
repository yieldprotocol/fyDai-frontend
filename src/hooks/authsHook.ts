import { useState, useContext } from 'react';
import { ethers, BigNumber  }  from 'ethers';

import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';
import YieldProxy from '../contracts/YieldProxy.json';

import { IYieldSeries } from '../types';
import { MAX_INT } from '../utils';

import { TxContext } from '../contexts/TxContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';

import { useController } from './controllerHook';
import { usePool } from './poolHook';
import { useToken } from './tokenHook';

import { useTxSigning } from './txSigningHook';

const auths = new Map([
  [1, { id: 'yieldAuth1', desc:'Allow the Yield smart contracts to interact on your behalf' }],
  [2, { id: 'yieldAuth2', desc:'Allow the Yield smart contracts to interact with Dai on your behalf' }],
  [3, { id: 'poolAuth1', desc:'Allow the Yield smart contracts to interact with this series on your behalf' }],
  [4, { id: 'poolAuth2', desc:'Allow the Yield smart contracts to trade Dai on your behalf' }],
  [5, { id: 'poolAuth3', desc:'Allow the Yield smart contracts to trade fyDai on your behalf' }],
]);

export const useAuth = () => {
  const { account, provider, signer } = useSignerAccount();
  const { state: { deployedContracts } } = useContext(YieldContext);
  const { dispatch } = useContext(TxContext);
  const { state: { preferences, authorization } } = useContext(UserContext);
  const { hasDelegatedProxy, hasAuthorisedProxy } = authorization;
  
  const controllerContract = new ethers.Contract( deployedContracts?.Controller, Controller?.abi, provider);
  const proxyAddr = ethers.utils.getAddress(deployedContracts?.YieldProxy);
  const proxyContract = new ethers.Contract( proxyAddr, YieldProxy.abi, signer);

  const daiAddr = ethers.utils.getAddress(deployedContracts.Dai);
  const fromAddr = account && ethers.utils.getAddress(account);

  const [authActive, setAuthActive] = useState<boolean>(false);
  const [fallbackAuthActive, setFallbackAuthActive] = useState<boolean>(false);

  const { delegationSignature, daiPermitSignature, ERC2612PermitSignature, handleSignError } = useTxSigning();
  const { handleTx, handleTxRejectError } = useTxHelpers();

  const { addControllerDelegate } = useController();
  const { approveToken } = useToken();
  const { addPoolDelegate } = usePool();

  /**
   *  Once off Yield Controller and Dai authorization
   */
  const yieldAuth = async ( ) => {
    let controllerSig:any;
    let daiPermitSig:any;

    const fallback = preferences?.useTxApproval;
    const overrides = { 
      gasLimit: BigNumber.from('200000')
    };

    /* use permit if user has selected to do so , or if previous auth failed on some of the txs */
    if (!fallback && (!hasAuthorisedProxy && !hasDelegatedProxy)) { 
      setAuthActive(true);
      dispatch({ type: 'requestSigs', payload:[ auths.get(1), auths.get(2) ] });
      try {

        /* yieldProxy | Controller delegation */ 
        controllerSig = await delegationSignature( controllerContract, proxyAddr); 
        dispatch({ type: 'signed', payload: auths.get(1) });

        /* Dai permit yieldProxy */
        daiPermitSig = await daiPermitSignature(daiAddr, proxyAddr ); 
        dispatch({ type: 'signed', payload: auths.get(2) });

      } catch (e) {
      /* If there is a problem with the signing, use the approve txs as a fallback, but ignore if error code 4001 (user reject) */
        if ( e.code !== 4001 ) {
          handleSignError(e);
          setFallbackAuthActive(true);
          // eslint-disable-next-line no-console
          console.log('Fallback to approval transactions');
          await fallbackYieldAuth();
          return;
        }
        handleSignError(e);
        return;
      }

      /* Broadcast signatures */
      let tx:any;
      try {
        tx = await proxyContract.onboard(fromAddr, daiPermitSig, controllerSig, overrides);
      } catch (e) {
        handleTxRejectError(e);
        setAuthActive(false);
        return;
      }
      await handleTx({ tx, msg: 'Authorization pending...', type:'AUTH', series: null } );
      dispatch({ type: 'requestSigs', payload:[] });
      setAuthActive(false);
      
    } else {
      handleSignError('Fallback to approval transactions');
      setFallbackAuthActive(true);
      await fallbackYieldAuth();
    }
  };

  const fallbackYieldAuth = async () => {
    try {
      await Promise.all([
        !hasAuthorisedProxy? approveToken(daiAddr, proxyAddr, MAX_INT, null): null,
        !hasDelegatedProxy? addControllerDelegate(proxyAddr): null,
      ]);
      setFallbackAuthActive(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      setFallbackAuthActive(false);  
    }
  };

  /**
   * Series/Pool authorization that are required for each series.
   * 
   * @param series {IYieldSeries} series to be authorised
   * 
   */
  const poolAuth = async (
    series: IYieldSeries,
  ) => {
    /* Sanitise input */
    const poolContract = new ethers.Contract( series.poolAddress, Pool.abi, provider);
    const fyDaiAddr = ethers.utils.getAddress(series.fyDaiAddress);
    const poolAddr = ethers.utils.getAddress(series.poolAddress);

    const fallback = preferences?.useTxApproval;

    let poolSig;
    let daiSig;
    let fyDaiSig;

    const overrides = { 
      gasLimit: BigNumber.from('250000')
    };

    /* if user account preferences don't specify using fallback, OR, a previous auth failed on SOME txs */
    if (!fallback && (!series.hasDaiAuth && !series.hasFyDaiAuth && !series.hasPoolDelegatedProxy) ) {
      setAuthActive(true);
      dispatch({ type: 'requestSigs', payload:[ auths.get(3), auths.get(4), auths.get(5) ] });
      try {

        /* YieldProxy | Pool delegation */
        poolSig = await delegationSignature( poolContract, proxyAddr );
        dispatch({ type: 'signed', payload: auths.get(3) });

        /* Dai permit pool */
        daiSig = await daiPermitSignature(daiAddr, poolAddr );
        dispatch({ type: 'signed', payload: auths.get(4) });

        /* fyDai permit proxy */
        fyDaiSig = await ERC2612PermitSignature(fyDaiAddr, proxyAddr);
        dispatch({ type: 'signed', payload: auths.get(5) });

      } catch (e) {
      /* If there is a problem with the signing, use the approve txs as a fallback , but ignore if error code 4001 (user reject) */
        if ( e.code !== 4001 ) {
          handleSignError(e);
          // eslint-disable-next-line no-console
          console.log('Fallback to approval transactions');
          setFallbackAuthActive(true);
          await fallbackPoolAuth(series);
          return;
        }
        handleSignError(e);
        return;
      }

      /* Broadcast signatures */
      let tx:any;
      try {
        tx = await proxyContract.authorizePool(poolAddr, fromAddr, daiSig, fyDaiSig, poolSig, overrides);
      } catch (e) {
        handleTxRejectError(e);
        setAuthActive(false);
        return;
      }
      await handleTx({ tx, msg: 'Authorization pending...', type:'AUTH', series });
      dispatch({ type: 'requestSigs', payload:[] });
      setAuthActive(false);

    } else {
      handleSignError('Fallback to approval transactions');
      setFallbackAuthActive(true);
      await fallbackPoolAuth(series);
    }
  };

  const fallbackPoolAuth = async ( series:IYieldSeries ) => {
    try {
      await Promise.all([
        !series.hasDaiAuth? approveToken(daiAddr, series.poolAddress, MAX_INT, series):null,
        !series.hasFyDaiAuth? approveToken(series.fyDaiAddress, proxyAddr, MAX_INT, series):null,
        !series.hasPoolDelegatedProxy? addPoolDelegate(series, proxyAddr):null,
      ]);
      setFallbackAuthActive(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      setFallbackAuthActive(false);
    }
  };

  return {
    yieldAuth,
    poolAuth,
    delegationSignature,
    authActive, 
    fallbackAuthActive,
  };

};