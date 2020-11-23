import { useState } from 'react';
import { ethers, BigNumber }  from 'ethers';

import Pool from '../contracts/Pool.json';

import { useSignerAccount } from './connectionHooks';
import { IYieldSeries } from '../types';
import { useTxHelpers } from './txHooks';
import { useDsProxy } from './dsProxyHook';

/**
 * Hook for interacting with the yield 'Pool' Contract
 */
export const usePool = () => {
  const { fallbackProvider, provider, signer, account } = useSignerAccount();
  const { abi: poolAbi } = Pool;
  const [ sellActive, setSellActive ] = useState<boolean>(false);
  const [ buyActive, setBuyActive ] = useState<boolean>(false);
  const [ callActive, setCallActive ] = useState<boolean>(false);

  const { handleTx, handleTxRejectError } = useTxHelpers();
  const { proxyExecute } = useDsProxy();

  /**
   * @dev Sell fyDai for Dai ( Chai )
   * @note NOT limit pool
   * 
   * @param {IYieldSeries} series of the fyDai market series
   * @param {number} fyDaiIn Amount of fyDai being sold that will be taken from the user's wallet (in human numbers)
   *
   * @return Amount of chai that will be deposited on `to` wallet
   */
  const sellFYDai = async (
    series:IYieldSeries,
    fyDaiIn: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(fyDaiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(series.poolAddress);
    const overrides = { 
      gasLimit: BigNumber.from('300000')
    };
    
    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.sellFYDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxRejectError(e);
      setSellActive(false);
      return;
    }
    await handleTx({ tx, msg: `Sell fyDai ${fyDaiIn} pending...`, type:'SELL', series });
    setSellActive(false);
  };

  /**
   * @dev Buy fyDai with dai/chai
   * @note NOT limit pool
   *
   * @param {IYieldSeries} series fyDai series market.
   * @param {number} fyDaiOut Amount of fyDai being bought that will be deposited in `to` wallet
   * @return Amount of chai/Dai that will be taken from `from` wallet
   */
  const buyFYDai = async (
    series:IYieldSeries,
    fyDaiOut: number
  ) => {
    const parsedAmount = ethers.utils.parseEther(fyDaiOut.toString());
    const fromAddr = ethers.utils.getAddress(series.fyDaiAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(series.poolAddress);
    const overrides = { 
      gasLimit: BigNumber.from('250000')
    };

    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.buyFYDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxRejectError(e);
      setSellActive(false);
      return;
    }
    await handleTx({ tx, msg: `Buying fyDai ${fyDaiOut} pending...`, type:'BUY', series });
    setSellActive(false);
  };

  /**
   * @dev Sell Dai/Chai for fyDai
   * @note NOT limit pool
   * 
   * @param {IYieldSeries} series fyDai.
   * @param {number} daiIn Amount of fyDai being bought that will be deposited in `to` wallet
   * @return Amount of fyDai that will be deposited on `to` wallet
   * 
   */
  const sellDai = async (
    series:IYieldSeries,
    daiIn: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(series.poolAddress);

    const overrides = { 
      gasLimit: BigNumber.from('300000')
    };

    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.sellDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxRejectError(e);
      setSellActive(false);
      return;
    }
    await handleTx({ tx, msg: `Selling ${daiIn} DAI pending...`, type:'SELL', series });
    setSellActive(false);
  };


  /**
   * @dev Buy Dai/Chai with fyDai
   * @note NOT limit pool
   * 
   * @param {IYieldSeries} series fyDai contract.
   * @param {number} daiOut Amount of dai/chai being bought that will be deposited in `to` wallet
   * 
   * @return Amount of fyDai that will be taken from `from` wallet
   *
   */
  const buyDai = async (
    series:IYieldSeries,
    daiOut: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiOut.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const marketAddr = ethers.utils.getAddress(series.poolAddress);
    
    const overrides = { 
      gasLimit: BigNumber.from('300000')
    };

    let tx:any;
    setBuyActive(true);
    const contract = new ethers.Contract( marketAddr, poolAbi, signer );
    try {
      tx = await contract.buyDai(fromAddr, toAddr, parsedAmount, overrides );
    } catch (e) {
      handleTxRejectError(e);
      setBuyActive(false);
      return;
    }
    await handleTx({ tx, msg: `Buying ${daiOut} Dai pending...`, type:'BUY', series });
    setBuyActive(false);
  };

  /**
   * @dev Delegate a 3rd party to act on behalf of the user in the Pool contracts
   * @param {IYieldSeries} series in question.
   * @param {string} delegatedAddress address of the contract/entity getting delegated. 
   */
  const addPoolDelegate = async (
    series:IYieldSeries,
    delegatedAddress:string,
    asProxy: boolean = false,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const delegatedAddr = ethers.utils.getAddress(delegatedAddress);
    /* Contract interaction */
    const contract = new ethers.Contract(
      poolAddr,
      poolAbi,
      signer
    );

    if (!asProxy) {
      try {
        tx = await contract.addDelegate(delegatedAddr);
      } catch (e) {
        return handleTxRejectError(e);
      }
      /* Transaction reporting & tracking */
      await handleTx({ tx, msg: 'Yield Series Pool authorization', type:'AUTH_POOL', series });
    
    } else { 
      const calldata = contract.interface.encodeFunctionData('addDelegate', [delegatedAddr]);
      tx = await proxyExecute( 
        poolAddr,
        calldata,
        { },
        { tx: null, msg: 'Yield Series Pool authorization', type:'AUTH_POOL', series  }
      );
    }

    // eslint-disable-next-line consistent-return
    return true;
  };

  
  /**
   * @dev Checks to see if an account (user) has delegated a contract/3rd Party for a particular market. 
   * @param {string} poolAddress address of the market in question.
   * @param {string} delegateAddress address of the Proxy (contract getting approved). 
   * @returns {Promise<boolean>} approved ?
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
      res = false;
    }
    return res;
  };

  /**
   * @dev Preview buy/sell transactions
   * 
   * sellFYDai -> Returns how much Dai would be obtained by selling x fyDai
   * buyDai -> Returns how much fyDai would be required to buy x Dai
   * buyFYDai -> Returns how much Dai would be required to buy x fyDai
   * sellDai -> Returns how much fyDai would be obtained by selling x Dai
   * 
   * @param {string} txType string represnting transaction type //TODO tyescript it out
   * @param {IYieldSeries} series fyDai series to redeem from.
   * @param {number | BigNumber} amount input to preview
   * 
   * @note NB NB if in BigNumber must be in wei
   *  
   * @returns {BigNumber| null} BigNumber in WEI/WAD precision - Dai or fyDai (call dependent)
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
          case 'BUYFYDAI':
            value = await contract.buyFYDaiPreview(parsedAmount); break;
          case 'SELLFYDAI':
            value = await contract.sellFYDaiPreview(parsedAmount); break;
          default: 
            value = await BigNumber.from('0');
        }
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
    sellFYDai,
    buyFYDai,
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
