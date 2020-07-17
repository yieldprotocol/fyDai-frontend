import React from 'react';
import { ethers, BigNumber }  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext';
import { ConnectionContext } from '../contexts/ConnectionContext';

// import { YieldContext } from '../contexts/YieldContext';

import YDai from '../contracts/YDai.json';
import Controller from '../contracts/Controller.json';
import TestERC20 from '../contracts/TestERC20.json';
import EthProxy from '../contracts/EthProxy.json';
import Market from '../contracts/Market.json';

// ethers.errors.setLogLevel('error');

/**
 * Hook for interacting with the Yield 'ETHPROXY' Contract.
 * Used for direct ETH deposits and withdrawals via proxy.
 * @returns { function } post
 * @returns { boolean } postActive
 * @returns { function } withdraw
 * @returns { boolean } withdrawActive
 */
export const useEthProxy = () => {
  const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { abi: ethProxyAbi } = EthProxy;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ postEthActive, setPostEthActive ] = React.useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = React.useState<boolean>(false);

  /**
   * Posts collateral (ETH) via ethProxy
   * @param {string} ethProxyAddress address of the proxy
   * @param {number | BigNumber} amount amount of ETH to post (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const postEth = async (
    ethProxyAddress:string,
    amount:number | BigNumber,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);

    /* Contract interaction */
    setPostEthActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.post(fromAddr, toAddr, parsedAmount, { value: parsedAmount });
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed. See console.', type:'error' } } );
      // eslint-disable-next-line no-console
      console.log(e.message);
      setPostEthActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} ETH pending...`, type:'DEPOSIT' } } );
    await tx.wait();
    setPostEthActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Deposit of ${amount} ETH complete` } } );
  };

  /**
   * Withdraws ETH collateral directly (no wrapping).
   * (May require authorization once.  )
   * @param {string} ethProxyAddress address of the proxy
   * @param {number|BigNumber} amount amount of ETH to withdraw (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const withdrawEth = async (
    ethProxyAddress:string,
    amount:number|BigNumber
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);

    /* Contract interaction */
    setWithdrawEthActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.withdraw(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      setWithdrawEthActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...`, type:'WITHDRAW' } } );
    await tx.wait();
    setWithdrawEthActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Withdrawal of ${amount} complete.` } } );
  };

  return {
    postEth, postEthActive,
    withdrawEth, withdrawEthActive,
  } as const;
};

/**
 * Hook for interacting with the yield 'DEALER' Contract
 * @returns { function } post
 * @returns { boolean } postActive
 * @returns { function } withdraw
 * @returns { boolean } withdrawActive
 * @returns { function } borrow
 * @returns { boolean } borrowActive
 * @returns { function } repay
 * @returns { boolean } repayActive
 * @returns { function } approveController
 * @returns { boolean } approveActive
 */
