import React from 'react';
import { ethers, BigNumber }  from 'ethers';
import { useWeb3React } from '@web3-react/core';

import { NotifyContext } from '../contexts/NotifyContext';
import Controller from '../contracts/Controller.json';
import TestERC20 from '../contracts/TestERC20.json';

import { useSignerAccount } from './connectionHooks';
// ethers.errors.setLogLevel('error');


/**
 * Hook for interacting with the yield 'CRONTROLLER' Contract
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
  // const { state: { provider, signer, account } } = React.useContext(ConnectionContext);
  const { signer, provider, account } = useSignerAccount();

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
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account);
    const fromAddr = account && ethers.utils.getAddress(account);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    const matdate = maturity;

    /* Contract interaction */
    setBorrowActive(true);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, signer );
    try {
      tx = await contract.borrow(collateralBytes, matdate, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      dispatch({ type: 'txComplete', payload:{ tx } } );
      setBorrowActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing of ${amount} pending...`, type:'BORROW' } } );
    await tx.wait();
    setBorrowActive(false);
    dispatch({ type: 'txComplete', payload:{ tx } } );
    // eslint-disable-next-line consistent-return
    return tx;
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
      dispatch({ type: 'txComplete', payload:{ tx } } );
      setRepayActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Repayment of ${amount} pending...`, type:'REPAY' } } );
    await tx.wait();
    setRepayActive(false);
    dispatch({ type: 'txComplete', payload:{ tx } } );
    // eslint-disable-next-line consistent-return
    return tx;

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
      dispatch({ type: 'txComplete', payload:{ tx } } );      setApproveActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Token approval of ${amount} pending...` } } );
    await tx.wait();
    setApproveActive(false);
    dispatch({ type: 'txComplete', payload:{ tx } } );  
  };

  /**
   * Delegate a 3rd party to act on behalf of the user in the Controller
   * @param {string} controllerAddress address of the market in question.
   * @param {string} delegatedAddress address of the contract/entity getting delegated (in this case: ethproxy)
   */
  const addControllerDelegate = async (
    controllerAddress:string,
    delegatedAddress:string,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const delegatedAddr = ethers.utils.getAddress(delegatedAddress);
    /* Contract interaction */
    const contract = new ethers.Contract(
      controllerAddr,
      controllerAbi,
      signer
    );
    try {
      tx = await contract.addDelegate(delegatedAddr);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      dispatch({ type: 'txComplete', payload:{ tx } } );
      console.log(e);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: 'Pending once-off approval of Eth withdrawals ...', type:'DELEGATION' } } );
    await tx.wait();
    dispatch({ type: 'txComplete', payload:{ tx } } );
  };

  /**
   * Check to see if an account (user) has delegated a contract/3rd Party for the controller.
   * 
   * Call function no gas
   * 
   * @param {string} controllerAddress address of the controller.
   * @param {string} delegateAddress address of the delegate to be checked (ethProxy contract getting approved). 
   * 
   * @returns {Promise<boolean>} approved ?
   */
  const checkControllerDelegate = async (
    controllerAddress:string,
    delegateAddress:string
  ): Promise<boolean> => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const delegateAddr = ethers.utils.getAddress(delegateAddress);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, provider);
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
   * Gets the value of collateral posted to the Yield protocol.
   * 
   * Call function no gas
   * 
   * @param {string} controllerAddress address of the controller.
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * 
   * @returns {BigNumber} amount collateral depositied (in Wei)
   */
  const collateralPosted = async (
    controllerAddress:string,
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, provider);
    let res;
    try {
      res = await contract.posted(collType, accAddr );
    }  catch (e) {
      console.log(e);
      res = false;
    }
    return res;
  };


  /**
   * Gets the amount of collateral locked in borrowing operations.
   * 
   * Call function no gas
   * 
   * @param {string} controllerAddress address of the controller.
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * 
   * @returns {BigNumber} amount collateral depositied (in Wei)
   */
  const collateralLocked = async (
    controllerAddress:string,
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, provider);
    let res;
    try {
      res = await contract.locked(collType, accAddr );
    }  catch (e) {
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * Borrowing power (in dai) of a user for a specific series and collateral
   * 
   * Call function no gas
   * 
   * @param {string} controllerAddress address of the controller.
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * 
   * @returns {BigNumber} amount Dai (in Wei)
   */
  const borrowingPower = async (
    controllerAddress:string,
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, provider);
    let res;
    try {
      res = await contract.powerOf(collType, accAddr);
    }  catch (e) {
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   *  Dai debt of a series
   *  
   * After maturity, the Dai debt of a position grows according to either the stability fee (for WETH collateral) or the Dai Saving Rate (for Chai collateral).
   * 
   * Call function no gas
   * 
   * @param {string} controllerAddress address of the controller.
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   *  @param maturity Maturity of an added series
   * 
   * @returns {BigNumber} amount Dai (in Wei)
   */
  const debtDai = async (
    controllerAddress:string,
    collateralType:string,
    maturity:number,
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, provider);
    let res;
    try {
      res = await contract.debtDai(collType,  maturity, accAddr);
    }  catch (e) {
      console.log(e);
      res = false;
    }
    return res;
  };


  /**
   * Total debt of an user across all series, in Dai
   * 
   * Call function no gas
   * 
   * @param {string} controllerAddress address of the controller.
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * 
   * @returns {BigNumber} amount Dai (in Wei)
   */
  const totalDebtDai = async (
    controllerAddress:string,
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    const controllerAddr = ethers.utils.getAddress(controllerAddress);
    const contract = new ethers.Contract( controllerAddr, controllerAbi, provider);
    let res;
    try {
      res = await contract.totalDebtDai(collType, accAddr);
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

    approveController, approveActive, // TODO remove this if not used
    addControllerDelegate,
    checkControllerDelegate,
   
    collateralPosted,
    collateralLocked,
    borrowingPower,
    totalDebtDai,
    debtDai,

  } as const;
};