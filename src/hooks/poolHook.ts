import { useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import Pool from '../contracts/Pool.json';

import { NotifyContext } from '../contexts/NotifyContext';
import { useSignerAccount } from './connectionHooks';
import { IYieldSeries } from '../types';
import { useTxHelpers } from './appHooks';

/**
 * Hook for interacting with the yield 'Pool' Contract
 */
export const usePool = () => {
  const { fallbackProvider, provider, signer, account } = useSignerAccount();
  const { abi: poolAbi } = Pool;
  const  { dispatch }  = useContext<any>(NotifyContext);
  const [ sellActive, setSellActive ] = useState<boolean>(false);
  const [ buyActive, setBuyActive ] = useState<boolean>(false);
  const [ callActive, setCallActive ] = useState<boolean>(false);

  const { handleTx, handleTxError } = useTxHelpers();

  /**
   * @dev Sell eDai for Dai ( Chai )
   * @note NOT limit pool
   * 
   * @param {string} poolAddress address of the eDai market series
   * @param {number} eDaiIn Amount of eDai being sold that will be taken from the user's wallet (in human numbers)
   *
   * @return Amount of chai that will be deposited on `to` wallet
   */
  const sellEDai = async (
    poolAddress:string,
    eDaiIn: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(eDaiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const overrides = { 
      gasLimit: BigNumber.from('300000')
    };
    
    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.sellEDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxError('Error Selling eDai', tx, e);
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Sell eDai ${eDaiIn} pending...`, type:'SELL' } } );
    await handleTx(tx);
    setSellActive(false);
  };


  /**
   * @dev Buy eDai with dai/chai
   * @note NOT limit pool
   *
   * @param {string} poolAddress address of the eDai series market.
   * @param {number} eDaiOut Amount of eDai being bought that will be deposited in `to` wallet
   * @return Amount of chai/Dai that will be taken from `from` wallet
   */
  const buyEDai = async (
    eDaiAddress:string,
    poolAddress:string,
    eDaiOut: number
  ) => {
    const parsedAmount = ethers.utils.parseEther(eDaiOut.toString());
    const fromAddr = ethers.utils.getAddress(eDaiAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const overrides = { 
      gasLimit: BigNumber.from('250000')
    };

    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.buyEDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxError('Error Buying eDai', tx, e);
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying eDai ${eDaiOut} pending...`, type:'BUY' } } );
    await handleTx(tx);
    setSellActive(false);
  };

  /**
   * @dev Sell Dai/Chai for eDai
   * @note NOT limit pool
   * 
   * @param {string} poolAddress address of the eDai series market.
   * @param {number} daiIn Amount of eDai being bought that will be deposited in `to` wallet
   * @return Amount of eDai that will be deposited on `to` wallet
   * 
   */
  const sellDai = async (
    poolAddress:string,
    daiIn: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(poolAddress);

    const overrides = { 
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
    await handleTx(tx);
    setSellActive(false);
  };


  /**
   * @dev Buy Dai/Chai with eDai
   * @note NOT limit pool
   * 
   * @param {string} eDaiAddress address of the eDai contract.
   * @param {string} poolAddress address of the eDai series market.
   * @param {number} daiOut Amount of dai/chai being bought that will be deposited in `to` wallet
   * 
   * @return Amount of eDai that will be taken from `from` wallet
   *
   */
  const buyDai = async (
    poolAddress:string,
    daiOut: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiOut.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(poolAddress);
    
    const overrides = { 
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
    await handleTx(tx);
    setBuyActive(false);
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
    await handleTx(tx);
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
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Preview buy/sell transactions
   * 
   * sellEDai -> Returns how much Dai would be obtained by selling x eDai
   * buyDai -> Returns how much eDai would be required to buy x Dai
   * buyEDai -> Returns how much Dai would be required to buy x eDai
   * sellDai -> Returns how much eDai would be obtained by selling x Dai
   * 
   * @param {string} txType string represnting transaction type //TODO tyescript it out
   * @param {IYieldSeries} series eDai series to redeem from.
   * @param {number | BigNumber} amount input to preview
   * 
   * @note NB NB if in BigNumber must be in wei
   *  
   * @returns {BigNumber| null} BigNumber in WEI/WAD precision - Dai or eDai (call dependent)
   * 
   * @note call function 
   */
  const previewPoolTx = async (
    txType: string,
    series: IYieldSeries,
    amount: number | BigNumber,
  ): Promise<BigNumber|Error> => {
    const type=txType.toUpperCase();
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const contract = new ethers.Contract( poolAddr, poolAbi, fallbackProvider);
    let value = BigNumber.from('0');
    setCallActive(true);
    try {
      if ( series.isMature() === false ) {
        switch (type) {
          case 'BUYDAI':
            value = await contract.buyDaiPreview(parsedAmount); break;
          case 'SELLDAI': 
            value = await contract.sellDaiPreview(parsedAmount); break;
          case 'BUYEDAI':
            value = await contract.buyEDaiPreview(parsedAmount); break;
          case 'SELLEDAI':
            value = await contract.sellEDaiPreview(parsedAmount); break;
          default: 
            value = await BigNumber.from('0');
        } 
        console.log('PREVIEW: ', value.toString());
        setCallActive(false);
        return value; 
      }
      setCallActive(false);
      return value; // assuming that if the series has matured, the rates on whatever trade will be 0. 
    } catch (e) {

      setCallActive(false);
      return e;
    }
  };

  /**
   * @dev Checks the health/state of a particular pool
   *
   * 
   * @param {IYieldSeries} series series to check the pool state
   * @returns {active:boolean, reason:string} status of the pool
   * 
   * @note call function 
   */
  const checkPoolState = (
    series: IYieldSeries,
  ): any => {
    if ( series.isMature() ) { return { active: false, reason: 'Series is mature' };}
    if ( series.totalSupply?.isZero() ) { return { active: false, reason: 'Pool not initiated' };}
    if ( series.yieldAPR && !(Number.isFinite(series.yieldAPR)) ) { return { active: false, reason: 'Limited Liquidity' };}
    return { active:true, reason:'Pool is operational' };
  };

  return {  
    sellEDai,
    buyEDai,
    sellDai,
    buyDai, 
    sellActive, 
    buyActive,

    checkPoolDelegate,
    checkPoolState,
    addPoolDelegate,
    previewPoolTx,
    callActive,

  } as const;
};
