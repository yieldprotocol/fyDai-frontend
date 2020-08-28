import React from 'react';
import { ethers, BigNumber  }  from 'ethers';

import { keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack } from 'ethers/lib/utils';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';

import * as utils from '../utils';

import { useSignerAccount } from '.';
import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';

import Controller from '../contracts/Controller.json';
import Dai from '../contracts/TestDai.json';
// import ERC20Permit from '../contracts/ERC20Permit.json';
import YDai from '../contracts/YDai.json';
import Pool from '../contracts/Pool.json';

import YieldProxy from '../contracts/YieldProxy.json';
import AccountLayer from '../containers/layers/AccountLayer';

import {
  IDelegableMessage,
  DaiPermitMessage,
  ERC2612PermitMessage,
  IDomain 
} from '../types';

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
  [1, 'Allow the yield Proxy contract to interact with the Yield protocol on your behalf'],
  [2, 'Allow the yield Proxy contract to interact with DAI on your behalf'],
  [3, 'Allow the yield Proxy contract to interact with this series on your behalf'],
  [4, 'Allow the yield Pool to trade DAI on your behalf for this series'],
  [5, 'Allow the yield Pool to trade yDAI on your behalf for this series'],
]);

export const useAuth = () => {

  const { account, provider, signer } = useSignerAccount();
  const { state: { deployedContracts } } = React.useContext(YieldContext);
  const { dispatch } = React.useContext(NotifyContext);
  
  const controllerAddr = ethers.utils.getAddress(deployedContracts.Controller);
  const daiAddr = ethers.utils.getAddress(deployedContracts.Dai);
  const proxyAddr = ethers.utils.getAddress(deployedContracts.YieldProxy);
  const fromAddr = account && ethers.utils.getAddress(account);

  const controllerContract = new ethers.Contract( controllerAddr, Controller.abi, provider);
  const proxyContract = new ethers.Contract( proxyAddr, YieldProxy.abi, signer);

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
        console.error(result.error);
        reject(result.error);
      } else {
        resolve(result.result);
      }
    };
    _provider.sendAsync( payload, callback );
  });

  /**
   * 
   *  Once off Yield Controller and Dai authorizations
   * 
   */
  const yieldAuth = async ( ) => {

    /**
     * yieldProxy | Controller delegation
     * */
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

    dispatch({ type: 'sigRequested', payload: auths.get(1) });
    const controllerSig = await sendForSig(
      provider.provider, 
      'eth_signTypedData_v4', 
      [fromAddr, createTypedDelegableData(msg, domain)],
    );
    dispatch({ type: 'signed', payload: auths.get(1) });

    /**
     * Dai permit yieldProxy 
     * */
    dispatch({ type: 'sigRequested', payload: auths.get(2) });
    // @ts-ignore
    const result = await signDaiPermit(provider.provider, daiAddr, fromAddr, proxyAddr);
    const daiPermitSig = ethers.utils.joinSignature(result);
    dispatch({ type: 'signed', payload: auths.get(2) });

    /**
     * Send Permits and delegations 
     * */
    let tx:any;
    try {
      tx = await proxyContract.onboard(fromAddr, daiPermitSig, controllerSig);
    } catch (e) {
      console.log(e);
      return;
    }
    await tx.wait();
    // eslint-disable-next-line consistent-return
    return tx;
  };

  /**
   * 
   * Auths, Delegations and permits required for Pool interactions
   * 
   */
  const poolAuth = async (
    yDaiAddress:string,
    poolAddress:string
  ) => {
    const poolContract = new ethers.Contract( poolAddress, Pool.abi, provider);
    // const daiNonce = await daiContract.nonces(fromAddr);
    // const daiName = await daiContract.name();

    /**
     * YieldProxy | Pool delegation 
     * */
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
      verifyingContract: poolAddress,
    };
    dispatch({ type: 'sigRequested', payload: auths.get(3) });
    const poolSig = await sendForSig(
      provider.provider, 
      'eth_signTypedData_v4', 
      [fromAddr, createTypedDelegableData(msg, domain)],
    );
    dispatch({ type: 'signed', payload: auths.get(3) });

    /**
     * Dai permit pool
     */
    dispatch({ type: 'sigRequested', payload: auths.get(4) });
    // @ts-ignore
    const dResult = await signDaiPermit(provider.provider, daiAddr, fromAddr, poolAddress);
    const daiSig = ethers.utils.joinSignature(dResult);
    dispatch({ type: 'signed', payload: auths.get(4) });

    /**
     * yDAi permit pool
     */
    dispatch({ type: 'sigRequested', payload: auths.get(5) });
    // @ts-ignore
    const yResult = await signERC2612Permit(provider.provider, yDaiAddress, fromAddr, proxyAddr, MAX_INT);
    const yDaiSig = ethers.utils.joinSignature(yResult);
    dispatch({ type: 'signed', payload: auths.get(5) });

    /**
     * Contract interaction
     * */
    let tx:any;
    try {
      tx = await proxyContract.authorizePool(poolAddress, fromAddr, daiSig, yDaiSig, poolSig);
    } catch (e) {
      console.log(e);
      return;
    }

    /* Transaction reporting & tracking */
    await tx.wait();
    console.log(tx);
    // eslint-disable-next-line consistent-return
    return tx;

  };

  return {
    yieldAuth,
    poolAuth,
  };

};
