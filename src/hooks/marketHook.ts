import React from 'react';
import { ethers, BigNumber }  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext';
import { ConnectionContext } from '../contexts/ConnectionContext';

// import { YieldContext } from '../contexts/YieldContext';

import Market from '../contracts/Market.json';
import TestERC20 from '../contracts/TestERC20.json';
import YDai from '../contracts/YDai.json';

/**
 * Hook for interacting with the yield 'Market' Contract
 * @returns { function } redeem
 * 
 * @returns { boolean } redeemActive
 */
export const useMarket = () => {
  const { state: { provider, signer, account } } = React.useContext(ConnectionContext);
  // const { library, account } = useWeb3React();
  // const signer = library.getSigner();

  const { abi: marketAbi } = Market;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ approveActive, setApproveActive ] = React.useState<boolean>(false);
  const [ sellActive, setSellActive ] = React.useState<boolean>(false);
  const [ buyActive, setBuyActive ] = React.useState<boolean>(false);

  /**
   * Approve the market contracts to transact with DAI or yDai token.
   * (Not strictly a Controller Contract function. But associated enough to keep in here.)
   * @param {string} tokenAddress address of the token to approve.
   * @param {string} marketAddress address of the market.
   * @param {number} amount to approve (in human understandable numbers)
   */
  const approveToken = async (
    tokenAddress:string,
    marketAddress:string,
    amount:number
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const marketAddr = ethers.utils.getAddress(marketAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    
    /* Contract interaction */
    setApproveActive(true);
    const contract = new ethers.Contract(
      tokenAddr,
      YDai.abi,
      signer
    );
    try {
      tx = await contract.approve(marketAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setApproveActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Token approval of ${amount} pending...` } } );
    await tx.wait();
    setApproveActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Token approval of ${amount} complete. ${tokenAddress} and ${marketAddress}` } } );
  };

  /**
   * Sell yDai for Dai ( Chai )
   * 
   * @param {string} marketAddress address of the yDai market series
   * @param {number} yDaiIn Amount of yDai being sold that will be taken from the user's wallet (in human numbers)
   *
   * @return Amount of chai that will be deposited on `to` wallet
   */
  const sellYDai = async (
    marketAddress:string,
    yDaiIn: number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(yDaiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(marketAddress);
    setSellActive(true);
    /// @param from Wallet providing the yDai being sold. Must have approved the operator with `market.addDelegate(operator)`.
    /// @param to Wallet receiving the chai being bought
    /// @param yDaiIn Amount of yDai being sold that will be taken from the user's wallet
    const contract = new ethers.Contract( marketAddr, marketAbi, signer );
    try {
      tx = await contract.sellYDai(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Selling yDai!', type:'error' } } );
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Sell yDai ${yDaiIn} pending...`, type:'SELL' } } );
    await tx.wait();
    setSellActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Sell yDai ${yDaiIn} complete.` } } );
  };


  /**
   * @dev Buy yDai for dai/chai
   *
   * @param {string} marketAddress address of the yDai series market.
   * @param {number} yDaiOut Amount of yDai being bought that will be deposited in `to` wallet
   *
   * @return Amount of chai/Dai that will be taken from `from` wallet
   */
  const buyYDai = async (
    yDaiAddress:string,
    marketAddress:string,
    yDaiOut: number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(yDaiOut.toString());
    const fromAddr = ethers.utils.getAddress(yDaiAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(marketAddress);
    setSellActive(true);
    /// @param from Wallet providing the chai being sold. Must have approved the operator with `market.addDelegate(operator)`.
    /// @param to Wallet receiving the yDai being bought
    /// @param yDaiOut Amount of yDai being bought that will be deposited in `to` wallet
    const contract = new ethers.Contract( marketAddr, marketAbi, signer );
    try {
      tx = await contract.buyYDai(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Buying yDai!', type:'error' } } );
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying yDai ${yDaiOut} pending...`, type:'SELL' } } );
    await tx.wait();
    setSellActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Buying yDai ${yDaiOut} complete.` } } );
  };


  /**
   * @dev Sell Dai/Chai for yDai
   * 
   * @param {string} marketAddress address of the yDai series market.
   * @param {number} daiIn Amount of yDai being bought that will be deposited in `to` wallet
   * @param {number} queue The number that this transaction is in the queue. // TODO extend the queue system globally
   * @return Amount of yDai that will be deposited on `to` wallet
   * 
   */
  const sellDai = async (
    marketAddress:string,
    daiIn: number,
    queue: number,
  ) => {
    let tx:any;

    const noncePromise = signer.getTransactionCount();
    const overrides = { nonce: noncePromise.then((nonce:any) => nonce + queue) };

    const parsedAmount = ethers.utils.parseEther(daiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(marketAddress);
    setSellActive(true);
    /// @param from Wallet providing the chai being sold. Must have approved the operator with `market.addDelegate(operator)`.
    /// @param to Wallet receiving the yDai being bought
    /// @param chaiIn Amount of chai being sold that will be taken from the user's wallet
    const contract = new ethers.Contract( marketAddr, marketAbi, signer );
    try {
      tx = await contract.sellDai(fromAddr, toAddr, parsedAmount, await overrides);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Buying yDai!', type:'error' } } );
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Selling yDai ${daiIn} pending...`, type:'SELL' } } );
    await tx.wait();
    setSellActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Selling yDai ${daiIn} complete.` } } );
  };


  /**
   * @dev Buy Dai/Chai for yDai
   * 
   * @param {string} yDaiAddress address of the yDai contract.
   * @param {string} marketAddress address of the yDai series market.
   * @param {number} daiOut Amount of dai/chai being bought that will be deposited in `to` wallet
   * @param {number} queue The number that this transaction is in the queue. // TODO extend the queue system globally
   * 
   * @return Amount of yDai that will be taken from `from` wallet
   *
   */
  const buyDai = async (
    marketAddress:string,
    daiOut: number,
    queue: number,
  ) => {
    let buyTx:any;

    const noncePromise = signer.getTransactionCount();
    const overrides = { nonce: noncePromise.then((nonce:any) => nonce + queue) };

    const parsedAmount = ethers.utils.parseEther(daiOut.toString());
    // const parsedAmount = daiOut;
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(marketAddress);
    setBuyActive(true);
    /// @param from Wallet providing the yDai being sold. Must have approved the operator with `market.addDelegate(operator)`.
    /// @param to Wallet receiving the chai being bought
    /// @param chaiOut Amount of chai being bought that will be deposited in `to` wallet
    const contract = new ethers.Contract( marketAddr, marketAbi, signer );
    try {
      // console.log(parsedAmount);
      // console.log(ethers.utils.parseEther('1'));
      buyTx = await contract.buyDai(fromAddr, toAddr, parsedAmount, await overrides );
      console.log(buyTx);
    } catch (e) {
      console.log(e);
      dispatch({ type: 'notify', payload:{ message:'Error Buying Dai!', type:'error' } } );
      setBuyActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx: buyTx, message: `Buying ${daiOut} Dai pending...`, type:'BUYDAI' } } );
    await buyTx.wait();
    setBuyActive(false);
    dispatch({ type: 'txComplete', payload:{ tx: buyTx, message:`Buying ${daiOut} Dai complete.` } } );
  };

  /**
   * Preview transactions
   * 
   * Call function
   * 
   * sellYDai -> Returns how much Dai would be obtained by selling x yDai
   * buyDai -> Returns how much yDai would be required to buy x Dai
   * buyYDai -> Returns how much Dai would be required to buy x yDai
   * sellDai -> Returns how much yDai would be obtained by selling x Dai
   * 
   * @param {string} txType string represnting transaction type //TODO tyescript it out
   * @param {string} marketAddress address of the yDai series to redeem from.
   * @param {number} amount input to preview
   *  
   * @returns {BigNumber} BigNumber in WEI/WAD precision - Dai or yDai (call dependent)
   */
  const previewMarketTx = async (
    txType: string,
    marketAddress: string,
    amount: number
  ) => {
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const marketAddr = ethers.utils.getAddress(marketAddress);
    const contract = new ethers.Contract( marketAddr, marketAbi, provider);
    let result;
    try {
      switch (txType.toUpperCase()) {
        case 'BUYDAI':
          result = await contract.buyDaiPreview(parsedAmount); break;
        case 'SELLDAI': 
          result = await contract.sellDaiPreview(parsedAmount); break;
        case 'BUYYDAI':
          result = await contract.buyYDaiPreview(parsedAmount); break;
        case 'SELLYDAI':
          result = await contract.sellYDaiPreview(parsedAmount); break;
        default : result = BigNumber.from('0'); break;
      }
    } catch (e) {
      console.log(e);
      result = BigNumber.from('0');
    }
    return result;
  };

  return {
    approveToken, previewMarketTx, sellYDai, buyYDai, sellDai, buyDai, sellActive, buyActive, approveActive
  } as const;
};
