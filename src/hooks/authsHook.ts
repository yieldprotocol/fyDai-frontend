import React from 'react';
import { ethers, BigNumber  }  from 'ethers';

import { keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack } from 'ethers/lib/utils';
import { signDaiPermit, signERC2612Permit }  from 'eth-permit';

import * as utils from '../utils';

import { useSignerAccount } from '.';
import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';

import Controller from '../contracts/Controller.json';
import Dai from '../contracts/TestDai.json';
// import ERC20Permit from '../contracts/ERC20Permit.json';
import YDai from '../contracts/YDai.json';

import YieldProxy from '../contracts/YieldProxy.json';
import AccountLayer from '../containers/layers/AccountLayer';

const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

// import Controller from '../contracts/Controller.json';

interface IDelegableMessage {
  user: string;
  delegate: string;
  nonce: number | string;
  deadline: number | string;
}

interface DaiPermitMessage {
  holder: string;
  spender: string;
  nonce: number;
  expiry: number | string;
  allowed?: boolean;
}

interface ERC2612PermitMessage {
  owner: string;
  spender: string;
  value: number | string;
  nonce: number | string;
  deadline: number | string;
}

interface IDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const createTypedDaiData = (message: DaiPermitMessage, domain: IDomain) => {
  const typedData = {
    types: {
      EIP712Domain,
      Permit: [
        { name: 'holder', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'allowed', type: 'bool' },
      ],
    },
    primaryType: 'Permit',
    domain,
    message,
  };
  return JSON.stringify(typedData);
};


const createTypedERC2612Data = (message: ERC2612PermitMessage, domain: IDomain) => {
  const typedData = {
    types: {
      EIP712Domain,
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    domain,
    message,
  };
  return JSON.stringify(typedData);
};

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


export const useAuth = () => {

  const { account, provider, signer } = useSignerAccount();
  const { state: { deployedContracts } } = React.useContext(YieldContext);
  const controllerAddr = ethers.utils.getAddress(deployedContracts.Controller);
  const daiAddr = ethers.utils.getAddress(deployedContracts.Dai);
  const proxyAddr = ethers.utils.getAddress(deployedContracts.YieldProxy);
  const fromAddr = account && ethers.utils.getAddress(account);

  const controllerContract = new ethers.Contract( controllerAddr, Controller.abi, provider);
  const daiContract = new ethers.Contract( daiAddr, Dai.abi, signer);
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
   *  Once off Yield Controller and Dai authorization
   * 
   */
  const yieldAuth = async ( ) => {

    /**
     * 
     * Dai permit yieldProxy 
     * 
     * */

    // @ts-ignore
    const result = await signDaiPermit(provider.provider, daiAddr, fromAddr, proxyAddr);


    await daiContract.permit(fromAddr, proxyAddr, result.expiry, result.nonce, true, result.v, result.r, result.s);

    const { r, s, v } = result;
    const daiPermitSig = ethers.utils.joinSignature({ r, s, v });


    // const daiNonce = await daiContract.nonces(fromAddr);
    // const daiName = await daiContract.name();

    // const pMsg: DaiPermitMessage = {
    //   holder: fromAddr||'',
    //   spender: proxyAddr,
    //   nonce: daiNonce.toHexString(),
    //   expiry: MAX_INT,
    //   allowed: true,
    // };
    // const pDomain: IDomain = {
    //   name: daiName,
    //   version: '1',
    //   chainId: (await provider.getNetwork()).chainId,
    //   verifyingContract: daiAddr,
    // };
    // const daiPermitSig = await sendForSig(
    //   provider.provider, 
    //   'eth_signTypedData_v4', 
    //   [fromAddr, createTypedDaiData(pMsg, pDomain)],
    // );

    /**
     * 
     * controller delegation
     * 
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
    const controllerSig = await sendForSig(
      provider.provider, 
      'eth_signTypedData_v4', 
      [fromAddr, createTypedDelegableData(msg, domain)],
    );

    console.log(daiPermitSig);
    console.log(controllerSig);

    /**
     * Contract interaction
     * */
    let tx:any;
    try {
      tx = await proxyContract.onboard(fromAddr, daiPermitSig, controllerSig);
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


  /**
   * 
   * 
   * 
   */
  const poolAuth = (
    yDaiAddress:string,
    poolAddress:string
  ) => {


  };

  return {
    yieldAuth,
    poolAuth,
  };

};
