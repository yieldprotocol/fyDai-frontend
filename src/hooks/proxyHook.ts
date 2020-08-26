// @ts-nocheck

import React from 'react';

import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { NotifyContext } from '../contexts/NotifyContext';

import EthProxy from '../contracts/EthProxy.json';
import DaiProxy from '../contracts/DaiProxy.json';

// import YieldProxy from '../contracts/YieldProxy.json';

// import LiquidityProxy from '../contracts/LiquidityProxy.json';

import { useSignerAccount } from './connectionHooks';

// ethers.errors.setLogLevel('error');

/**
 * Hook for interacting with the Yield Proxy Contract.
 * 
 * @returns { function } postEth
 * @returns { function } withdrawEth
 * 
 * @returns { function } borrowUsingExactDai
 * @returns { function } repayUsingExactDai 
 * 
 * @returns { function } borrow
 * @returns { function } repay
 * 
 * @returns { function } addLiquidity
 * @returns { function } removeLiquidity

 * @returns { boolean } postActive
 * @returns { boolean } withdrawActive
 * @returns { boolean } borrowActive
 * @returns { boolean } repayActive
 * @returns { boolean } addLiquidityActive
 * @returns { boolean } removeLiquidityActive
 * 
 */
export const useProxy = () => {

  // const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { signer, provider, account } = useSignerAccount();

  const { abi: ethProxyAbi } = EthProxy;
  const { abi: daiProxyAbi } = DaiProxy;

  // const { abi: yieldProxy } = YieldProxy;

  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ postEthActive, setPostEthActive ] = React.useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  const [ removeLiquidityActive, setRemoveLiquidityActive ] = React.useState<boolean>(false);
  const [ addLiquidityActive, setAddLiquidityActive ] = React.useState<boolean>(false);

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
      tx = await contract.post(toAddr, parsedAmount, { value: parsedAmount });
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
    // eslint-disable-next-line consistent-return
    return tx;

  };

  /**
   * Withdraws ETH collateral directly (no wrapping of WETH required).
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
      tx = await contract.withdraw(toAddr, parsedAmount);
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
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * @dev Borrow yDai from Controller and sell it immediately for Dai, for a maximum yDai debt.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {string} daiProxyAddress address of series market proxy
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} maturity Maturity of an added series. unix timestamp
   * @param {number} maximumYDai Maximum amount of YDai to borrow. 
   * @param {number} daiToBorrow Exact amount of Dai that should be obtained.
   * 
   * @return Amount of yDai that will be taken from `from` wallet
   *
   */
  const borrowUsingExactDai = async (
    daiProxyAddress: string, 
    collateralType: string,
    maturity: number,
    maximumYDai: number, 
    daiToBorrow: number,
  ) => {
    let tx:any;
    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };
    const parsedDai = ethers.utils.parseEther(daiToBorrow.toString());
    const parsedYDai = ethers.utils.parseEther(maximumYDai.toString());
    const daiProxyAddr = ethers.utils.getAddress(daiProxyAddress);
    const collatType = ethers.utils.formatBytes32String(collateralType);

    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = maturity.toString();

    setBorrowActive(true);

    const contract = new ethers.Contract( daiProxyAddr, daiProxyAbi, signer );
    try {
      // console.log('gas est:', ( await contract.estimateGas.borrowDaiForMaximumYDai(fromAddr, toAddr, parsedAmount, overrides )).toString());
      // console.log('dry-run:', ( await contract.callStatic.borrowDaiForMaximumYDai(fromAddr, toAddr, parsedAmount, overrides )).toString());
      tx = await contract.borrowDaiForMaximumYDai( utils.ETH, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides );
    } catch (e) {
      console.log(e);
      dispatch({ type: 'notify', payload:{ message:'Error Borrowing Dai!', type:'error' } } );
      dispatch({ type: 'txComplete', payload:{ tx } } );
      setBorrowActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing ${daiToBorrow} Dai pending...`, type:'BORROW' } } );
    await tx.wait();
    setBorrowActive(false);
    dispatch({ type: 'txComplete', payload:{ tx } } );
    // eslint-disable-next-line consistent-return
    return tx;
  };

  
  /**
   * @dev Repay an amount of yDai debt in Controller using a given amount of Dai exchanged for yDai at pool rates, with a minimum of yDai debt required to be paid.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {string} daiProxyAddress address of series market proxy
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} maturity Maturity of an added series. unix timestamp
   * @param {number} minimumYDaiRepayment  minimumYDaiRepayment Minimum amount of yDai debt to repay.
   * @param {number} repaymentInDai Exact amount of Dai that should be spent on the repayment.
   * 
   * @return Amount 
   *
   */
  const repayUsingExactDai = async (
    daiProxyAddress: string, 
    collateralType: string,
    maturity: number,
    minimumYDaiRepayment: number, 
    repaymentInDai: number,
  ) => {
    let tx:any;
    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };

    const parsedDai = ethers.utils.parseEther(repaymentInDai.toString());   
    const parsedYDai = ethers.utils.parseEther(minimumYDaiRepayment.toString());
    const daiProxyAddr = ethers.utils.getAddress(daiProxyAddress);
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = maturity.toString();

    setBorrowActive(true);

    const contract = new ethers.Contract( daiProxyAddr, daiProxyAbi, signer );
    try {
      console.log('gas est:', ( await contract.estimateGas.repayMinimumYDaiDebtForDai( collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());
      console.log('dry-run:', ( await contract.callStatic.repayMinimumYDaiDebtForDai( collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());     
      tx = await contract.repayMinimumYDaiDebtForDai( collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides );
    } catch (e) {
      console.log(e);
      dispatch({ type: 'notify', payload:{ message:'Error Repaying Dai!', type:'error' } } );
      dispatch({ type: 'txComplete', payload:{ tx } } );
      setBorrowActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Repaying ${repaymentInDai} Dai pending...`, type:'REPAY' } } );
    await tx.wait();
    setBorrowActive(false);
    dispatch({ type: 'txComplete', payload:{ tx } } );
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * LIQUIDITY SECTION
   */
  
  /**
   * Add liquidity to the pool 
   * 
   * @param {string} ethProxyAddress address of the proxy
   * @param {number | BigNumber} amount amount of ETH to post (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const addLiquidity = async (
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
    setAddLiquidityActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.post(toAddr, parsedAmount, { value: parsedAmount });
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed. See console.', type:'error' } } );
      // eslint-disable-next-line no-console
      console.log(e.message);
      setAddLiquidityActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} ETH pending...`, type:'DEPOSIT' } } );
    await tx.wait();
    setAddLiquidityActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Deposit of ${amount} ETH complete` } } );
    // eslint-disable-next-line consistent-return
    return tx;
  };

  /**
   * Withdraws ETH collateral directly (no wrapping of WETH required).
   * (May require authorization once.  )
   * @param {string} poolAddress address of the proxy
   * @param {numberr} tokens amount of tokens to remove
   * @param {number|Bignumber} maxDai maximum amount of dai optional
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidity = async (
    // removeLiquidityEarly(address from, uint256 poolTokens, uint256 DaiLimit)
    // removeLiquidityMature(address from, uint256 poolTokens) 
    poolAddress:string,
    tokens:number|BigNumber,
    maxDai:number|BigNumber,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);

    /* Contract interaction */
    setRemoveLiquidityActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.withdraw(toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      setRemoveLiquidityActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...`, type:'WITHDRAW' } } );
    await tx.wait();
    setRemoveLiquidityActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Withdrawal of ${amount} complete.` } } );
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * LIMITPOOL SECTION
   */

  const sellDai = () => {

  };

  
  const buyDai = () => {
    
  };

  const sellYDai = () => {
    
  };
 
  const buyYDai = () => {
    
  };

  /**
   * SPLITTER SECTION
   *  */ 

  // Splitter: Maker to Yield proxy
  // @dev Transfer debt and collateral from MakerDAO to Yield
  // Needs vat.hope(splitter.address, { from: user });
  // Needs controller.addDelegate(splitter.address, { from: user });
  // @param pool The pool to trade in (and therefore yDai series to borrow)
  // @param user Vault to migrate.
  // @param wethAmount weth to move from MakerDAO to Yield. Needs to be high enough to collateralize the dai debt in Yield,
  // and low enough to make sure that debt left in MakerDAO is also collateralized.
  // @param daiAmount dai debt to move from MakerDAO to Yield. Denominated in Dai (= art * rate)
  const makerToYield = () => {
    // makerToYield(address pool, address user, uint256 wethAmount, uint256 daiAmount)
  };

  
  // @dev Transfer debt and collateral from Yield to MakerDAO
  // Needs vat.hope(splitter.address, { from: user });
  // Needs controller.addDelegate(splitter.address, { from: user });
  // @param pool The pool to trade in (and therefore yDai series to migrate)
  // @param user Vault to migrate.
  // @param yDaiAmount yDai debt to move from Yield to MakerDAO.
  // @param wethAmount weth to move from Yield to MakerDAO. Needs to be high enough to collateralize the dai debt in MakerDAO,
  // and low enough to make sure that debt left in Yield is also collateralized.
  const yieldToMaker = () => {
    //  yieldToMaker(address pool, address user, uint256 yDaiAmount, uint256 wethAmount)
  };

  // Splitter Views

  // @dev Minimum weth needed to collateralize an amount of dai in MakerDAO
  const wethForDai = () => {
    // wethForDai(uint256 daiAmount) public view returns (uint256)
  };
  // @dev Amount of yDai debt that will result from migrating Dai debt from MakerDAO to Yield
  const yDaiForDai = () => {
    // yDaiForDai(address pool, uint256 daiAmount)
  }
  // @dev Amount of dai debt that will result from migrating yDai debt from Yield to MakerDAO
  const daiForYDai = () => {
    // daiForYDai(address pool, uint256 yDaiAmount)
  };


  return {

    // ethProxy eq. 
    postEth, postEthActive,
    withdrawEth, withdrawEthActive,

    // daiProxy eq. 
    borrowUsingExactDai, borrowActive,
    repayUsingExactDai, repayActive,

    // liquidityProxy eq.
    addLiquidity, addLiquidityActive,
    removeLiquidity, removeLiquidityActive,

    // limitPool
    sellDai,
    buyDai, 
    sellYDai, 
    buyYDai,

    // Splitter
    makerToYield,
    yieldToMaker,

    // Splitter Views
    wethForDai,
    yDaiForDai,
    daiForYDai

  } as const;
};


