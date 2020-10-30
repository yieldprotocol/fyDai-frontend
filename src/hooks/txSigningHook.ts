import { useState, useContext } from 'react';
import { ethers }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';

import {
  IDelegableMessage,
  IDomain,
} from '../types';
import { MAX_INT } from '../utils';

import { TxContext } from '../contexts/TxContext';
import { useSignerAccount } from './connectionHooks';

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

export const useTxSigning = () => {
  const { account, provider, chainId } = useSignerAccount();
  const { dispatch } = useContext(TxContext);
  const fromAddr = account && ethers.utils.getAddress(account);
  const [signActive, setSignActive] = useState<boolean>(false);

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

  const delegationSignature = async (delegationContract:any, delegateAddr:string) => {
    setSignActive(true);
    const _nonce = await delegationContract.signatureCount(fromAddr) ;
    const msg: IDelegableMessage = {
      // @ts-ignore
      user: fromAddr,
      delegate: delegateAddr,
      nonce: _nonce.toHexString(),
      deadline: MAX_INT,
    };
    const domain: IDomain = {
      name: 'Yield',
      version: '1',
      chainId: chainId || 1,
      verifyingContract: delegationContract.address,
    };
    
    const sig = await sendForSig(
      provider.provider, 
      'eth_signTypedData_v4', 
      [fromAddr, createTypedDelegableData(msg, domain)],
    );
    setSignActive(false);
    return sig;
  };

  const daiPermitSignature = async (permitContractAddr:any, permitAddr:string) => {
    setSignActive(true);
    const dResult = await signDaiPermit(
      provider.provider, 
      permitContractAddr, 
      fromAddr as string, 
      permitAddr
    );
    const sig = ethers.utils.joinSignature(dResult);
    setSignActive(false);
    return sig;
  };

  const ERC2612PermitSignature = async (permitContractAddr:any, permitAddr:string) => {
    setSignActive(true);
    const yResult = await signERC2612Permit(
      provider.provider, 
      permitContractAddr, 
      fromAddr as string, 
      permitAddr, 
      MAX_INT
    );
    const sig = ethers.utils.joinSignature(yResult);
    setSignActive(false);
    return sig;
  };

  const handleSignError = (e:any) =>{
    // eslint-disable-next-line no-console
    console.log(e);
    dispatch({ type: 'requestSigs', payload:[] });
    setSignActive(false);
  };

  return {
    signActive,
    handleSignError,
    delegationSignature,
    daiPermitSignature,
    ERC2612PermitSignature,
  };

};