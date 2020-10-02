import { useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import EDai from '../contracts/EDai.json';

import { NotifyContext } from '../contexts/NotifyContext';
import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './appHooks';

/**
 * Hook for interacting with the yield 'eDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useEDai = () => {

  const { provider, signer, account } = useSignerAccount();
  const { abi: eDaiAbi } = EDai;
  const  { dispatch }  = useContext<any>(NotifyContext);
  const [ redeemActive, setRedeemActive ] = useState<boolean>(false);
  
  const { handleTx, handleTxBuildError } = useTxHelpers();

  /**
   * @dev Redeems eDai for dai after maturity
   * @param {string} eDaiAddress address of the eDai series to redeem from.
   * @param {BigNumber} amount in exact eDai available to burn
   */
  const redeem = async (
    eDaiAddress:string,
    amount: number
  ) => {
    let tx:any;
    const parsedAmount = amount;
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const eDaiAddr = ethers.utils.getAddress(eDaiAddress);

    setRedeemActive(true);
    const contract = new ethers.Contract( eDaiAddr, eDaiAbi, signer );
    try {
      tx = await contract.redeem(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      handleTxBuildError(e);
      setRedeemActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Redeeming ${amount} pending...`, type:'REDEEM' } } );
    await handleTx(tx);
    setRedeemActive(false);
  };

  /**
   * @dev eDai Series is Mature or not?
   * @param {string} eDaiAddress address of the eDai series to check.
   * @returns {boolean}
   */
  const hasBeenMatured = async (
    eDaiAddress:string,
  ) => {
    const eDaiAddr = ethers.utils.getAddress(eDaiAddress);
    const contract = new ethers.Contract( eDaiAddr, eDaiAbi, provider );
    let res;
    try {
      res = await contract.isMature();
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = BigNumber.from('0');
    }
    return res;
  };

  return {
    hasBeenMatured, redeem, redeemActive
  } as const;
};