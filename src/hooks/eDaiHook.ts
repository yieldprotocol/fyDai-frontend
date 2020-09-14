import React from 'react';
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

  // const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { provider, signer, account } = useSignerAccount();
  const { abi: eDaiAbi } = EDai;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ redeemActive, setRedeemActive ] = React.useState<boolean>(false);

  const { handleTx, handleTxError } = useTxHelpers();

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
    // const parsedAmount = ethers.utils.parseEther(amount.toString());
    const parsedAmount = amount;
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const eDaiAddr = ethers.utils.getAddress(eDaiAddress);

    setRedeemActive(true);
    const contract = new ethers.Contract( eDaiAddr, eDaiAbi, signer );
    try {
      tx = await contract.redeem(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      handleTxError('Error Redeeming funds.', tx, e);
      setRedeemActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Redeeming ${amount} pending...`, type:'REDEEM' } } );
    await handleTx(tx);
    setRedeemActive(false);
  };

  /**
   * @dev User eDai token allowance
   * @param {string} eDaiAddress address of the eDai series .
   * @param {string} poolAddress address of the pool.
   * @returns {number} allowance amount
   */
  const userAllowance = async (
    eDaiAddress:string,
    poolAddress: string
  ) => {
    if (account) {
      const fromAddr = account && ethers.utils.getAddress(account);
      const eDaiAddr = ethers.utils.getAddress(eDaiAddress);
      const poolAddr = ethers.utils.getAddress(poolAddress);
      const contract = new ethers.Contract( eDaiAddr, eDaiAbi, provider );
      let res;
      try {
        res = await contract.allowance(fromAddr, poolAddr);
      }  catch (e) {
        console.log(e);
        res = BigNumber.from('0');
      }
      console.log(ethers.utils.formatEther(res.toString()));
      return parseFloat(ethers.utils.formatEther(res.toString()));
    } 
    return 0;
  };

  /**
   * @dev eDai Series is Mature or not?
   * @param {string} eDaiAddress address of the eDai series to check.
   * @returns {boolean}
   */
  const isMature = async (
    eDaiAddress:string,
  ) => {
    const eDaiAddr = ethers.utils.getAddress(eDaiAddress);
    const contract = new ethers.Contract( eDaiAddr, eDaiAbi, provider );
    let res;
    try {
      res = await contract.isMature();
    }  catch (e) {
      console.log(e);
      res = BigNumber.from('0');
    }
    console.log('Series is mature?', res);
    return res;
  };

  return {
    isMature, redeem, redeemActive, userAllowance
  } as const;
};