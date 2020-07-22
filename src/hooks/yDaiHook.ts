import React from 'react';
import { ethers, BigNumber }  from 'ethers';
import { NotifyContext } from '../contexts/NotifyContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import YDai from '../contracts/YDai.json';

// ethers.errors.setLogLevel('error');

/**
 * Hook for interacting with the yield 'YDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useYDai = () => {

  const { state: { signer, account } } = React.useContext(ConnectionContext);
  // const { library, account } = useWeb3React();
  // const signer = library.getSigner();

  const { abi: yDaiAbi } = YDai;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ redeemActive, setRedeemActive ] = React.useState<boolean>(false);

  /**
   * Redeems yDai for dai after maturity
   * @param {string} yDaiAddress address of the yDai series to redeem from.
   * @param {number} amount in human understandable numbers.
   */
  const redeem = async (
    yDaiAddress:string,
    amount: number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
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
   * User yDai token alloance 
   * @param {string} yDaiAddress address of the yDai series to redeem from.
   * @param {string} marketAddress address of the yDai series to redeem from.
   * 
   * @returns {number} allowance amount
   */
  const userAllowance = async (
    yDaiAddress:string,
    marketAddress: string
  ) => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const yDaiAddr = ethers.utils.getAddress(yDaiAddress);
    const marketAddr = ethers.utils.getAddress(marketAddress);
    const contract = new ethers.Contract( yDaiAddr, yDaiAbi, signer );
    let res;
    try {
      res = await contract.allowance(fromAddr, marketAddr);
    }  catch (e) {
      // dispatch({ type: 'notify', payload:{ message:'Error Redeeming funds.', type:'error' } } );
      console.log(e);
      res = BigNumber.from('0');
    }
    return parseFloat(ethers.utils.formatEther(res));
  };

  return {
    redeem, redeemActive, userAllowance
  } as const;
};