export const useController = () => {

  const { abi: controllerAbi } = Controller;
  const { state: { signer, account } } = React.useContext(ConnectionContext);

  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ postActive, setPostActive ] = React.useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  const [ approveActive, setApproveActive ] = React.useState<boolean>(false);

  /**
   * Posts wrapped collateral (Weth or Chai)
   * @param {string} controllerAddress address of the Controller (remnant of older protocol)
   * @param {string} collateral 'ETH-A' || 'CHAI'
   * @param {number} amount amount of collateral to post (in normal human numbers)
   */
  const post = async (
    controllerAddress:string,
    collateral:string,
    amount:number
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    // console.log(ethers.utils.parseEther(amount.toString()));
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    /* Contract interaction */
    setPostActive(true);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, signer );
    try {
      tx = await contract.post(collateralBytes, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setPostActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} pending...`, type:'DEPOSIT' } } );
    await tx.wait();
    setPostActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Deposit of ${amount} complete` } } );
  };

  /**
   * Withdraws wrapped collateral (Weth or Chai) - not ETH directly.
   * @param {string} controllerAddress address of the Controller (remnant of older protocol)
   * @param {string} collateral 'ETH-A' || 'CHAI'
   * @param {number} amount to withdraw (in human understandable numbers)
   */
  const withdraw = async (
    controllerAddress:string,
    collateral:string,
    amount:number
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    /* Contract interaction */
    setWithdrawActive(true);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, signer );
    try {
      tx = await contract.withdraw(collateralBytes, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      console.log(e);
      setWithdrawActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...`, type:'WITHDRAW' } } );
    await tx.wait();
    setWithdrawActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Withdrawal of ${amount} complete.` } } );
  };

  /**
   * Borrow yDai with available, posted collateral.
   * @param {string} controllerAddress address of the Controller
   * @param {string} collateral 'ETH-A' || 'CHAI' (use ETH-A for ETH collateral)
   * @param {string} maturity UNIX timestamp as a string
   * @param { number } amount borrow amount (in human understandable numbers)
   */
  const borrow = async (
    controllerAddress:string,
    collateral:string,
    maturity:string,
    // to:string,
    amount:number
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    console.log(amount);
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account);
    const fromAddr = account && ethers.utils.getAddress(account);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    /* Contract interaction */
    setBorrowActive(true);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, signer );
    try {
      tx = await contract.borrow(collateralBytes, maturity, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setBorrowActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing of ${amount} pending...`, type:'BORROW' } } );
    await tx.wait();
    setBorrowActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Borrowing of ${amount} complete.` } } );
  };

  /**
   * Repay yDai debt with either Dai or YDai.
   * @param {string} controllerAddress address of the Controller
   * @param {string} collateral 'ETH-A' || 'CHAI' (use ETH-A for ETH collateral pool)
   * @param {string} maturity UNIX timestamp as a string
   * @param {number} amount to repay - either yDai or Dai (in human understandable numbers)
   * @param {string} type 'YDAI' || 'DAI' token used to pay back debt
   */
  const repay = async (
    controllerAddress:string,
    collateral:string,
    maturity:string,
    // from:string,
    amount:number,
    type:string,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const typeCaps = type.toUpperCase();
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    /* Contract interaction */
    setRepayActive(true);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, signer );
    try {
      if (typeCaps === 'YDAI') {
        tx = await contract.repayYDai(collateralBytes, maturity, fromAddr, toAddr, parsedAmount);
      } else if (typeCaps === 'DAI') {
        tx = await contract.repayDai(collateralBytes, maturity, fromAddr, toAddr, parsedAmount);
      }
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setRepayActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Repayment of ${amount} pending...`, type:'REPAY' } } );
    await tx.wait();
    setRepayActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Repayment of ${amount} complete.` } } );
  };

  /**
   * Approve the controller to transact with ETH-A (or other) token.
   * (Not strictly a Controller Contract function. But associated enough to keep in here.)
   * @param {string} tokenAddress address of the token to approve. 
   * @param {string} controllerAddress address of the controller. 
   * @param {number} amount to approve (in human understandable numbers)
   */
  const approveController = async (
    tokenAddress:string,
    controllerAddress:string,
    amount:number
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    
    /* Contract interaction */
    setApproveActive(true);
    const contract = new ethers.Contract(
      tokenAddr,
      TestERC20.abi,
      signer
    );
    try {
      tx = await contract.approve(controllerAddr, parsedAmount);
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
    dispatch({ type: 'txComplete', payload:{ tx, message:`Token approval of ${amount} complete. ${tokenAddress} and ${controllerAddress}` } } );
  };

  return {
    post, postActive,
    withdraw, withdrawActive,
    borrow, borrowActive,
    repay, repayActive,
    approveController, approveActive,
  } as const;
};

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

  return {
    redeem, redeemActive
  } as const;
};

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
  const [ sellActive, setSellActive ] = React.useState<boolean>(false);
  const [ buyActive, setBuyActive ] = React.useState<boolean>(false);

  /**
   * Sell yDai for Dai ( Chai )
   * 
   * @param {string} yDaiAddress address of the yDai series to redeem from.
   * @param {number} amount Amount of yDai being sold that will be taken from the user's wallet in human numbers
   *
   */
  const sellYDai = async (
    marketAddress:string,
    amount: number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const marketAddr = ethers.utils.getAddress(marketAddress);
    setSellActive(true);
    const contract = new ethers.Contract( marketAddr, marketAbi, signer );
    try {
      tx = await contract.sellYDai(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Selling yDai!', type:'error' } } );
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Sell yDai ${amount} pending...`, type:'SELL' } } );
    await tx.wait();
    setSellActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Sell yDai ${amount} complete.` } } );
  };

  /**
   * Buy yDai for Dai/Chai
   * @param from Wallet providing the chai being sold. Must have approved the operator with `market.addDelegate(operator)`
   * @param to Wallet receiving the yDai being bought
   * @param chaiIn Amount of chai being sold that will be taken from the user's wallet
   * @return Amount of yDai that will be deposited on `to` wallet
   *
   */
  const buyYDai = async (
    marketAddress:string,
    amount: number
  ) => {
  };

  /**
   * Buy yDai for Dai/Chai
   * @param from Wallet providing the chai being sold. Must have approved the operator with `market.addDelegate(operator)`
   * @param to Wallet receiving the yDai being bought
   * @param chaiIn Amount of chai being sold that will be taken from the user's wallet
   * @return Amount of yDai that will be deposited on `to` wallet
   *
   */
  const sellDai = async (
    marketAddress:string,
    amount: number
  ) => {
  };

  /**
   * Buy yDai for Dai/Chai
   * @param from Wallet providing the chai being sold. Must have approved the operator with `market.addDelegate(operator)`
   * @param to Wallet receiving the yDai being bought
   * @param chaiIn Amount of chai being sold that will be taken from the user's wallet
   * @return Amount of yDai that will be deposited on `to` wallet
   *
   */
  const buyDai = async (
    marketAddress:string,
    amount: number
  ) => {
  };

  return {
    sellYDai, buyYDai, sellDai, buyDai, sellActive, buyActive
  } as const;
};
