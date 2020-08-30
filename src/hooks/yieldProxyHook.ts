import React from 'react';

import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import YieldProxy from '../contracts/YieldProxy.json';

import { NotifyContext } from '../contexts/NotifyContext';
import { useSignerAccount } from './connectionHooks';

/**
 * Hook for interacting with the Yield Proxy Contract.
 * 
 * @returns { function } postEth
 * @returns { function } withdrawEth
 * @returns { function } borrowDai
 * @returns { function } repayDaiDebt
 * @returns { function } buyDai
 * @returns { function } sellDai
 * @returns { function } addDaiLiquidity
 * @returns { function } removeDaiLiquidity
 * 
 * @returns { boolean } postActive
 * @returns { boolean } withdrawActive
 * @returns { boolean } borrowActive
 * @returns { boolean } repayActive
 * @returns { boolean } addLiquidityActive
 * @returns { boolean } removeLiquidityActive
 * @returns { boolean } buyActive
 * @returns { boolean } sellActive
 * 
 */
export const useProxy = () => {

  const { signer, provider, account } = useSignerAccount();
  const { abi: yieldProxyAbi } = YieldProxy;

  const  { dispatch }  = React.useContext<any>(NotifyContext);

  const [ postEthActive, setPostEthActive ] = React.useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  const [ removeLiquidityActive, setRemoveLiquidityActive ] = React.useState<boolean>(false);
  const [ addLiquidityActive, setAddLiquidityActive ] = React.useState<boolean>(false);

  const [ buyActive, setBuyActive ] = React.useState<boolean>(false);
  const [ sellActive, setSellActive ] = React.useState<boolean>(false);

  /* Notification Helpers */
  const txComplete = (tx:any) => {
    dispatch({ type: 'txComplete', payload:{ tx } } );
  }; 
  const handleTxError = (msg:string, tx: any, e:any) => {
    // eslint-disable-next-line no-console
    console.log(e.message);
    dispatch({ type: 'notify', payload:{ message: msg, type:'error' } } );
    txComplete(tx);
  };

  /**
   * @dev Post ETH collateral via yieldProxy
   * @param {string} yieldProxyAddress address of the proxy
   * @param {number | BigNumber} amount amount of ETH to post (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const postEth = async (
    yieldProxyAddress:string,
    amount:number | BigNumber,
  ) => {

    /* Processing and/or sanitizing input */
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account); /* 'to' in this case represents the vault to be depositied into within controller */  
    
    /* Contract interaction */
    let tx:any;
    setPostEthActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      tx = await contract.post(toAddr, { value: parsedAmount }); 
    } catch (e) {
      handleTxError('Error depositing ETH', tx, e );   
      setPostEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} ETH pending...`, type:'DEPOSIT' } } );
    await tx.wait();
    setPostEthActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };

  
  /**
   * Withdraw ETH collateral via YieldProxy
   * @param {string} yieldProxyAddress address of the proxy
   * @param {number|BigNumber} amount amount of ETH to withdraw (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const withdrawEth = async (
    yieldProxyAddress:string,
    amount:number|BigNumber
  ) => {

    /* Processing and sanitizing input */
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    /* Contract interaction */
    let tx:any;
    setWithdrawEthActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      tx = await contract.withdraw(toAddr, parsedAmount);
    } catch (e) {
      handleTxError('Error Withdrawing ETH', tx, e);
      setWithdrawEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} ETH pending...`, type:'WITHDRAW' } } );
    await tx.wait();
    setWithdrawEthActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * @dev Borrow yDai from Controller and sell it immediately for Dai, for a maximum yDai debt.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {string} yieldProxyAddress address of series market proxy
   * 
   * @param {string} poolAddress address of series pool
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} maturity Maturity of an added series. unix timestamp
   * @param {number} maximumYDai Maximum amount of YDai to borrow. 
   * @param {number} daiToBorrow Exact amount of Dai that should be obtained.
   * 
   * @return Amount of yDai that will be taken from `from` wallet
   *
   */
  const borrowDai = async (
    yieldProxyAddress: string, 
    poolAddress: string, 
    collateralType: string,
    maturity: number,
    maximumYDai: number, 
    daiToBorrow: number,
  ) => {
    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };
    const parsedDai = ethers.utils.parseEther(daiToBorrow.toString());
    const parsedYDai = ethers.utils.parseEther(maximumYDai.toString());
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);
    const poolAddr = ethers.utils.getAddress(poolAddress);
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = maturity.toString();

    let tx:any;
    setBorrowActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      console.log('gas est:', ( await contract.estimateGas.borrowDaiForMaximumYDai(poolAddr, utils.ETH, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());
      console.log('dry-run:', ( await contract.callStatic.borrowDaiForMaximumYDai(poolAddr, utils.ETH, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());
      tx = await contract.borrowDaiForMaximumYDai( poolAddr, utils.ETH, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides );
    } catch (e) {
      handleTxError('Error Borrowing DAI', tx, e);
      setBorrowActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing ${daiToBorrow} Dai pending...`, type:'BORROW' } } );
    await tx.wait();
    setBorrowActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * @dev Repay an amount of yDai debt in Controller using a given amount of Dai exchanged for yDai at pool rates, with a minimum of yDai debt required to be paid.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {string} yieldProxyAddress address of Yieldproxy
   * 
   * @param {string} poolAddress address of series pool
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} maturity Maturity of an added series. unix timestamp
   * @param {number} minimumYDaiRepayment  minimumYDaiRepayment Minimum amount of yDai debt to repay.
   * @param {number} repaymentInDai Exact amount of Dai that should be spent on the repayment.
   * 
   * @return Amount 
   *
   */
  const repayDaiDebt = async (
    yieldProxyAddress: string,
    poolAddress: string,
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
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);
    const poolAddr = ethers.utils.getAddress(poolAddress);
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = maturity.toString();

    setRepayActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      console.log('gas est:', ( await contract.estimateGas.repayMinimumYDaiDebtForDai(poolAddr, collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());
      console.log('dry-run:', ( await contract.callStatic.repayMinimumYDaiDebtForDai(poolAddr, collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());     
      tx = await contract.repayMinimumYDaiDebtForDai(poolAddr, collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides );
    } catch (e) {
      handleTxError('Error Repaying DAI', tx, e);
      setRepayActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Repaying ${repaymentInDai} Dai pending...`, type:'REPAY' } } );
    await tx.wait();
    setBorrowActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * LIQUIDITY SECTION
   */
  
  /**
   * Add liquidity to the pool 
   * 
   * @param {string} yieldProxyAddress address of the proxy
   * @param {number | BigNumber} amount amount of ETH to post (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const addLiquidity = async (
    yieldProxyAddress:string,
    amount:number | BigNumber,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);

    /* Contract interaction */
    setAddLiquidityActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      tx = await contract.post(toAddr, parsedAmount, { value: parsedAmount });
    } catch (e) {
      handleTxError('Error Adding liquidity', tx, e);
      setAddLiquidityActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Adding ${amount} DAI liquidity pending...`, type:'ADD_LIQUIDITY' } } );
    await tx.wait();
    setAddLiquidityActive(false);
    txComplete(tx);
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
    yieldProxyAddress:string,
    poolAddress:string,
    tokens:number|BigNumber,
    maxDai:number|BigNumber,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);

    /* Contract interaction */
    setRemoveLiquidityActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      tx = await contract.withdraw(toAddr, parsedAmount);
    } catch (e) {
      handleTxError('Error Removing liquidity', tx, e);
      setRemoveLiquidityActive(false);
      return;
    }

    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Removing ${tokens} DAI liquidity pending...`, type:'REMOVE_LIQUIDITY' } } );
    await tx.wait();
    setRemoveLiquidityActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };


  /**
   * LIMITPOOL SECTION
   */

  /**
   * @dev Sell Dai for yDai
   * 
   * @param daiIn Amount of dai being bought
   * @param minYDaiOut Maximum amount of yDai being sold
   * */
  const sellDai = async ( 
    yieldProxyAddress:string,
    poolAddress:string, 
    daiIn:number, 
    minYDaiOut:number 
  ) => {

    /* Processing and/or sanitizing input */
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);
    const poolAddr = ethers.utils.getAddress(poolAddress);
    const parsedDaiIn = BigNumber.isBigNumber(daiIn)? daiIn : ethers.utils.parseEther(daiIn.toString());
    const parsedMinYDaiOut = BigNumber.isBigNumber(minYDaiOut)? minYDaiOut : ethers.utils.parseEther(minYDaiOut.toString());
    const toAddr = account && ethers.utils.getAddress(account);
    
    /* Contract interaction */
    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      tx = await contract.sellDai(poolAddr, toAddr, parsedDaiIn, parsedMinYDaiOut); 
    } catch (e) {
      handleTxError('Error selling', tx, e );   
      setPostEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Selling ${daiIn} DAI pending...`, type:'SELL' } } );
    await tx.wait();
    setSellActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };

  /**
   * @dev Buy Dai with yDai
   * 
   * @param daiOut Amount of dai being bought
   * @param maxYDaiIn Maximum amount of yDai being sold
   * */ 
  const buyDai = async ( 
    yieldProxyAddress:string,
    poolAddress:string, 
    daiOut:number, 
    maxYDaiIn:number 
  ) => {
    
    /* Processing and/or sanitizing input */
    const yieldProxyAddr = ethers.utils.getAddress(yieldProxyAddress);
    const poolAddr = ethers.utils.getAddress(poolAddress);
    const parsedDaiOut = BigNumber.isBigNumber(daiOut)? daiOut : ethers.utils.parseEther(daiOut.toString());
    const parsedMaxYDaiIn = BigNumber.isBigNumber(maxYDaiIn)? maxYDaiIn: ethers.utils.parseEther(maxYDaiIn.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    /* Contract interaction */
    let tx:any;
    setSellActive(true);
    const contract = new ethers.Contract( yieldProxyAddr, yieldProxyAbi, signer );
    try {
      tx = await contract.sellDai(poolAddr, toAddr, parsedDaiOut, parsedMaxYDaiIn); 
    } catch (e) {
      handleTxError('Error selling', tx, e );   
      setPostEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying back ${daiOut} DAI pending...`, type:'BUY' } } );
    await tx.wait();
    setSellActive(false);
    txComplete(tx);
    // eslint-disable-next-line consistent-return
    return tx;
  };

  // TODO Add these two only if required
  const sellYDai = () => {};
  const buyYDai = () => {};


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
  };
  // @dev Amount of dai debt that will result from migrating yDai debt from Yield to MakerDAO
  const daiForYDai = () => {
    // daiForYDai(address pool, uint256 yDaiAmount)
  };


  return {

    /* ethProxy eq. fns */
    postEth, postEthActive,
    withdrawEth, withdrawEthActive,

    /* daiProxy eq. fns */
    borrowDai, borrowActive,
    repayDaiDebt, repayActive,

    /* liquidityProxy eq. fns */
    addLiquidity, addLiquidityActive,
    removeLiquidity, removeLiquidityActive,

    /* limitPool fns */
    sellDai,
    buyDai,
    // sellYDai, 
    // buyYDai,

    /* Splitter fns */
    makerToYield,
    yieldToMaker,

    /* Splitter views */
    wethForDai,
    yDaiForDai,
    daiForYDai

  } as const;
};


