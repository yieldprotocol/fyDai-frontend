import React from 'react';

import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';

import YieldProxy from '../contracts/YieldProxy.json';

import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useMath } from './mathHooks';
import { useToken } from './tokenHook';

import { IYieldSeries } from '../types';
import { useTxHelpers } from './appHooks';

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
  const { previewPoolTx } = usePool();
  const { splitDaiLiquidity } = useMath();
  const { getBalance } = useToken();

  const { handleTx, handleTxError } = useTxHelpers();

  const { abi: yieldProxyAbi } = YieldProxy;
  
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const  { state: { deployedContracts } }  = React.useContext<any>(YieldContext);
  const  { state: { preferences: { slippage } } }  = React.useContext<any>(UserContext);

  const [ proxyContract, setProxyContract] = React.useState<any>();

  const [ postEthActive, setPostEthActive ] = React.useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  const [ removeLiquidityActive, setRemoveLiquidityActive ] = React.useState<boolean>(false);
  const [ addLiquidityActive, setAddLiquidityActive ] = React.useState<boolean>(false);

  const [ buyActive, setBuyActive ] = React.useState<boolean>(false);
  const [ sellActive, setSellActive ] = React.useState<boolean>(false);


  // TODO: deal with big number rather also, put htis out in a hook
  const valueWithSlippage = (value:BigNumber, minimise:boolean=false ) => {
    const slippageAsRay = utils.toRay(slippage);
    const slippageAmount = utils.mulRay(value, slippageAsRay);
    if (minimise) {
      return value.sub(slippageAmount);
    } 
    return value.add(slippageAmount);
  };

  React.useEffect(()=>{
    deployedContracts.YieldProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts.YieldProxy), 
      yieldProxyAbi,
      signer
    ));
  }, [signer, deployedContracts]);

  /**
   * @dev Post ETH collateral via yieldProxy
   * @param {number | BigNumber} amount amount of ETH to post (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const postEth = async (
    amount:number | BigNumber,
  ) => {
    /* Processing and/or sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account); /* 'to' in this case represents the vault to be depositied into within controller */  
    
    /* Contract interaction */
    let tx:any;
    setPostEthActive(true);
    try {
      tx = await proxyContract.post(toAddr, { value: parsedAmount }); 
    } catch (e) {
      handleTxError('Error depositing ETH', tx, e ); 
      setPostEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} ETH pending...`, type:'DEPOSIT' } } );
    await handleTx(tx);
    setPostEthActive(false);
  };

  /**
   * @dev Withdraw ETH collateral via YieldProxy
   * @param {number|BigNumber} amount amount of ETH to withdraw (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const withdrawEth = async (
    amount:number|BigNumber
  ) => {
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    /* Contract interaction */
    let tx:any;
    setWithdrawEthActive(true);
    try {
      tx = await proxyContract.withdraw(toAddr, parsedAmount);
    } catch (e) {
      handleTxError('Error Withdrawing ETH', tx, e);
      setWithdrawEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} ETH pending...`, type:'WITHDRAW' } } );
    await handleTx(tx);
    setWithdrawEthActive(false);
  };


  /**
   * @dev Borrow yDai from Controller and sell it immediately for Dai, for a maximum yDai debt.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} maximumYDai Maximum amount of YDai to borrow. 
   * @param {number} daiToBorrow Exact amount of Dai that should be obtained.
   * 
   * @return Amount of yDai that will be taken from `from` wallet
   *
   */
  const borrowDai = async (
    series:IYieldSeries,
    collateralType: string,
    maximumYDai: number,
    daiToBorrow: number,
  ) => {
    const dai = ethers.utils.parseEther(daiToBorrow.toString());
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();
    const collatType = ethers.utils.formatBytes32String(collateralType);
    // const maxYDai = ethers.utils.parseEther(maximumYDai.toString());

    const overrides = { 
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };

    /* Calculate expected trade values and factor in slippage */
    let maxYDai;
    try {
      const yDaiExpected = await previewPoolTx('buydai', series, daiToBorrow);
      if (yDaiExpected) { 
        maxYDai = valueWithSlippage(yDaiExpected);
      }
    } catch (e) {
      console.log(e);
      return;
    } 

    setBorrowActive(true);
    let tx:any;
    try {
      tx = await proxyContract.borrowDaiForMaximumYDai( poolAddr, utils.ETH, parsedMaturity, toAddr, maxYDai, dai, overrides ); 
    } catch (e) {
      handleTxError('Error Borrowing Dai', tx, e);
      setBorrowActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing ${daiToBorrow} Dai pending...`, type:'BORROW' } } );
    await handleTx(tx);
    setBorrowActive(false);
  };


  /**
   * @dev Repay an amount of yDai debt in Controller using a given amount of Dai exchanged for yDai at pool rates, with a minimum of yDai debt required to be paid.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} minimumYDaiRepayment  minimumYDaiRepayment Minimum amount of yDai debt to repay.
   * @param {number} repaymentInDai Exact amount of Dai that should be spent on the repayment.
   * 
   * @return Amount 
   *
   */
  const repayDaiDebt = async (
    series: IYieldSeries,
    collateralType: string,
    minimumYDaiRepayment: number, 
    repaymentInDai: number,
  ) => {
    const dai = ethers.utils.parseEther(repaymentInDai.toString());   
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const toAddr = account && ethers.utils.getAddress(account);
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const yDaiAddr = ethers.utils.getAddress(series.yDaiAddress);
    const parsedMaturity = series.maturity.toString();
    // const minYDai = ethers.utils.parseEther(minimumYDaiRepayment.toString());

    const overrides = {
      // nonce: signer.getTransactionCount().then( (nonce:any) => nonce + queue) 
      gasLimit: BigNumber.from('300000')
    };

    /* calculate expected trade values and factor in slippage */
    // const yDaiExpected = await previewPoolTx('selldai', series, repaymentInDai);
    // const minYDai = valueWithSlippage(yDaiExpected, true);
    let minYDai;
    try {
      const yDaiExpected = await previewPoolTx('selldai', series, repaymentInDai);
      if (yDaiExpected) { 
        minYDai = valueWithSlippage(yDaiExpected, true);
      }
    } catch (e) {
      console.log(e);
      return;
    } 

    setRepayActive(true);
    let tx:any;
    try {
      // console.log('gas est:', ( await proxyContract.estimateGas.repayMinimumYDaiDebtForDai(poolAddr, collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());
      // console.log('dry-run:', ( await proxyContract.callStatic.repayMinimumYDaiDebtForDai(poolAddr, collatType, parsedMaturity, toAddr, parsedYDai, parsedDai, overrides )).toString());           
      
      tx = await proxyContract.repayMinimumYDaiDebtForDai(
        poolAddr,
        collatType,
        parsedMaturity,
        toAddr,
        minYDai,
        dai,
        overrides );  
    } catch (e) {
      console.log(e);
      handleTxError('Error Repaying Dai', tx, e);
      setRepayActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Repaying ${repaymentInDai} Dai pending...`, type:'REPAY' } } );
    await handleTx(tx);
    setRepayActive(false);
  };


  /**
   * LIQUIDITY SECTION
   */
  
  /**
   * @dev Add liquidity to a pool 
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} daiUsed amount of Dai to use to mint liquidity. 
   * @note if BigNumber is used make sure it is in WEI
   */
  const addLiquidity = async (
    series:IYieldSeries,
    daiUsed:number|BigNumber,
  ) => {
    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedDaiUsed = BigNumber.isBigNumber(daiUsed)? daiUsed : ethers.utils.parseEther(daiUsed.toString());

    /* calculate minimum expected yDai value and factor in slippage */
    const daiReserves = await getBalance(deployedContracts.Dai, 'Dai', poolAddr);
    const yDaiReserves = await getBalance(series.yDaiAddress, 'YDai', poolAddr);
    const [ ,yDaiSplit ] = splitDaiLiquidity( parsedDaiUsed, daiReserves, yDaiReserves );

    // const maxYDai = await previewPoolTx('sellDai', series, yDaiSplit);
    // const maxYDaiWithSlippage = valueWithSlippage(maxYDai);

    /* Calculate expected trade values and factor in slippage */
    let maxYDaiWithSlippage;
    try {
      const yDaiExpected = await previewPoolTx('sellDai', series, yDaiSplit);
      if (yDaiExpected) { 
        maxYDaiWithSlippage = valueWithSlippage(yDaiExpected);
      }
    } catch (e) {
      console.log(e);
      return;
    }

    /* Contract interaction */
    let tx:any;
    setAddLiquidityActive(true);
    try {
      tx = await proxyContract.addLiquidity(poolAddr, parsedDaiUsed, maxYDaiWithSlippage );
    } catch (e) {
      handleTxError('Error Adding liquidity', tx, e);
      setAddLiquidityActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Adding ${daiUsed} DAI liquidity pending...`, type:'ADD_LIQUIDITY' } } );
    await handleTx(tx);
    setAddLiquidityActive(false);
  };

  /**
   * @dev removes liquidity from a pool
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} tokens amount of Dai to use to mint liquidity. 
   * @param {number|BigNumber} minimumDai maximum amount of yDai to be borrowed to mint liquidity.
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidity = async (
    // removeLiquidityEarly(address from, uint256 poolTokens, uint256 DaiLimit)
    // removeLiquidityMature(address from, uint256 poolTokens)
    series: IYieldSeries,  
    tokens:number|BigNumber,
    minimumDai:number|BigNumber,
  ) => {
    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const { isMature } = series;
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());

    /* calculate expected trade values and factor in slippage */
    // const yDaiExpected = await previewPoolTx('selldai', poolAddr, daiUsed);
    // const minDai = valueWithSlippage(yDaiExpected, true);

    // const minDai = ethers.utils.parseEther(minimumDai.toString());
    const minDai = 1;
    
    /* Contract interaction */
    let tx:any;
    setRemoveLiquidityActive(true);
    try {
      if (!isMature()) {
        tx = await proxyContract.removeLiquidityEarly(poolAddr, parsedTokens, minDai);
      } else {
        tx = await proxyContract.removeLiquidityMature(poolAddr, tokens);
      }
    } catch (e) {
      handleTxError('Error Removing liquidity', tx, e);
      setRemoveLiquidityActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Removing ${tokens} DAI liquidity pending...`, type:'REMOVE_LIQUIDITY' } } );
    await handleTx(tx);
    setRemoveLiquidityActive(false);
  };


  /**
   * LIMITPOOL SECTION
   */

  /**
   * @dev Sell Dai for yDai
   * 
   * @param {IYieldSeries} series series to act on.
   * @param daiIn Amount of dai being bought
   * */
  const sellDai = async (  
    series: IYieldSeries,
    daiIn:number, 
  ) => {
    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedDaiIn = BigNumber.isBigNumber(daiIn)? daiIn : ethers.utils.parseEther(daiIn.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    /* Contract interaction */
    let tx:any;
    setSellActive(true);
    try {
      /* calculate expected trade values and factor in slippage */
      // const minYDaiOut = valueWithSlippage( 
      //   await previewPoolTx('selldai', series, daiIn), 
      //   true
      // );
      const minYDaiOut = BigNumber.from('0');

      tx = await proxyContract.sellDai(poolAddr, toAddr, parsedDaiIn, minYDaiOut); 
    } catch (e) {
      handleTxError('Error selling', tx, e );   
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Selling ${daiIn} DAI pending...`, type:'SELL' } } );
    await handleTx(tx);
    setSellActive(false);
  };

  /**
   * @dev Buy Dai with yDai
   * @param {IYieldSeries} series yield series to act on.
   * @param daiOut Amount of dai being bought
   * */ 
  const buyDai = async ( 
    series: IYieldSeries, 
    daiOut:number,
  ) => {
    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedDaiOut = BigNumber.isBigNumber(daiOut)? daiOut : ethers.utils.parseEther(daiOut.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    /* calculate expected trade values and factor in slippage */
    // const yDaiExpected = await previewPoolTx('buydai', series, daiOut);
    // const maxYDaiIn = valueWithSlippage(yDaiExpected);

    let maxYDaiIn;
    try {
      const yDaiExpected = await previewPoolTx('buydai', series, daiOut);
      if (yDaiExpected) { 
        maxYDaiIn = valueWithSlippage(yDaiExpected);
      }
    } catch (e) {
      console.log(e);
      return;
    }

    /* Contract interaction */
    let tx:any;
    setBuyActive(true);
    try {
      tx = await proxyContract.buyDai(poolAddr, toAddr, parsedDaiOut, maxYDaiIn); 
    } catch (e) {
      handleTxError('Error buying Dai', tx, e );   
      setBuyActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying back ${daiOut} DAI pending...`, type:'BUY' } } );
    await handleTx(tx);
    setBuyActive(false);
  };

  // TODO Add these two ONLY if required
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
    sellDai, sellActive,
    buyDai, buyActive,
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


