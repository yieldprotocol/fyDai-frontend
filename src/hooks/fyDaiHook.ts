import { useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { parse } from 'mathjs';
import FYDai from '../contracts/FYDai.json';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';
import { cleanValue } from '../utils';
import { IYieldSeries } from '../types';

/**
 * Hook for interacting with the yield 'eDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useFYDai = () => {
  const { provider, signer, account } = useSignerAccount();
  const { abi: fyDaiAbi } = FYDai;
  const [ redeemActive, setRedeemActive ] = useState<boolean>(false);
  const { handleTx, handleTxRejectError } = useTxHelpers();

  /**
   * @dev Redeems fyDai for dai after maturity
   * @param {IYieldSeries} series to redeem from.
   * @param {BigNumber} amount in exact fyDai available to burn precision
   */
  
  // TODO accept series rather than 
  const redeem = async (
    series: IYieldSeries,
    amount: string|BigNumber
  ) => {
    let tx:any;
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : (cleanValue(amount));
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const fyDaiAddr = ethers.utils.getAddress(series.fyDaiAddress);

    const overrides = {
      gasLimit: BigNumber.from('500000')
    };

    setRedeemActive(true);
    const contract = new ethers.Contract( fyDaiAddr, fyDaiAbi, signer );
    try {
      tx = await contract.redeem(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxRejectError(e);
      setRedeemActive(false);
      return;
    }
    await handleTx({ 
      tx, 
      msg: `Redeeming ${amount} pending...`, 
      type:'REDEEM', 
      series, 
      value: parsedAmount.toString()
    });
    setRedeemActive(false);
  };

  /**
   * @dev fyDai Series is Mature or not?
   * @param {string} fyDaiAddress address of the fyDai series to check.
   * @returns {boolean}
   */
  const hasBeenMatured = async (
    fyDaiAddress:string,
  ) => {
    const fyDaiAddr = ethers.utils.getAddress(fyDaiAddress);
    const contract = new ethers.Contract( fyDaiAddr, fyDaiAbi, provider );
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

  /**
   * @dev fyDai Series symbol
   * @param {string} fyDaiAddress address of the fyDai series to check.
   * @returns {boolean}
   */
  const seriesSymbol = async (
    fyDaiAddress:string,
  ) => {
    const fyDaiAddr = ethers.utils.getAddress(fyDaiAddress);
    const contract = new ethers.Contract( fyDaiAddr, fyDaiAbi, provider );
    let res;
    try {
      res = await contract.symbol();
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = '';
    }
    return res;
  };

  /**
   * @dev fyDai Series maturity 
   * @param {string} fyDaiAddress address of the fyDai series to check.
   * @returns {boolean}
   */
  const seriesMaturity = async (
    fyDaiAddress:string,
  ) => {
    const fyDaiAddr = ethers.utils.getAddress(fyDaiAddress);
    const contract = new ethers.Contract( fyDaiAddr, fyDaiAbi, provider );
    let res;
    try {
      res = await contract.maturity();
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = BigNumber.from('0');
    }
    return res;
  };

  return {
    seriesMaturity,
    seriesSymbol,
    hasBeenMatured, 
    redeem, 
    redeemActive
  } as const;
};