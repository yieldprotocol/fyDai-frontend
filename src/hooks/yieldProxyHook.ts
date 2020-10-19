import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import * as utils from '../utils';

import { IYieldSeries } from '../types';

import YieldProxy from '../contracts/YieldProxy.json';

import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useMath } from './mathHooks';
import { useToken } from './tokenHook';
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
 * @returns { function } removfyDaiLiquidity
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

  /* contexts */
  const  { dispatch }  = useContext<any>(NotifyContext);
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { preferences: { slippage } } }  = useContext<any>(UserContext);

  /* hooks */ 
  const { signer, provider, account } = useSignerAccount();
  const { previewPoolTx } = usePool();
  const { splitDaiLiquidity } = useMath();
  const { getBalance } = useToken();
  const { handleTx, handleTxBuildError } = useTxHelpers();
  
  /* Activity flags */
  const [ postEthActive, setPostEthActive ] = useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = useState<boolean>(false);
  const [ repayActive, setRepayActive ] = useState<boolean>(false);
  const [ removeLiquidityActive, setRemoveLiquidityActive ] = useState<boolean>(false);
  const [ addLiquidityActive, setAddLiquidityActive ] = useState<boolean>(false);
  const [ buyActive, setBuyActive ] = useState<boolean>(false);
  const [ sellActive, setSellActive ] = useState<boolean>(false);

  const { abi: yieldProxyAbi } = YieldProxy;

  /* Temporary signing messages */
  const auths = new Map([
    [1, { id: 1, desc:'Authorize Yield to move Dai to repay debt.' }],
    [2, { id: 2, desc:'Authorize Yield to move your fyDai tokens to repay Dai debt.' }],
  ]);

  // TODO: deal with big number rather also, put this out in a hook
  const valueWithSlippage = (value:BigNumber, minimise:boolean=false ) => {
    const slippageAsRay = utils.toRay(slippage);
    const slippageAmount = utils.mulRay(value, slippageAsRay);
    if (minimise) {
      return value.sub(slippageAmount);
    } 
    return value.add(slippageAmount);
  };

  /* Preset the yieldProxy contract to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  useEffect(()=>{
    deployedContracts?.YieldProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.YieldProxy), 
      yieldProxyAbi,
      signer
    ));

  }, [signer, deployedContracts, yieldProxyAbi ]);

  /**
   * @dev Post ETH collateral via yieldProxy
   * @param {string | BigNumber} amount amount of ETH to post (asa string in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const postEth = async (
    amount:string | BigNumber,
  ) => {

    /* Processing and/or sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(utils.cleanValue(amount));
    /* 'to' in this case represents the vault to be depositied into within controller */
    const toAddr = account && ethers.utils.getAddress(account);   
    
    /* Contract interaction */
    let tx:any;
    setPostEthActive(true);
    try {
      tx = await proxyContract.post(toAddr, { value: parsedAmount }); 
    } catch (e) {
      handleTxBuildError(e);
      setPostEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} ETH pending...`, type:'DEPOSIT' } } );
    await handleTx(tx);
    setPostEthActive(false);
  };

  /**
   * @dev Withdraw ETH collateral via YieldProxy
   * @param {string|BigNumber} amount amount of ETH to withdraw (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const withdrawEth = async (
    amount:string|BigNumber
  ) => {
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(utils.cleanValue(amount));
    const toAddr = account && ethers.utils.getAddress(account);

    /* Contract interaction */
    let tx:any;
    setWithdrawEthActive(true);
    try {
      tx = await proxyContract.withdraw(toAddr, parsedAmount);
    } catch (e) {
      handleTxBuildError(e);
      setWithdrawEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} ETH pending...`, type:'WITHDRAW' } } );
    await handleTx(tx);
    setWithdrawEthActive(false);
  };

  /**
   * @dev Borrow fyDai from Controller and sell it immediately for Dai, for a maximum fyDai debt.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} daiToBorrow Exact amount of Dai that should be obtained.
   * 
   * @return Amount of fyDai that will be taken from `from` wallet
   *
   */
  const borrowDai = async (
    series:IYieldSeries,
    collateralType: string,
    daiToBorrow: number,
  ) => {
    const dai = ethers.utils.parseEther(daiToBorrow.toString());
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();
    const collatType = ethers.utils.formatBytes32String(collateralType);

    const overrides = { 
      gasLimit: BigNumber.from('500000')
    };

    setBorrowActive(true);
    let tx:any;
    let maxFYDai:BigNumber;

    try {
      /* Calculate expected trade values and factor in slippage */
      const preview = await previewPoolTx('buydai', series, daiToBorrow); 
      if ( !(preview instanceof Error) ) {
        maxFYDai = valueWithSlippage(preview);
      } else {
        throw(preview);
      }
      tx = await proxyContract.borrowDaiForMaximumFYDai( 
        poolAddr, 
        collatType,
        parsedMaturity, 
        toAddr, 
        maxFYDai, 
        dai, 
        overrides 
      );

    } catch (e) {
      handleTxBuildError(e); 
      setBorrowActive(false);
      return;
    }

    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing ${daiToBorrow} Dai pending...`, type:'BORROW' } } );
    await handleTx(tx);
    setBorrowActive(false);
  };

  /**
   * @dev Repay an amount of fyDai debt in Controller using a given amount of Dai exchanged for fyDai at pool rates, with a minimum of fyDai debt required to be paid.
   * Post maturity the user is asked for a signature allowing the treasury access to dai
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} repaymentInDai Exact amount of Dai that should be spent on the repayment.
   * 
   * @return Amount 
   *
   */
  const repayDaiDebt = async (
    series: IYieldSeries,
    collateralType: string,
    repaymentInDai: number,
  ) => {
    const dai = ethers.utils.parseEther(repaymentInDai.toString());   
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const toAddr = account && ethers.utils.getAddress(account);
    const fromAddr = account && ethers.utils.getAddress(account);
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedMaturity = series.maturity.toString();

    const overrides = {
      gasLimit: BigNumber.from('500000')
    };

    setRepayActive(true);
    let tx:any;
    let daiPermitSig:any;
    let minFYDai:BigNumber;
    try {
      if ( series.isMature() ) {  
        try {     
          /* Repay using a signature authorizing treasury */
          // eslint-disable-next-line no-console
          console.log('Repaying Before maturity - Signature required');
          dispatch({ type: 'requestSigs', payload:[ auths.get(1) ] });
          const result = await signDaiPermit( 
            provider.provider, 
            deployedContracts.Dai, 
            // @ts-ignore
            fromAddr,
            deployedContracts.Treasury
          );
          daiPermitSig = ethers.utils.joinSignature(result);
          dispatch({ type: 'signed', payload: auths.get(1) });
          dispatch({ type: 'requestSigs', payload: [] });
        } catch (e) { 
          handleTxBuildError(e);
          dispatch({ type: 'requestSigs', payload: [] });
          setRepayActive(false);
          return;
        }
        tx = await proxyContract.repayDaiWithSignature(
          collatType,
          parsedMaturity,
          toAddr,
          dai,
          daiPermitSig,
          overrides
        );

      } else if ( !series.isMature() ) {
        // eslint-disable-next-line no-console
        console.log('Repaying before maturity - no signature required');
        /* calculate expected trade values and factor in slippage */
        const preview = await previewPoolTx('selldai', series, repaymentInDai);
        if ( !(preview instanceof Error) ) {
          minFYDai = valueWithSlippage(preview, true);
        } else {
          // minFYDai = ethers.utils.parseEther('0');
          throw(preview);
        }

        tx = await proxyContract.repayMinimumFYDaiDebtForDai(
          poolAddr,
          collatType,
          parsedMaturity,
          toAddr,
          minFYDai,
          dai,
          overrides
        );
      } else {
        // eslint-disable-next-line no-console
        console.log('Series has passed its maturity date, but has not yet been matured');
      }     
      
    } catch (e) {
      handleTxBuildError(e);
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

    const overrides = { 
      gasLimit: BigNumber.from('1000000'),
      value: ethers.utils.parseEther('0')
    };

    /* calculate minimum expected fyDai value and factor in slippage */
    const daiReserves = await getBalance(deployedContracts.Dai, 'Dai', poolAddr);
    const fyDaiReserves = await getBalance(series.fyDaiAddress, 'FYDai', poolAddr);
    const [ , fyDaiSplit ] = splitDaiLiquidity( parsedDaiUsed, daiReserves, fyDaiReserves );

    /* Contract interaction */
    let tx:any;
    let maxFYDai:BigNumber;
    setAddLiquidityActive(true);
    try {
      maxFYDai = utils.mulRay(fyDaiSplit, utils.toRay(1.1));
      tx = await proxyContract.addLiquidity(poolAddr, parsedDaiUsed, maxFYDai, overrides);
    } catch (e) {
      handleTxBuildError(e);
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
   * @param {number|BigNumber} tokens amount of tokens to remove. 
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidity = async (
    // removeLiquidityEarly(address from, uint256 poolTokens, uint256 DaiLimit)
    // removeLiquidityMature(address from, uint256 poolTokens)
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {
    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());

    const overrides = { 
      gasLimit: BigNumber.from('1000000')
    };

    /* Contract interaction */
    let tx:any;
    // let minDai:BigNumber;
    let minFYDai:BigNumber;
    setRemoveLiquidityActive(true);
    try {
      if ( !series.isMature() ) {
        // eslint-disable-next-line no-console
        console.log('Removing liquidity BEFORE maturity');
        /* calculate expected trade values  */      
        const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));
        
        if ( !(preview instanceof Error) ) {
          minFYDai = utils.divRay( preview.mul(BigNumber.from('1000000000')), utils.toRay(1.1));
          minFYDai = ethers.utils.parseEther('0');
        } else {
          throw(preview);
        }

        tx = await proxyContract.removeLiquidityEarlyDaiFixed(poolAddr, parsedTokens, minFYDai, overrides );

      } else {
        console.log('removing liquidity AFTER maturity');
        tx = await proxyContract.removeLiquidityMature(poolAddr, parsedTokens, overrides );
      }
    } catch (e) {
      handleTxBuildError(e);
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
   * @dev Sell Dai for fyDai
   * 
   * @param {IYieldSeries} series series to act on.
   * @param daiIn Amount of dai being bought (if in BigNumber make sure its in Wei. )
   * */
  const sellDai = async (  
    series: IYieldSeries,
    daiIn: number| BigNumber, 
  ) => {
    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedDaiIn = BigNumber.isBigNumber(daiIn)? daiIn : ethers.utils.parseEther(daiIn.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    const overrides = { 
      gasLimit: BigNumber.from('500000')
    };

    /* Contract interaction */
    let tx:any;
    let minFYDaiOut:BigNumber;
    setSellActive(true);
    try {
      /* calculate expected trade values and factor in slippage */
      const preview = await previewPoolTx('selldai', series, daiIn);
      if ( !(preview instanceof Error) ) {
        minFYDaiOut = valueWithSlippage(preview, true);
      } else {
        // minFYDaiOut = ethers.utils.parseEther('0');
        throw(preview);
      }
      tx = await proxyContract.sellDai(poolAddr, toAddr, parsedDaiIn, minFYDaiOut, overrides);
    } catch (e) {
      handleTxBuildError(e);
      setSellActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Selling ${daiIn} DAI pending...`, type:'SELL_DAI' } } );
    await handleTx(tx);
    setSellActive(false);
  };

  /**
   * @dev LEGACY Buy Dai with fyDai - USE BUY DAI WITH SIGNATURE
   * @param {IYieldSeries} series yield series to act on.
   * @param daiOut Amount of dai being bought
   * */ 
  const buyDaiNoSignature= async ( 
    series: IYieldSeries, 
    daiOut:number,
  ) => {
    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedDaiOut = BigNumber.isBigNumber(daiOut)? daiOut : ethers.utils.parseEther(daiOut.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    const overrides = { 
      gasLimit: BigNumber.from('250000')
    };

    /* Contract interaction */
    let tx:any;
    let maxFYDaiIn:BigNumber;
    setBuyActive(true);
    try {
      /* calculate expected trade values and factor in slippage */
      const preview = await previewPoolTx('buydai', series, daiOut);
      if ( !(preview instanceof Error) ) {
        maxFYDaiIn = valueWithSlippage(preview);
      } else {
        // maxFYDaiIn = ethers.utils.parseEther('1000000');
        throw(preview);
      }
      tx = await proxyContract.buyDai(poolAddr, toAddr, parsedDaiOut, maxFYDaiIn, overrides);
    } catch (e) {
      handleTxBuildError(e);  
      setBuyActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying back ${daiOut} DAI pending...`, type:'BUY_DAI' } } );
    await handleTx(tx);
    setBuyActive(false);
  };

  /**
   * @dev Buy Dai with fyDai
   * @param {IYieldSeries} series yield series to act on.
   * @param daiOut Amount of dai being bought
   * */ 
  const buyDai = async ( 
    series: IYieldSeries, 
    daiOut:number,
  ) => {
    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const fyDaiAddr = ethers.utils.getAddress(series.fyDaiAddress);
    const parsedDaiOut = BigNumber.isBigNumber(daiOut)? daiOut : ethers.utils.parseEther(daiOut.toString());
    const toAddr = account && ethers.utils.getAddress(account);
    const fromAddr = account && ethers.utils.getAddress(account);

    const overrides = { 
      gasLimit: BigNumber.from('500000')
    };

    /* Contract interaction */
    let tx:any;
    let maxFYDaiIn:BigNumber;
    let fyDaiPermitSig:any;
    setBuyActive(true);
    try { 
      /* calculate expected trade values and factor in slippage */
      const preview = await previewPoolTx('buydai', series, daiOut);
      if ( !(preview instanceof Error) ) {
        maxFYDaiIn = valueWithSlippage(preview);
      } else {
        // maxFYDaiIn = ethers.utils.parseEther('1000000');
        throw(preview);
      }

      /* Get the user signature authorizing fyDai to interact with Dai */
      try {
        dispatch({ type: 'requestSigs', payload:[ auths.get(2) ] });
        const result = await signERC2612Permit(
          provider.provider, 
          fyDaiAddr,
          // @ts-ignore 
          fromAddr, 
          poolAddr
        );
        fyDaiPermitSig = ethers.utils.joinSignature(result);
        dispatch({ type: 'signed', payload: auths.get(2) });
        dispatch({ type: 'requestSigs', payload: [] });
      } catch (e) { 
        handleTxBuildError(e);
        dispatch({ type: 'requestSigs', payload: [] });
        setRepayActive(false);
        return;
      }

      tx = await proxyContract.buyDaiWithSignature(
        poolAddr, 
        toAddr, 
        parsedDaiOut, 
        maxFYDaiIn, 
        fyDaiPermitSig,
        overrides
      );
    } catch (e) {
      handleTxBuildError(e);  
      setBuyActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Buying back ${daiOut} DAI pending...`, type:'BUY_DAI' } } );
    await handleTx(tx);
    setBuyActive(false);
  };

  /**
   * SPLITTER SECTION
   *  */
  // Splitter: Maker to Yield proxy
  // @dev Transfer debt and collateral from MakerDAO to Yield
  // Needs vat.hope(splitter.address, { from: user });
  // Needs controller.addDelegate(splitter.address, { from: user });
  // @param pool The pool to trade in (and therefore fyDai series to borrow)
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
  // @param pool The pool to trade in (and therefore fyDai series to migrate)
  // @param user Vault to migrate.
  // @param fyDaiAmount fyDai debt to move from Yield to MakerDAO.
  // @param wethAmount weth to move from Yield to MakerDAO. Needs to be high enough to collateralize the dai debt in MakerDAO,
  // and low enough to make sure that debt left in Yield is also collateralized.
  const yieldToMaker = () => {
    //  yieldToMaker(address pool, address user, uint256 fyDaiAmount, uint256 wethAmount)
  };

  /* Splitter Views */
  // @dev Minimum weth needed to collateralize an amount of dai in MakerDAO
  const wethForDai = () => {
    // wethForDai(uint256 daiAmount) public view returns (uint256)
  };
  // @dev Amount of fyDai debt that will result from migrating Dai debt from MakerDAO to Yield
  const fyDaiForDai = () => {
    // fyDaiForDai(address pool, uint256 daiAmount)
  };
  // @dev Amount of dai debt that will result from migrating fyDai debt from Yield to MakerDAO
  const daiForFYDai = () => {
    // daiForFYDai(address pool, uint256 fyDaiAmount)
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
    buyDaiNoSignature,

    /* Splitter fns */
    makerToYield,
    yieldToMaker,

    /* Splitter views */
    wethForDai,
    fyDaiForDai,
    daiForFYDai

  } as const;
};


