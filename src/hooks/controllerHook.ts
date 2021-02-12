import { useMemo, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import Controller from '../contracts/Controller.json';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';
import { useDsProxy } from './dsProxyHook';

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
  
  const { state : { deployedContracts } } = useContext<any>(YieldContext);
  const { actions: userActions } = useContext(UserContext);

  /* Controller contract for txs */
  const [controllerContract, setControllerContract] = useState<any>();
  /* Controller contract for reading, calls */
  const [controllerProvider, setControllerProvider] = useState<any>();

  const { handleTx, handleTxRejectError } = useTxHelpers();
  const { proxyExecute } = useDsProxy();

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
   * @dev Delegate a 3rd party to act on behalf of the user in the controller
   * @param {string} delegatedAddress address of the contract/entity getting delegated.
   * @param {boolean} asProxy OPTIONAL: delegate via dsProxy (default: false)
   */
  const addControllerDelegate = async (
    delegatedAddress:string,
    asProxy: boolean = false,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const delegatedAddr = ethers.utils.getAddress(delegatedAddress);

    /* Contract interaction */
    if (!asProxy) {
      try {
        tx = await controllerContract.addDelegate(delegatedAddr);
      } catch (e) {
        handleTxRejectError(e);
        return;
      }
      /* Transaction reporting & tracking */
      await handleTx({ tx, msg: 'Once-off Yield authorization', type: 'AUTH_CONTROLLER', series: null, value: null });
      userActions.updateAuthorizations();

    } else {   
      const calldata = controllerContract.interface.encodeFunctionData('addDelegate', [delegatedAddr]);
      tx = await proxyExecute( 
        controllerContract.address,
        calldata,
        { },
        { tx:null, msg: 'Once-off Yield authorization', type: 'AUTH_CONTROLLER', series: null, value: null  }
      );
      userActions.updateAuthorizations();
    }
  
    // eslint-disable-next-line consistent-return
    return true;
  };

  /**
   * @dev Checks to see if an account (user) has delegated a contract/3rd Party for the controller.
   * @param {string} delegateAddress address of the delegate to be checked (yieldProxy contract getting approved). 
   * @returns { Promise<boolean>}  promise > approved or not
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
  const getBorrowingPower = async (
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
   * @dev get the FyDai debt of a series
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * @param maturity Maturity of an added series
   * @returns {Promise<BigNumber>} amount Dai (in Wei)
   * @note call function 
   */
  const debtFYDai = async (
    collateralType:string,
    maturity:number,
  ): Promise<BigNumber> => {
    const accAddr = account && ethers.utils.getAddress(account);
    const collType = ethers.utils.formatBytes32String(collateralType);
    let res;
    try {
      res = await controllerProvider.debtFYDai(collType,  maturity, accAddr);
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

    addControllerDelegate,
    checkControllerDelegate,
    collateralPosted,
    collateralLocked,
    getBorrowingPower,
    totalDebtDai,
    debtDai,
    debtFYDai,

  } as const;
};