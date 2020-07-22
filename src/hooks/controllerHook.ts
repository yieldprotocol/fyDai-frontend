import React from 'react';
import { ethers }  from 'ethers';
import { NotifyContext } from '../contexts/NotifyContext';
import { ConnectionContext } from '../contexts/ConnectionContext';
import Controller from '../contracts/Controller.json';
import TestERC20 from '../contracts/TestERC20.json';

// ethers.errors.setLogLevel('error');

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
  const { state: { provider, signer, account } } = React.useContext(ConnectionContext);

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
  // TODO remove this if not used
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

  /**
   * Approve the controller to ethProxy for ETH withdrawals.
   * @param {string} controllerAddress address of the controller.
   * @param {string} ethProxyAddress address of the ethProxy (contract getting approved). 
   * @param {number} amount to approve (in human understandable numbers)
   */
  const approveEthWithdraws = async (
    controllerAddress:string,
    ethProxyAddress:string,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);
    /* Contract interaction */
    const contract = new ethers.Contract(
      controllerAddr,
      controllerAbi,
      signer
    );
    try {
      tx = await contract.addDelegate(ethProxyAddr);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: 'Pending once-off approval of Eth withdrawals ...' } } );
    await tx.wait();
    dispatch({ type: 'txComplete', payload:{ tx, message:'Eth withdrawals permanently approved' } } );
  };

  /**
   * Check to see if Eth withdrawals have been approved or not
   * 
   * Call function no gas
   * 
   * @param {string} controllerAddress address of the controller.
   * @param {string} ethProxyAddress address of the ethProxy (contract getting approved). 
   * 
   * @returns {boolean} approved ?
   */
  const checkWithdrawApproval = async (
    controllerAddress:string,
    ethProxyAddress:string
  ) => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, provider);
    let res;
    try {
      // res = await contract.allowance(fromAddr, marketAddr);
      console.log('checking withdrawal approval..')
      res= false;
    }  catch (e) {
      console.log(e);
      res = false;
    }
    return res;
  };

  return {
    post, postActive,
    withdraw, withdrawActive,
    borrow, borrowActive,
    repay, repayActive,
    approveController, approveActive, //TODO remove this if not used
    approveEthWithdraws,
    checkWithdrawApproval,
  } as const;
};