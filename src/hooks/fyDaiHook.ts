import { useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import FYDai from '../contracts/FYDai.json';

import { NotifyContext } from '../contexts/NotifyContext';
import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './appHooks';
import { cleanValue } from '../utils';

/**
 * Hook for interacting with the yield 'eDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useFYDai = () => {

  const { provider, signer, account } = useSignerAccount();
  const { abi: fyDaiAbi } = FYDai;
  const  { dispatch }  = useContext<any>(NotifyContext);
  const [ redeemActive, setRedeemActive ] = useState<boolean>(false);
  
  const { handleTx, handleTxBuildError } = useTxHelpers();

  /**
   * @dev Redeems fyDai for dai after maturity
   * @param {string} fyDaiAddress address of the fyDai series to redeem from.
   * @param {BigNumber} amount in exact fyDai available to burn precision
   */
  const redeem = async (
    fyDaiAddress:string,
    amount: string|BigNumber
  ) => {
    let tx:any;
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : (cleanValue(amount));
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const fyDaiAddr = ethers.utils.getAddress(fyDaiAddress);

    const overrides = {
      gasLimit: BigNumber.from('500000')
    };

    setRedeemActive(true);
    const contract = new ethers.Contract( fyDaiAddr, fyDaiAbi, signer );
    try {
      tx = await contract.redeem(fromAddr, toAddr, parsedAmount, overrides);
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

  return {
    hasBeenMatured, redeem, redeemActive
  } as const;
};