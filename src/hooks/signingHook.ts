import { useContext } from 'react';
import { ethers }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';

import {
  IDelegableMessage,
  IDomain,
  ISignListItem,
} from '../types';

import { MAX_INT } from '../utils';

import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
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

export const useSigning = () => {
  const { account, provider, chainId } = useSignerAccount();
  const { dispatch } = useContext(TxContext);
  const { state: { preferences: { useTxApproval } } } = useContext(UserContext);

  // const fromAddr = dsProxyAddress && ethers.utils.getAddress(dsProxyAddress);
  const fromAddr = account && ethers.utils.getAddress(account);

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

  const delegationSignature = async (
    delegationContract:any, 
    delegateAddr:string,
  ) => {
    const _nonce = await delegationContract.signatureCount(fromAddr) ;
    const msg: IDelegableMessage = {
      // @ts-ignore
      user: fromAddr,
      delegate: delegateAddr,
      nonce: _nonce.toHexString(),
      deadline: MAX_INT,
    };
    
    const _domain: IDomain = {
      name: 'Yield',
      version: '1',
      chainId: chainId === 42? 42 : 1, // TODO remove this lock into kovan or mainnet
      verifyingContract: delegationContract.address,
    };

    const sig = await sendForSig(
      provider.provider, 
      'eth_signTypedData_v4', 
      [fromAddr, createTypedDelegableData( msg, _domain )], 
    );
    return sig;
  };

  const daiPermitSignature = async (
    permitContractAddr:string, 
    permitAddr:string,
    domain: IDomain | null = null  // Provid a custom domain if reqd. default null
  ) => {
    const dResult = await signDaiPermit(
      provider.provider, 
      domain || permitContractAddr,  // use custom domain if provided
      fromAddr as string, 
      permitAddr
    );
    const sig = ethers.utils.joinSignature(dResult);
    return sig;
  };

  const ERC2612PermitSignature = async (
    permitContractAddr:string, 
    permitAddr:string, 
    domain: IDomain | null = null // Provid a custom domain if reqd. default null
  ) => {
    const yResult = await signERC2612Permit(
      provider.provider, 
      domain || permitContractAddr,  // use custom domain if provided
      fromAddr as string, 
      permitAddr, 
      MAX_INT
    );
    const sig = ethers.utils.joinSignature(yResult);
    return sig;
  };

  const handleSignList = async ( 

    requestedSigs:Map<string, ISignListItem>, 
    txCode:string 
    
  ): Promise<Map<string, string|undefined>> => {

    const signedMap: Map<string, string|undefined> = new Map();

    /* Set activity flag and Send the requested signatures to the txContext for tracking */
    dispatch({
      type: 'setTxProcessActive',
      payload: {
        txCode,
        sigs: Array.from( requestedSigs.values()).map((x:any) => { 
          return { id: x.id, desc: x.desc, complete:x.conditional, signed:x.conditional }; 
        }) }
    });

    /* Fallback function for when using Tx approvals instead of signing permits */
    const fallback = async () => {
      // eslint-disable-next-line no-console
      console.log('Using fallback authorization strategy: Approvals by transaction');
      dispatch({ type: 'setFallbackActive', payload: true });

      /* stack and wait for ALL the approval transactions to be complete */
      await Promise.all(
        Array.from(requestedSigs.values()).map(async (x:any) =>  {
          if (!x.conditional) {
            try {
              const done = await x.fallbackFn();
              dispatch({ type: 'signed', payload:x });
              return done;    
            } catch (e) {
              handleSignError(e);
              // /* on error, return the map with values 'undefined' to cancel the transaction process */
              requestedSigs.forEach((value:any, key:string) => signedMap.set(key, undefined));
              return signedMap;
            }
          } return null;
        })
      ).catch((e:any) => {

        handleSignError(e);
        // /* on error, return the map with values 'undefined' to cancel the transaction process */
        requestedSigs.forEach((value:any, key:string) => signedMap.set(key, undefined));
        return signedMap;
      });

      /* then set all sigs to '0x' */
      requestedSigs.forEach((value:any, key:string) => signedMap.set(key, '0x'));       
      return signedMap;
    };

    /* Auth using the SIGN PERMIT auth strategy */
    if (!useTxApproval) {
      // eslint-disable-next-line no-console
      console.log('Using primary authorization strategy: Approvals by signing permit messages');
      dispatch({ type: 'setFallbackActive', payload: false });

      /* Deal wth the signtures  */    
      for await (const [key, value] of requestedSigs) {
        try {
          if (!value.conditional) {
            signedMap.set(key, await value.signFn() );
            dispatch({ type: 'signed', payload:value });
          } else {
            signedMap.set(key, '0x');
            dispatch({ type: 'signed', payload:value });
          }
        } catch (e) {
          /* If there is a problem with the signing, use the approve txs as a fallback, HOWEVER ignore if error code 4001 (user reject) */
          if ( e.code !== 4001 ) {
            return fallback();
          }       
          handleSignError(e);
          /* on error, return the map with an undefined to cancel the transaction process */
          requestedSigs.forEach((v:any, k:string) => signedMap.set(k, undefined)); 
          return signedMap;
        }
      }
      return signedMap;
    } 
    /* ELSE, if using TX APPROVAL auth strategy - got straight to fallback */
    return fallback();
  };

  const handleSignError = (e:any) =>{
    // eslint-disable-next-line no-console
    console.log(e);
    dispatch({ type: 'setTxProcessActive', payload:{ txCode:null, sigs:[] }  });
  };

  return {
    handleSignList,
    delegationSignature,
    daiPermitSignature,
    ERC2612PermitSignature,
  };

};