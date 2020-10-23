import { useMemo, useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { TxContext } from '../contexts/TxContext';
import { YieldContext } from '../contexts/YieldContext';

import Controller from '../contracts/Controller.json';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';


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
  const { signer, fallbackProvider, account } = useSignerAccount();
  const  { dispatch }  = useContext<any>(TxContext);
  
  const { state : { deployedContracts } } = useContext<any>(YieldContext);
  const [ postActive, setPostActive ] = useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = useState<boolean>(false);
  const [ repayActive, setRepayActive ] = useState<boolean>(false);

  /* controller contract for txs */
  const [controllerContract, setControllerContract] = useState<any>();
  /* controller contract for reading, calls */
  const [controllerProvider, setControllerProvider] = useState<any>();

  const { handleTx, handleTxRejectError } = useTxHelpers();

  useMemo(()=>{
    try {
      deployedContracts.Controller && signer &&
      setControllerContract( new ethers.Contract( 
        ethers.utils.getAddress(deployedContracts.Controller), 
        controllerAbi,
        signer
      ));

      deployedContracts.Controller && fallbackProvider &&
      setControllerProvider( new ethers.Contract( 
        ethers.utils.getAddress(deployedContracts.Controller), 
        controllerAbi,
        fallbackProvider
      ));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }, [signer, fallbackProvider, deployedContracts]);

  /**
   * NB: USE PROXYHOOK FOR ETH-A DEPOSITS
   * 
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
      handleTxRejectError(e);
      setPostActive(false);
      return;
    }
    await handleTx({ tx, msg: `Deposit of ${amount} pending...`, type:'DEPOSIT', series:null });
    setPostActive(false);
  };

  /**
   * NB: USE PROXYHOOK FOR ETH-A WITHDRAWS
   * 
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
      handleTxRejectError(e);
      setWithdrawActive(false);
      return;
    }
    await handleTx({ tx, msg: `Withdraw of ${amount} pending...`, type:'WITHDRAW', series:null });
    setWithdrawActive(false);
  };

  /**
   * NB: USE PROXYHOOK FOR AUTOMMATIC TRADING
   * 
   * Borrow fyDai with available, posted collateral directly (any type of collateral).
   * @note Direct transaction with no pool trading (doesn't automatically sell fyDai for Dai)
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
      handleTxRejectError(e);
      setBorrowActive(false);
      return;
    }
    await handleTx({ tx, msg: `Borrowing of ${amount} pending...`, type:'BORROW', series: null });
    setBorrowActive(false);
  };

  /**
   * 
   * NB: USE PROXYHOOK FOR REPAYMENTS 
   * 
   * Repay fyDai debt directly with either Dai or FYDai.
   * @note Direct transaction with no pool trading.
   * 
   * @param {string} collateral 'ETH-A' || 'CHAI' (use ETH-A for ETH collateral pool)
   * @param {string} maturity UNIX timestamp as a string
   * @param {number} amount to repay - either fyDai or Dai (in human understandable numbers)
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
        tx = await controllerContract.repayFYDai(collateralBytes, maturity, fromAddr, toAddr, parsedAmount);
      } else if (typeCaps === 'DAI') {
        tx = await controllerContract.repayDai(collateralBytes, maturity, fromAddr, toAddr, parsedAmount);
      }
    } catch (e) {
      handleTxRejectError(e);
      setRepayActive(false);
      return;
    }
    await handleTx({ tx, msg: `Repayment of ${amount} pending...`, type:'REPAY', series: null});
    setRepayActive(false);
  };

  /**
   * @dev Delegate a 3rd party to act on behalf of the user in the controller
   * @param {string} delegatedAddress address of the contract/entity getting delegated. 
   */
  const addControllerDelegate = async (
    delegatedAddress:string,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const delegatedAddr = ethers.utils.getAddress(delegatedAddress);
    /* Contract interaction */
    try {
      tx = await controllerContract.addDelegate(delegatedAddr);
    } catch (e) {
      handleTxRejectError(e);
      return;
    }
    /* Transaction reporting & tracking */
    await handleTx({ tx, msg: 'Pending once-off controller delegation ...', type: 'AUTH', series: null });
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

    addControllerDelegate,
    checkControllerDelegate,
    collateralPosted,
    collateralLocked,
    borrowingPower,
    totalDebtDai,
    debtDai,

  } as const;
};