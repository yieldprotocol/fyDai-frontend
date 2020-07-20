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
  const { state: { signer, account } } = React.useContext(ConnectionContext);
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
    const parsedAmount = ethers.utils.parseEther('1000000');
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
    marketAddress:string,
    yDaiOut: number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(yDaiOut.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
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
   * @return Amount of yDai that will be deposited on `to` wallet
   *
   */
  const sellDai = async (
    marketAddress:string,
    daiIn: number
  ) => {
    let tx:any;
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
      tx = await contract.sellDai(fromAddr, toAddr, parsedAmount);
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
   * @param {string} marketAddress address of the yDai series market.
   * @param {number} daiOut Amount of dai/chai being bought that will be deposited in `to` wallet
   * 
   * @return Amount of yDai that will be taken from `from` wallet
   *
   */
  const buyDai = async (
    marketAddress:string,
    daiOut: number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(daiOut.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(marketAddress);
    setBuyActive(true);
    /// @param from Wallet providing the yDai being sold. Must have approved the operator with `market.addDelegate(operator)`.
    /// @param to Wallet receiving the chai being bought
    /// @param chaiOut Amount of chai being bought that will be deposited in `to` wallet
    const contract = new ethers.Contract( marketAddr, marketAbi, signer );
    try {
      console.log(parsedAmount.toString());
      console.log(marketAddr);
      tx = await contract.buyChai(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      console.log(e);
      dispatch({ type: 'notify', payload:{ message:'Error Buying yDai!', type:'error' } } );
      setBuyActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Selling yDai ${daiOut} pending...`, type:'SELL' } } );
    await tx.wait();
    setBuyActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Selling yDai ${daiOut} complete.` } } );
  };

  return {
    approveToken, sellYDai, buyYDai, sellDai, buyDai, sellActive, buyActive, approveActive
  } as const;
};
