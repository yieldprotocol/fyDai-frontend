import { useState, useContext } from 'react';
import { ethers, BigNumber  }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';

import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';
import YieldProxy from '../contracts/YieldProxy.json';

import {
  IDelegableMessage,
  IDomain,
  IYieldSeries
} from '../types';

import { TxContext } from '../contexts/TxContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';

import { useController } from './controllerHook';
import { usePool } from './poolHook';
import { useToken } from './tokenHook';


const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];
const createTypedDelegableData = (message: IDelegableMessage, domain: IDomain) => {
  const typedData = {
    types: {
      EIP712Domain,
      Signature: [
        { name: 'user', type: 'address' },
        { name: 'delegate', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Signature',
    domain,
    message,
  };
  return JSON.stringify(typedData);
};

const auths = new Map([
  [1, { id: 1, desc:'Allow the Yield smart contracts to interact on your behalf' }],
  [2, { id: 2, desc:'Allow the Yield smart contracts to interact with Dai on your behalf' }],
  [3, { id: 3, desc:'Allow the Yield smart contracts to interact with this series on your behalf' }],
  [4, { id: 4, desc:'Allow the Yield smart contracts to trade Dai on your behalf' }],
  [5, { id: 5, desc:'Allow the Yield smart contracts to trade fyDai on your behalf' }],
]);

export const useAuth = () => {
  const { account, provider, signer, chainId } = useSignerAccount();
  const { state: { deployedContracts } } = useContext(YieldContext);
  const { dispatch } = useContext(TxContext);
  const { state: { preferences, authorizations } } = useContext(UserContext);
  const { hasDelegatedProxy, hasAuthorisedProxy } = authorizations;
  
  const controllerAddr = ethers.utils.getAddress(deployedContracts.Controller);
  const controllerContract = new ethers.Contract( controllerAddr, Controller.abi, provider);
  const proxyAddr = ethers.utils.getAddress(deployedContracts.YieldProxy);
  const proxyContract = new ethers.Contract( proxyAddr, YieldProxy.abi, signer);

  const daiAddr = ethers.utils.getAddress(deployedContracts.Dai);
  const fromAddr = account && ethers.utils.getAddress(account);

  const [authActive, setAuthActive] = useState<boolean>(false);
  const [fallbackAuthActive, setFallbackAuthActive] = useState<boolean>(false);

  const { handleTx, handleTxRejectError } = useTxHelpers();

  const { addControllerDelegate } = useController();
  const { approveToken } = useToken();
  const { addPoolDelegate } = usePool();

  const sendForSig = (_provider: any, method: string, params?: any[]) => new Promise<any>((resolve, reject) => {
    const payload = {
      method,
      params, 
      from: fromAddr,   
    };
    const callback = (err: any, result: any) => {
      if (err) {
        reject(err);
      } else if (result.error) {
        reject(result.error);
      } else {
        resolve(result.result);
      }
    };
    _provider.sendAsync( payload, callback );
  });

  const handleSignError = (e:any) =>{
    // eslint-disable-next-line no-console
    console.log(e);
    dispatch({ type: 'requestSigs', payload:[] });
    setAuthActive(false);
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

  const fallbackPoolAuth = async ( series:IYieldSeries ) => {
    try {
      await Promise.all([
        !series.hasDaiAuth? approveToken(daiAddr, series.poolAddress, MAX_INT, series):null,
        !series.hasFyDaiAuth? approveToken(series.fyDaiAddress, proxyAddr, MAX_INT, series):null,
        !series.hasDelegatedPool? addPoolDelegate(series, proxyAddr):null,
      ]);
      setFallbackAuthActive(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      setFallbackAuthActive(false);      
    }
  };

  /**
   *  Once off Yield Controller and Dai authorizations
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
        const controllerNonce = await controllerContract.signatureCount(fromAddr);
        const msg: IDelegableMessage = {
        // @ts-ignore
          user: fromAddr,
          delegate: proxyAddr,
          nonce: controllerNonce.toHexString(),
          deadline: MAX_INT,
        };
        const domain: IDomain = {
          name: 'Yield',
          version: '1',
          chainId: chainId || 1,
          verifyingContract: controllerAddr,
        };
        controllerSig = await sendForSig(
          provider.provider, 
          'eth_signTypedData_v4', 
          [fromAddr, createTypedDelegableData(msg, domain)],
        );
        dispatch({ type: 'signed', payload: auths.get(1) });

        /* Dai permit yieldProxy */
        // @ts-ignore
        const result = await signDaiPermit(provider.provider, daiAddr, fromAddr, proxyAddr);
        daiPermitSig = ethers.utils.joinSignature(result);
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

  /**
   * Series/Pool authorizations that are required for each series.
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
    if (!fallback && (!series.hasDaiAuth && !series.hasFyDaiAuth && !series.hasDelegatedPool) ) {
      setAuthActive(true);
      dispatch({ type: 'requestSigs', payload:[ auths.get(3), auths.get(4), auths.get(5) ] });
      try {
        /* YieldProxy | Pool delegation */
        const poolNonce = await poolContract.signatureCount(fromAddr);
        const msg: IDelegableMessage = {
          // @ts-ignore
          user: fromAddr,
          delegate: proxyAddr,
          nonce: poolNonce.toHexString(),
          deadline: MAX_INT,
        };
        const domain: IDomain = {
          name: 'Yield',
          version: '1',
          chainId: chainId || 1,
          verifyingContract: poolAddr,
        };
        poolSig = await sendForSig(
          provider.provider, 
          'eth_signTypedData_v4', 
          [fromAddr, createTypedDelegableData(msg, domain)],
        );
        dispatch({ type: 'signed', payload: auths.get(3) });

        /* Dai permit pool */
        // @ts-ignore
        const dResult = await signDaiPermit(provider.provider, daiAddr, fromAddr, poolAddr);
        daiSig = ethers.utils.joinSignature(dResult);
        dispatch({ type: 'signed', payload: auths.get(4) });

        /* fyDai permit proxy */
        // @ts-ignore
        const yResult = await signERC2612Permit(provider.provider, fyDaiAddr, fromAddr, proxyAddr, MAX_INT);
        fyDaiSig = ethers.utils.joinSignature(yResult);
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

  return {
    yieldAuth,
    poolAuth,
    authActive, 
    fallbackAuthActive,
  };

};
