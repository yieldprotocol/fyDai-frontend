import React from 'react';
import { ethers, BigNumber }  from 'ethers';

import Pool from '../contracts/Pool.json';

import { NotifyContext } from '../contexts/NotifyContext';
import { useSignerAccount } from './connectionHooks';

/**
 * Hook for interacting with the yield 'Pool' Contract
 */
export const usePool = () => {
  const { fallbackProvider, provider, signer, account } = useSignerAccount();
  const { abi: poolAbi } = Pool;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ sellActive, setSellActive ] = React.useState<boolean>(false);
  const [ buyActive, setBuyActive ] = React.useState<boolean>(false);


  /* Notification Helpers */
  const txComplete = (tx:any) => {
    dispatch({ type: 'txComplete', payload:{ tx } } );
  }; 
  const handleTxError = (msg:string, tx: any, e:any) => {
    // eslint-disable-next-line no-console
    console.log(e.message);
    dispatch({ type: 'notify', payload:{ message: msg, type:'error' } } );
    txComplete(tx);
  };

  /**
   * @dev Sell yDai for Dai ( Chai )
   * @note NOT limit pool
   * 
   * @param {string} poolAddress address of the yDai market series
   * @param {number} yDaiIn Amount of yDai being sold that will be taken from the user's wallet (in human numbers)
   *
   * @return Amount of chai that will be deposited on `to` wallet
   */
  const sellYDai = async (
    poolAddress:string,
    yDaiIn: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(yDaiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(poolAddress);

    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };
    
    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.sellYDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxError('Error Selling yDai', tx, e);
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Sell yDai ${yDaiIn} pending...`, type:'SELL' } } );
    await tx.wait();
    setSellActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * @dev Buy yDai with dai/chai
   * @note NOT limit pool
   *
   * @param {string} poolAddress address of the yDai series market.
   * @param {number} yDaiOut Amount of yDai being bought that will be deposited in `to` wallet
   * @return Amount of chai/Dai that will be taken from `from` wallet
   */
  const buyYDai = async (
    yDaiAddress:string,
    poolAddress:string,
    yDaiOut: number
  ) => {
    const parsedAmount = ethers.utils.parseEther(yDaiOut.toString());
    const fromAddr = ethers.utils.getAddress(yDaiAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('250000')
    };

    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.buyYDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxError('Error Buying yDai', tx, e);
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying yDai ${yDaiOut} pending...`, type:'BUY' } } );
    await tx.wait();
    setSellActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };

  /**
   * @dev Sell Dai/Chai for yDai
   * @note NOT limit pool
   * 
   * @param {string} poolAddress address of the yDai series market.
   * @param {number} daiIn Amount of yDai being bought that will be deposited in `to` wallet
   * @param {number} queue The number that this transaction is in the queue. // TODO extend the queue system globally
   * @return Amount of yDai that will be deposited on `to` wallet
   * 
   */
  const sellDai = async (
    poolAddress:string,
    daiIn: number,
    queue: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(poolAddress);

    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };

    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.sellDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxError('Error Selling Dai', tx, e);
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Selling ${daiIn} DAI pending...`, type:'SELL' } } );
    await tx.wait();
    setSellActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * @dev Buy Dai/Chai with yDai
   * @note NOT limit pool
   * 
   * @param {string} yDaiAddress address of the yDai contract.
   * @param {string} poolAddress address of the yDai series market.
   * @param {number} daiOut Amount of dai/chai being bought that will be deposited in `to` wallet
   * @param {number} queue The number that this transaction is in the queue. // TODO extend the queue system globally
   * 
   * @return Amount of yDai that will be taken from `from` wallet
   *
   */
  const buyDai = async (
    poolAddress:string,
    daiOut: number,
    queue: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiOut.toString());
    // const parsedAmount = daiOut;
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(poolAddress);
    
    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };

    let tx:any;
    setBuyActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.buyDai(fromAddr, toAddr, parsedAmount, overrides );
    } catch (e) {
      handleTxError('Error Buying Dai', tx, e);
      setBuyActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying ${daiOut} Dai pending...`, type:'BUY' } } );
    await tx.wait();
    setBuyActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };

  /**
   * @dev Delegate a 3rd party to act on behalf of the user in the Pool contracts
   * @param {string} poolAddress address of the market in question.
   * @param {string} delegatedAddress address of the contract/entity getting delegated. 
   */
  const addPoolDelegate = async (
    poolAddress:string,
    delegatedAddress:string,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const delegatedAddr = ethers.utils.getAddress(delegatedAddress);
    /* Contract interaction */
    const contract = new ethers.Contract(
      marketAddr,
      poolAbi,
      signer
    );
    try {
      tx = await contract.addDelegate(delegatedAddr);
    } catch (e) {
      handleTxError('Add delegate transaction was aborted or it failed.', tx, e);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: 'Pending once-off delegation ...', type:'DELEGATION' } } );
    await tx.wait();
    txComplete(tx);
  };

  

  /**
   * @dev Checks to see if an account (user) has delegated a contract/3rd Party for a particular market. 
   * 
   * @param {string} poolAddress address of the market in question.
   * @param {string} delegateAddress address of the Proxy (contract getting approved). 
   * 
   * @returns {Promise<boolean>} approved ?
   * 
   * @note call function 
   */
  const checkPoolDelegate = async (
    poolAddress:string,
    delegateAddress:string
  ): Promise<boolean> => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const delegateAddr = ethers.utils.getAddress(delegateAddress);
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const contract = new ethers.Contract( marketAddr, poolAbi, provider);
    let res;
    try {
      res = await contract.delegated(fromAddr, delegateAddr);
    }  catch (e) {
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Preview buy/sell transactions
   * 
   * sellYDai -> Returns how much Dai would be obtained by selling x yDai
   * buyDai -> Returns how much yDai would be required to buy x Dai
   * buyYDai -> Returns how much Dai would be required to buy x yDai
   * sellDai -> Returns how much yDai would be obtained by selling x Dai
   * 
   * @param {string} txType string represnting transaction type //TODO tyescript it out
   * @param {string} poolAddress address of the yDai series to redeem from.
   * @param {number} amount input to preview
   *  
   * @returns {BigNumber} BigNumber in WEI/WAD precision - Dai or yDai (call dependent)
   * 
   * @note call function 
   */
  const previewPoolTx = async (
    txType: string,
    poolAddress: string,
    amount: number,
  ): Promise<BigNumber> => {

    const type=txType.toUpperCase();
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const poolAddr = ethers.utils.getAddress(poolAddress);
    // TODO > check the || provider. might get buggy
    const contract = new ethers.Contract( poolAddr, poolAbi, fallbackProvider||provider);
    try {
      switch (type) {
        case 'BUYDAI':
          return await contract.buyDaiPreview(parsedAmount);
        case 'SELLDAI': 
          return await contract.sellDaiPreview(parsedAmount);
        case 'BUYYDAI':
          return await contract.buyYDaiPreview(parsedAmount);
        case 'SELLYDAI':
          return await contract.sellYDaiPreview(parsedAmount);
        default: 
          return BigNumber.from('0');
      }
    } catch (e) {
      console.log('Error:', e);
      return BigNumber.from('0');
    }
  };

  return {  
    sellYDai,
    buyYDai,
    sellDai,
    buyDai, 
    sellActive, 
    buyActive,

    checkPoolDelegate,
    addPoolDelegate,
    previewPoolTx, 

  } as const;
};
