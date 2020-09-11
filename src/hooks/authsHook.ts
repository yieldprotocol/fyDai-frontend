import React from 'react';
import { ethers, BigNumber  }  from 'ethers';
import { keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack } from 'ethers/lib/utils';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';

import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';
import YieldProxy from '../contracts/YieldProxy.json';

import {
  IDelegableMessage,
  IDomain,
  DaiPermitMessage,
  ERC2612PermitMessage,
} from '../types';

import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './appHooks';


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
  [1, { id: 1, desc:'Allow the Yield Proxy contract to interact with the Yield protocol on your behalf' }],
  [2, { id: 2, desc:'Allow the Yield Proxy contract to interact with Dai on your behalf' }],
  [3, { id: 3, desc:'Allow the Yield Proxy contract to interact with this series on your behalf' }],
  [4, { id: 4, desc:'Allow the Yield Series to trade Dai on your behalf' }],
  [5, { id: 5, desc:'Allow the Yield Series to trade yDai on your behalf' }],
]);

export const useAuth = () => {
  const { account, provider, signer } = useSignerAccount();
  const { state: { deployedContracts } } = React.useContext(YieldContext);
  const { dispatch } = React.useContext(NotifyContext);

  const { actions: userActions } = React.useContext(UserContext);
  
  const controllerAddr = ethers.utils.getAddress(deployedContracts.Controller);
  const controllerContract = new ethers.Contract( controllerAddr, Controller.abi, provider);
  const proxyAddr = ethers.utils.getAddress(deployedContracts.YieldProxy);
  const proxyContract = new ethers.Contract( proxyAddr, YieldProxy.abi, signer);

  const daiAddr = ethers.utils.getAddress(deployedContracts.Dai);
  const fromAddr = account && ethers.utils.getAddress(account);

  const [authActive, setAuthActive] = React.useState<boolean>(false);

  const { handleTx, handleTxError } = useTxHelpers();

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

  /**
   *  Once off Yield Controller and Dai authorizations
   */
  const yieldAuth = async ( ) => {
    let controllerSig:any;
    let daiPermitSig:any;

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
        chainId: (await provider.getNetwork()).chainId,
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
      handleSignError(e);
      return;
    }

    /* Broadcast signatures */
    let tx:any;
    try {
      tx = await proxyContract.onboard(fromAddr, daiPermitSig, controllerSig);
    } catch (e) {
      handleTxError('Error authorizing contracts', tx, e);
      setAuthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload: { tx, message: 'Authorization pending...', type:'AUTH' } });
    await handleTx(tx);
    dispatch({ type: 'requestSigs', payload:[] });
    setAuthActive(false);
  };


  /**
   * Series/Pool authorisations that are required for each series.
   * 
   * @param yDaiAddress series yDai address to be authorised
   * @param poolAddress series pool address to be authorised
   * 
   */
  const poolAuth = async (
    yDaiAddress:string,
    poolAddress:string
  ) => {
    /* Sanitise input */
    const poolContract = new ethers.Contract( poolAddress, Pool.abi, provider);
    const yDaiAddr = ethers.utils.getAddress(yDaiAddress);
    const poolAddr = ethers.utils.getAddress(poolAddress);
    let poolSig;
    let daiSig;
    let yDaiSig;

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
        chainId: (await provider.getNetwork()).chainId,
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

      /* yDAi permit proxy */
      // @ts-ignore
      const yResult = await signERC2612Permit(provider.provider, yDaiAddr, fromAddr, proxyAddr, MAX_INT);
      yDaiSig = ethers.utils.joinSignature(yResult);
      dispatch({ type: 'signed', payload: auths.get(5) });

    } catch (e) {
      handleSignError(e);
      return;
    }

    /* Broadcast signatures */
    let tx:any;
    try {
      tx = await proxyContract.authorizePool(poolAddr, fromAddr, daiSig, yDaiSig, poolSig);
    } catch (e) {
      handleTxError('Error authorizing contracts', tx, e);
      setAuthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload: { tx, message: 'Authorization pending...', type:'AUTH' } });
    await handleTx(tx);
    dispatch({ type: 'requestSigs', payload:[] });
    setAuthActive(false);
  };

  return {
    yieldAuth,
    poolAuth,
    authActive
  };

};
