import React from 'react';
import { ethers, BigNumber }  from 'ethers';
import { NotifyContext } from '../contexts/NotifyContext';
// import { ConnectionContext } from '../contexts/ConnectionContext';
import { useSignerAccount } from './connectionHooks';
import YDai from '../contracts/YDai.json';

// ethers.errors.setLogLevel('error');

/**
 * Hook for interacting with the yield 'YDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useYDai = () => {

  // const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { provider, signer, account } = useSignerAccount();

  const { abi: yDaiAbi } = YDai;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ redeemActive, setRedeemActive ] = React.useState<boolean>(false);

  /**
   * Redeems yDai for dai after maturity
   * @param {string} yDaiAddress address of the yDai series to redeem from.
   * @param {BigNumber} amount in exact yDai available to burn
   */
  const redeem = async (
    yDaiAddress:string,
    amount: number
  ) => {
    let tx:any;
    // const parsedAmount = ethers.utils.parseEther(amount.toString());
    const parsedAmount = amount;
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const yDaiAddr = ethers.utils.getAddress(yDaiAddress);

    setRedeemActive(true);
    const contract = new ethers.Contract( yDaiAddr, yDaiAbi, signer );
    try {
      tx = await contract.redeem(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Redeeming funds.', type:'error' } } );
      setRedeemActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Redeeming ${amount} pending...`, type:'REDEEM' } } );
    await tx.wait();
    setRedeemActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Redeeming ${amount} complete.` } } );
  };

  /**
   * User yDai token allowance
   * 
   * @param {string} yDaiAddress address of the yDai series to redeem from.
   * @param {string} poolAddress address of the yDai series to redeem from.
   * 
   * @returns {number} allowance amount
   */
  const userAllowance = async (
    yDaiAddress:string,
    poolAddress: string
  ) => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const yDaiAddr = ethers.utils.getAddress(yDaiAddress);
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const contract = new ethers.Contract( yDaiAddr, yDaiAbi, provider );
    let res;
    try {
      res = await contract.allowance(fromAddr, marketAddr);
    }  catch (e) {
      console.log(e);
      res = BigNumber.from('0');
    }
    console.log(ethers.utils.formatEther(res.toString()));
    return parseFloat(ethers.utils.formatEther(res.toString()));
  };

  /**
   * yDai Series is Mature or not
   * 
   * @param {string} yDaiAddress address of the yDai series to redeem from.
   * 
   * @returns {boolean} allowance amount
   */
  const isMature = async (
    yDaiAddress:string,
  ) => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const yDaiAddr = ethers.utils.getAddress(yDaiAddress);
    const contract = new ethers.Contract( yDaiAddr, yDaiAbi, provider );
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