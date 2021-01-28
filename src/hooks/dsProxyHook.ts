import { useState, useContext } from 'react';
import { ethers }  from 'ethers';

import { ITx } from '../types';

import DSProxy from '../contracts/DSProxy.json';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';

/**
 * Hook for interacting with the Yield Proxy Contract.
 * 
 * @returns { function } dsBuild
 * @returns { boolean } buildActive
 * 
 */

export const useDsProxy = () => {
  
  /* Preset the dsProxy contract for the user to be used with all fns */
  const { abi: DsProxyAbi } = DSProxy;

  /* state from contexts */
  const  { state }  = useContext<any>(UserContext);

  /* local state */
  const [ executeActive, setExecuteActive ] = useState<boolean>(false);

  /* hooks */ 
  const { signer } = useSignerAccount();
  const { handleTx, handleTxRejectError } = useTxHelpers();

  const proxyExecute = async (
    contractAddress: string,
    calldata: any,
    overrides: any,
    txInfo: ITx,   
  ) => {
    const proxyAddr = state.authorization?.dsProxyAddress || null;
    const dsProxyContract = new ethers.Contract(
      ethers.utils.getAddress(proxyAddr),
      DsProxyAbi,
      signer
    );

    let tx:any; // type
    setExecuteActive(true);
    try {
      tx = await dsProxyContract['execute(address,bytes)'](contractAddress, calldata, overrides);
    } catch (e) {
      handleTxRejectError(e);
      setExecuteActive(false);
      return;
    }
    await handleTx({ ...txInfo, tx });
    setExecuteActive(true);
  };

  return {
    /* dsProxy eq. fns */
    proxyExecute, executeActive,
  } as const;
};