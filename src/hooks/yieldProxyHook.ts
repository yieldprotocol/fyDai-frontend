import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';
import * as utils from '../utils';

import { IYieldSeries } from '../types';

import YieldProxy from '../contracts/YieldProxy.json';

import { TxContext } from '../contexts/TxContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useMath } from './mathHooks';
import { useToken } from './tokenHook';
import { useTxHelpers } from './txHooks';

import { useTempProxy } from './tempProxyHook';

const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

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
  const  { dispatch }  = useContext<any>(TxContext);
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { seriesData } }  = useContext<any>(SeriesContext);
  const  { state: { preferences: { slippage, useTxApproval } } }  = useContext<any>(UserContext);

  /* hooks */ 
  const { signer, provider, account } = useSignerAccount();
  const { previewPoolTx } = usePool();
  const { splitDaiLiquidity } = useMath();
  const { getBalance, approveToken } = useToken();
  const { handleTx, handleTxRejectError } = useTxHelpers();

  const { removeLiquidityWithSignature } = useTempProxy();
  
  /* Activity flags */
  const [ postEthActive, setPostEthActive ] = useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = useState<boolean>(false);
  const [ repayActive, setRepayActive ] = useState<boolean>(false);
  const [ removeLiquidityActive, setRemoveLiquidityActive ] = useState<boolean>(false);
  const [ addLiquidityActive, setAddLiquidityActive ] = useState<boolean>(false);
  const [ buyActive, setBuyActive ] = useState<boolean>(false);
  const [ buyApprovalActive, setBuyApprovalActive ] = useState<boolean>(false);
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
      handleTxRejectError(e);
      setPostEthActive(false);
      return;
    }
    await handleTx({ tx, msg: `Depositing ${amount} ETH`, type:'DEPOSIT', series: null });
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
      handleTxRejectError(e);
      setWithdrawEthActive(false);
      return;
    }
    await handleTx({ tx, msg: `Withdrawing ${amount} ETH `, type:'WITHDRAW', series: null });
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
      gasLimit: BigNumber.from('300000')
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
      handleTxRejectError(e); 
      setBorrowActive(false);
      return;
    }
    await handleTx({ tx, msg: `Borrowing ${daiToBorrow} Dai from ${series.displayNameMobile}`, type:'BORROW', series });
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
      gasLimit: BigNumber.from('250000')
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
          console.log('Repaying after maturity - Signature required');
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
          handleTxRejectError(e);
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
          { gasLimit: BigNumber.from('400000') }
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
      handleTxRejectError(e);
      setRepayActive(false);
      return;
    }
    await handleTx({ tx, msg: `Repaying ${repaymentInDai} Dai to ${series.displayNameMobile}`, type:'REPAY', series });
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
      gasLimit: BigNumber.from('600000'),
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
      handleTxRejectError(e);
      setAddLiquidityActive(false);
      return;
    }
    await handleTx({ tx, msg: `Adding ${daiUsed} DAI liquidity to ${series.displayNameMobile}`, type:'ADD_LIQUIDITY', series });
    setAddLiquidityActive(false);
  };


  /**
   * @dev removes liquidity from a pool - redirects to removal with/without signature
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} tokens amount of tokens to remove. 
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidity = async (
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {
    setRemoveLiquidityActive(true);
    /* if the user has pool tokens in more than one series, then direct them to the temp proxy */
    if ( Array.from(seriesData).filter(([ key, value ]: any) => value.poolTokens > 0 ).length > 1  ) {
      /* temporary proxy patched for removing liquidity if user has liquidity in more than one series */
      await removeLiquidityWithSignature(series, tokens);
    } else {
      /* else remove liquidity with no signature */
      await removeLiquidityNoSignature(series, tokens);
    }
    setRemoveLiquidityActive(false);
  };
  

  /**
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} tokens amount of tokens to remove. 
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidityNoSignature = async (
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
    let minFYDai:BigNumber;

    try {
      if ( !series.isMature() ) {
        // eslint-disable-next-line no-console
        console.log('Removing liquidity BEFORE maturity');
        
        /* calculate expected trade values  */      
        const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
        if ( !(preview instanceof Error) ) {
          minFYDai = utils.divRay( preview.mul(BigNumber.from('1000000000')), utils.toRay(1.1));
        } else {
          throw(preview);
        }
        tx = await proxyContract.removeLiquidityEarlyDaiFixed(poolAddr, parsedTokens, minFYDai, overrides );
      } else {
        console.log('Removing liquidity AFTER maturity');
        tx = await proxyContract.removeLiquidityMature(poolAddr, parsedTokens, { gasLimit: BigNumber.from('1000000') } );
      }
    } catch (e) {
      handleTxRejectError(e);
      setRemoveLiquidityActive(false);
      return;
    }
    await handleTx({ tx, msg: `Removing ${tokens} DAI liquidity from ${series.displayNameMobile}`, type:'REMOVE_LIQUIDITY', series });

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
      gasLimit: BigNumber.from('200000')
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
        tx = await proxyContract.sellDai(poolAddr, toAddr, parsedDaiIn, minFYDaiOut, overrides);
      } else {
        // minFYDaiOut = ethers.utils.parseEther('0');
        throw(preview);
      }
      // tx = await proxyContract.sellDai(poolAddr, toAddr, parsedDaiIn, minFYDaiOut, overrides);
    } catch (e) {
      handleTxRejectError(e);
      setSellActive(false);
      return;
    }
    await handleTx({ tx, msg: `Lending ${daiIn} DAI to ${series.displayNameMobile} `, type:'SELL_DAI', series });
    setSellActive(false);
  };

  /**
   * @dev This selects which type of buy to use depending on maturity and authorisations.
   * @param {IYieldSeries} series yield series to act on.
   * @param daiOut Amount of dai being bought
   * */ 
  const buyDai = async (
    series: IYieldSeries, 
    daiOut:number,
    forceTxApproval:boolean=false,
  ) => {
    /* if the user preferes to use tx approvals, or the series has previously been approved */
    if ( useTxApproval || series.hasCloseAuth || forceTxApproval ) {
      /* authorised the series if it hasnt already been authorized  (eg. in the case to approval transaction users) */
      if (!series.hasCloseAuth) {
        setBuyApprovalActive(true);
        /* handle signing */
        await approveToken(series?.fyDaiAddress, series?.poolAddress, MAX_INT, series).then(async (x:any) => {
          if ( x === undefined ) {
            setBuyApprovalActive(false);
            await buyDaiNoSignature(series, daiOut);
          } else {
            // eslint-disable-next-line no-console
            console.log(x);
            setBuyApprovalActive(false);
          }   
        }); 
      } else { await buyDaiNoSignature(series, daiOut); }
    } else {
      /* if the user uses permits as auth and hasn't authed for pre-maturity closes */
      await buyDaiWithSignature(series, daiOut);
    }
  };

  /**
   * @dev for use as the when user has already authorised buying the series OR, no signing abilities (eg. ledger)
   * @param {IYieldSeries} series yield series to act on.
   * @param daiOut Amount of dai being bought
   * */ 
  const buyDaiNoSignature = async ( 
    series: IYieldSeries, 
    daiOut:number,
  ) => {
    /* Processing and/or sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedDaiOut = BigNumber.isBigNumber(daiOut)? daiOut : ethers.utils.parseEther(daiOut.toString());
    const toAddr = account && ethers.utils.getAddress(account);

    const overrides = { 
      gasLimit: BigNumber.from('200000')
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
      handleTxRejectError(e);
      setBuyActive(false);
      return;
    }
    await handleTx({ tx, msg: `Closing ${daiOut} DAI from ${series.displayNameMobile}`, type:'BUY_DAI', series });
    setBuyActive(false);
  };

  /**
   * @dev for when a user hasnt authrorised the series, and prefers signing using permits
   * @param {IYieldSeries} series yield series to act on.
   * @param daiOut Amount of dai being bought
   * */ 
  const buyDaiWithSignature = async ( 
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
      gasLimit: BigNumber.from('250000')
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
        /* If there is a problem with the signing, try to use an approval tx as the fallback flow, but ignore if error code 4001 (user reject) */
        if ( e.code !== 4001 ) {
          console.log(e);
          dispatch({ type: 'requestSigs', payload:[] });
          setBuyActive(false);
          // eslint-disable-next-line no-console
          console.log('Fallback to approval transaction');
          await buyDai(series, daiOut, true);
          return;
        }
        dispatch({ type: 'requestSigs', payload:[] });
        setBuyActive(false);
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
      handleTxRejectError(e);  
      setBuyActive(false);
      return;
    }
    await handleTx({ tx, msg: `Closing ${daiOut} DAI from ${series.displayNameMobile}`, type:'BUY_DAI', series });
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
    buyDai, buyActive, buyApprovalActive,

    /* Splitter fns */
    makerToYield,
    yieldToMaker,

    /* Splitter views */
    wethForDai,
    fyDaiForDai,
    daiForFYDai

  } as const;
};


