import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import * as utils from '../utils';

import { IYieldSeries } from '../types';

import DSProxy from '../contracts/DSProxy.json';

import { TxContext } from '../contexts/TxContext';
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

  /* contexts */
  const  { dispatch }  = useContext<any>(TxContext);
  const  { state: { authorization } }  = useContext<any>(UserContext);

  /* hooks */ 
  const { signer, account } = useSignerAccount();
  const { handleTx, handleTxRejectError } = useTxHelpers();
  
  /* Activity flags */
  const [ executeActive, setExecuteActive ] = useState<boolean>(false);

  /* Preset the dsProxy contract for the user to be used with all fns */
  const { abi: DsProxyAbi } = DSProxy;
  const [ dsProxyContract, setDsProxyContract] = useState<any>();
  useEffect(()=>{
      authorization?.dsProxyAddress && signer &&
      setDsProxyContract( new ethers.Contract(
        ethers.utils.getAddress(authorization?.dsProxyAddress),
        DsProxyAbi,
        signer
      ));
  }, [signer, authorization, DsProxyAbi]);

  const dsExecute = async (
    contractAddress: string,
    calldata: any,
    overrides: any,
    msg: string,
    type: string,
    series: IYieldSeries,
  ) => {
    let tx:any; // type
    setExecuteActive(true);
    try {
      tx = await dsProxyContract.methods['execute(address,bytes)'](contractAddress, calldata, overrides);
    } catch (e) {
      handleTxRejectError(e);
      setExecuteActive(false);
      return;
    }
    await handleTx({ tx, msg, type, series });
    setExecuteActive(true);
  };

  return {
    /* dsProxy eq. fns */
    dsExecute, executeActive,
  } as const;
};