import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';

import Controller from '../contracts/Controller.json';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './appHooks';

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
  const { signer, provider, account } = useSignerAccount();
  const  { dispatch }  = useContext<any>(NotifyContext);
  const { state : { deployedContracts } } = useContext<any>(YieldContext);

  const [ postActive, setPostActive ] = useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = useState<boolean>(false);
  const [ repayActive, setRepayActive ] = useState<boolean>(false);

  /* controller contract for txs */
  const [controllerContract, setControllerContract] = useState<any>();
  /* controller contract for reading, calls */
  const [controllerProvider, setControllerProvider] = useState<any>();

  const { handleTx, handleTxError } = useTxHelpers();

  useEffect(()=>{
    deployedContracts.Controller && signer &&
    setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts.Controller), 
      controllerAbi,
      signer
    ));

    deployedContracts.Controller && provider &&
    setControllerProvider( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts.Controller), 
      controllerAbi,
      provider
    ));

  }, [signer, provider, deployedContracts]);


  /**
   * Posts 'wrapped' collateral (Weth or Chai) - not ETH directly.
   * @param {string} collateral 'ETH-A' || 'CHAI'
   * @param {number} amount amount of collateral to post (in normal human numbers)
   */
  const post = async (
    collateral:string,
    amount:number
  ) => {
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    /* Contract interaction */
    let tx:any;
    setPostActive(true);
    try {
      tx = await controllerContract.post(collateralBytes, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      handleTxError('Transaction was aborted or it failed.', tx, e);
      setPostActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} pending...`, type:'DEPOSIT' } } );
    await handleTx(tx);
    setPostActive(false);
  };

  /**
   * Withdraws 'wrapped' collateral (Weth or Chai) - not ETH directly.
   * @param {string} controllerAddress address of the Controller (remnant of older protocol)
   * @param {string} collateral 'ETH-A' || 'CHAI'
   * @param {number} amount to withdraw (in human understandable numbers)
   */
  const withdraw = async (
    collateral:string,
    amount:number
  ) => {
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    /* Contract interaction */
    let tx:any;
    setWithdrawActive(true);
    try {
      tx = await controllerContract.withdraw(collateralBytes, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      handleTxError('Error Withdrawing funds', tx, e);
      setWithdrawActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...`, type:'WITHDRAW' } } );
    await handleTx(tx);
    setWithdrawActive(false);
  };

  /**
   * Borrow eDai with available, posted collateral directly (any type of collateral).
   * @note Direct transaction with no pool trading (doesn't automatically sell eDai for Dai)
   * 
   * @param {string} collateral 'ETH-A' || 'CHAI' (use ETH-A for ETH collateral)
   * @param {string} maturity UNIX timestamp as a string
   * @param { number } amount borrow amount (in human understandable numbers)
   * 
   */
  const borrow = async (
    collateral:string,
    maturity:string,
    amount:number
  ) => {
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account);
    const fromAddr = account && ethers.utils.getAddress(account);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const matdate = maturity;

    /* Contract interaction */
    let tx:any;
    setBorrowActive(true);
    try {
      tx = await controllerContract.borrow(collateralBytes, matdate, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      handleTxError('Transaction was aborted or it failed.', tx, e );
      setBorrowActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing of ${amount} pending...`, type:'BORROW' } } );
    await handleTx(tx);
    setBorrowActive(false);
  };

  /**
   * Repay eDai debt directly with either Dai or EDai.
   * @note Direct transaction with no pool trading.
   * 
   * @param {string} collateral 'ETH-A' || 'CHAI' (use ETH-A for ETH collateral pool)
   * @param {string} maturity UNIX timestamp as a string
   * @param {number} amount to repay - either eDai or Dai (in human understandable numbers)
   * @param {string} type 'EDAI' || 'DAI' token used to pay back debt
   */
  const repay = async (
    collateral:string,
    maturity:string,
    amount:number,
    type:string,
  ) => {
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const typeCaps = type.toUpperCase();
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    /* Contract interaction */
    let tx:any;
    setRepayActive(true);
    try {
      if (typeCaps === 'EDAI') {
        tx = await controllerContract.repayEDai(collateralBytes, maturity, fromAddr, toAddr, parsedAmount);
      } else if (typeCaps === 'DAI') {
        tx = await controllerContract.repayDai(collateralBytes, maturity, fromAddr, toAddr, parsedAmount);
      }
    } catch (e) {
      handleTxError('Transaction was aborted or it failed.', tx, e );
      setRepayActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Repayment of ${amount} pending...`, type:'REPAY' } } );
    await handleTx(tx);
    setRepayActive(false);
  };

  /**
   * @dev Checks to see if an account (user) has delegated a contract/3rd Party for the controller.
   * @param {string} delegateAddress address of the delegate to be checked (yieldProxy contract getting approved). 
   * @returns {Promise<boolean>} promise > approved or not
   * @note call function
   */
  const checkControllerDelegate = async (
    delegateAddress:string
  ): Promise<boolean> => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const delegateAddr = ethers.utils.getAddress(delegateAddress);
    let res;
    try {
      res = await controllerProvider.delegated(fromAddr, delegateAddr);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Returns the value of collateral posted to the Yield protocol.
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * @returns {Promise<BigNumber>} amount collateral depositied (in Wei)
   * @note call function
   */
  const collateralPosted = async (
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    let res;
    try {
      res = await controllerProvider.posted(collType, accAddr );
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Gets the amount of collateral locked in borrowing operations.
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * @returns {Promise<BigNumber>} amount collateral locked (in Wei)
   * @note call function
   */
  const collateralLocked = async (
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    let res;
    try {
      res = await controllerProvider.locked(collType, accAddr );
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Borrowing power (in dai) of a user for a specific series and collateral
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * @returns {Promise<BigNumber>} amount Dai (in Wei)
   * @note call function
   */
  const borrowingPower = async (
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    let res;
    try {
      res = await controllerProvider.powerOf(collType, accAddr);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev get the Dai debt of a series
   * @note After maturity, the Dai debt of a position grows according to either the stability fee (for WETH collateral) or the Dai Saving Rate (for Chai collateral).
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * @param maturity Maturity of an added series
   * @returns {Promise<BigNumber>} amount Dai (in Wei)
   * @note call function 
   */
  const debtDai = async (
    collateralType:string,
    maturity:number,
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    let res;
    try {
      res = await controllerProvider.debtDai(collType,  maturity, accAddr);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };


  /**
   * @dev Total debt of an user across ALL series, in Dai
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * @returns {Promise<BigNumber>} amount Dai (in Wei)
   * @note call function
   */
  const totalDebtDai = async (
    collateralType:string
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    let res;
    try {
      res = await controllerProvider.totalDebtDai(collType, accAddr);
    }  catch (e) {
      // eslint-disable-next-line no-console
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

    checkControllerDelegate,
    collateralPosted,
    collateralLocked,
    borrowingPower,
    totalDebtDai,
    debtDai,

  } as const;
};