import { ethers, BigNumber }  from 'ethers';

import Pool from '../contracts/Pool.json';

import { useSignerAccount } from './connectionHooks';
import { IYieldSeries } from '../types';
import { useTxHelpers } from './txHooks';
import { useDsProxy } from './dsProxyHook';
import { useToken } from './tokenHook';

import { useMath } from './mathHooks';

/**
 * Hook for interacting with the yield 'Pool' Contract
 */
export const usePool = () => {

  const { abi: poolAbi } = Pool;
  const { fallbackProvider, provider, signer, account } = useSignerAccount();
  const { handleTx, handleTxRejectError } = useTxHelpers();
  const { proxyExecute } = useDsProxy();
  const { getBalance } = useToken();
  const { estTrade } = useMath();

  /**
   * @dev Sell fyDai for Dai ( Chai )
   * @note NOT limit pool
   * 
   * @param { IYieldSeries } series of the fyDai market series
   * @param { number } fyDaiIn Amount of fyDai being sold that will be taken from the user's wallet (in human numbers)
   *
   * @return Amount of chai that will be deposited on `to` wallet
   */
  const sellFYDai = async (
    series:IYieldSeries,
    fyDaiIn: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(fyDaiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const overrides = { 
      gasLimit: BigNumber.from('300000')
    };
    
    let tx:any;

    const contract = new ethers.Contract( poolAddr, poolAbi, signer );
    try {
      tx = await contract.sellFYDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxRejectError(e);
      return;
    }
    await handleTx(
      { 
        tx, 
        msg: `Sell fyDai ${fyDaiIn} pending...`, 
        type:'SELL', 
        series,
        value: parsedAmount.toString() 
      });
  };

  /**
   * @dev Buy fyDai with dai/chai
   * @note NOT limit pool
   *
   * @param {IYieldSeries} series fyDai series market.
   * @param {number} fyDaiOut Amount of fyDai being bought that will be deposited in `to` wallet
   * @return Amount of chai/Dai that will be taken from `from` wallet
   */
  const buyFYDai = async (
    series:IYieldSeries,
    fyDaiOut: number
  ) => {
    const parsedAmount = ethers.utils.parseEther(fyDaiOut.toString());
    const fromAddr = ethers.utils.getAddress(series.fyDaiAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const overrides = { 
      gasLimit: BigNumber.from('250000')
    };

    let tx:any;
    const contract = new ethers.Contract( poolAddr, poolAbi, signer );
    try {
      tx = await contract.buyFYDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxRejectError(e);
      return;
    }
    await handleTx({ 
      tx, 
      msg: `Buying fyDai ${fyDaiOut} pending...`, 
      type:'BUY', 
      series, 
      value: parsedAmount.toString()
    });
  };

  /**
   * @dev Sell Dai/Chai for fyDai
   * @note NOT limit pool
   * 
   * @param {IYieldSeries} series fyDai.
   * @param {number} daiIn Amount of fyDai being bought that will be deposited in `to` wallet
   * @return Amount of fyDai that will be deposited on `to` wallet
   * 
   */
  const sellDai = async (
    series:IYieldSeries,
    daiIn: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiIn.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const poolAddr = ethers.utils.getAddress(series.poolAddress);

    const overrides = { 
      gasLimit: BigNumber.from('300000')
    };

    let tx:any;
    const contract = new ethers.Contract( poolAddr, poolAbi, signer );
    try {
      tx = await contract.sellDai(fromAddr, toAddr, parsedAmount, overrides);
    } catch (e) {
      handleTxRejectError(e);
      return;
    }
    await handleTx(
      { 
        tx, 
        msg: `Selling ${daiIn} DAI pending...`, 
        type:'SELL', 
        series, 
        value: parsedAmount.toString()  
      });
  };


  /**
   * @dev Buy Dai/Chai with fyDai
   * @note NOT limit pool
   * 
   * @param {IYieldSeries} series fyDai contract.
   * @param {number} daiOut Amount of dai/chai being bought that will be deposited in `to` wallet
   * 
   * @return Amount of fyDai that will be taken from `from` wallet
   *
   */
  const buyDai = async (
    series:IYieldSeries,
    daiOut: number,
  ) => {
    const parsedAmount = ethers.utils.parseEther(daiOut.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = account && ethers.utils.getAddress(account);
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    
    const overrides = { 
      gasLimit: BigNumber.from('300000')
    };

    let tx:any;
    const contract = new ethers.Contract(poolAddr, poolAbi, signer );
    try {
      tx = await contract.buyDai(fromAddr, toAddr, parsedAmount, overrides );
    } catch (e) {
      handleTxRejectError(e);
      return;
    }
    await handleTx(
      { 
        tx, 
        msg: `Buying ${daiOut} Dai pending...`, 
        type:'BUY', 
        series,
        value: parsedAmount.toString() 
      });
  };

  /**
   * @dev Delegate a 3rd party to act on behalf of the user in the Pool contracts
   * @param {IYieldSeries} series in question.
   * @param {string} delegatedAddress address of the contract/entity getting delegated. 
   */
  const addPoolDelegate = async (
    series:IYieldSeries,
    delegatedAddress:string,
    asProxy: boolean = false,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const delegatedAddr = ethers.utils.getAddress(delegatedAddress);
    /* Contract interaction */
    const contract = new ethers.Contract(
      poolAddr,
      poolAbi,
      signer
    );

    if (!asProxy) {
      try {
        tx = await contract.addDelegate(delegatedAddr);
      } catch (e) {
        return handleTxRejectError(e);
      }
      /* Transaction reporting & tracking */
      await handleTx({ tx, msg: 'Yield Series Pool authorization', type:'AUTH_POOL', series, value: null });
      
    } else { 
      const calldata = contract.interface.encodeFunctionData('addDelegate', [delegatedAddr]);
      tx = await proxyExecute(
        poolAddr,
        calldata,
        { },
        { 
          tx: null, 
          msg: 'Yield Series Pool authorization', 
          type:'AUTH_POOL', 
          series, 
          value: null 
        }
      );
    }

    // eslint-disable-next-line consistent-return
    return true;
  };

  /**
   * @dev Checks to see if an account (user) has delegated a contract/3rd Party for a particular market. 
   * @param {string} poolAddress address of the market in question.
   * @param {string} delegateAddress address of the Proxy (contract getting approved). 
   * @returns {Promise<boolean>} approved ?
   * @note call function 
   */
  const checkPoolDelegate = async (
    poolAddress:string,
    delegateAddress:string
  ): Promise<boolean> => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const delegateAddr = ethers.utils.getAddress(delegateAddress);
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const contract = new ethers.Contract( marketAddr, poolAbi, provider);
    let res;
    try {
      res = await contract.delegated(fromAddr, delegateAddr);
    }  catch (e) {
      res = false;
    }
    return res;
  };

  /**
   * @dev Check a pools total supply
   * @param {string} poolAddress address of the market in question.
   * @returns {Promise<boolean>} approved ?
   * @note call function 
   */
  const poolTotalSupply = async (
    poolAddress:string,
  ): Promise<string> => {
    const poolAddr = ethers.utils.getAddress(poolAddress);
    const contract = new ethers.Contract( poolAddr, poolAbi, fallbackProvider);
    let res;
    try {
      res = await contract.totalSupply();
    }  catch (e) {
      res = '0';
    }
    return res;
  };

  /**
   * @dev gets the fyDai virtual reserves of the pool.
   * @param {string} poolAddress address of the market in question.
   * @returns {Promise<boolean>} approved ?
   * @note call function 
   */
  const getFyDaiReserves = async (
    poolAddress:string,
  ): Promise<string> => {
    const poolAddr = ethers.utils.getAddress(poolAddress);
    const contract = new ethers.Contract( poolAddr, poolAbi, fallbackProvider);
    let res;
    try {
      res = await contract.getFYDaiReserves();
    }  catch (e) {
      res = '0';
    }
    return res;
  };

  /**
   * @dev gets all the reserves for a pool().
   * @param {IYieldSeries} series series in question.
   * @returns {Promise<String[]>}  [ daiReserves, fyDaiRealReserves, fyDaiVirtualReserves, fyDaiCombinedReserves ] 
   * @note call function
   */
  const getReserves = async (
    series: IYieldSeries,

  ): Promise<string[]> => {
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const fyDaiAddr = ethers.utils.getAddress(series.fyDaiAddress);
    const contract = new ethers.Contract( poolAddr, poolAbi, fallbackProvider);

    let daiRes = BigNumber.from('0');
    let fyDaiReal = BigNumber.from('0');
    let fyDaiVirtual = BigNumber.from('0');
    
    try {
      [ daiRes, fyDaiReal, fyDaiVirtual ] = await Promise.all( [
        contract.getDaiReserves(),
        getBalance(fyDaiAddr, 'FYDai', poolAddr),
        contract.getFYDaiReserves(),
      ]);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return [ 
        daiRes.toString(), 
        fyDaiReal.toString(), 
        fyDaiVirtual.toString() 
      ];
    }

    return [ 
      daiRes.toString(), 
      fyDaiReal.toString(), 
      fyDaiVirtual.toString(),
      fyDaiReal.add(fyDaiVirtual).toString() 
    ];
  };

  /**
   * @dev Preview buy/sell transactions
   * 
   * sellFYDai -> Returns how much Dai would be obtained by selling x fyDai
   * buyDai -> Returns how much fyDai would be required to buy x Dai
   * buyFYDai -> Returns how much Dai would be required to buy x fyDai
   * sellDai -> Returns how much fyDai would be obtained by selling x Dai
   * 
   * @param {string} previewType string represnting transaction type //TODO tyescript it out
   * @param {IYieldSeries} series fyDai series to redeem from.
   * @param {number | BigNumber} amount input to preview
   * @param {boolean} runLocal run the simulation locally (no blockchain call required)
   * 
   * @returns {BigNumber| null} BigNumber in WEI/WAD precision - Dai or fyDai (call dependent)
   * 
   * @note call function 
   */
  const previewPoolTx = async (
    previewType: string,
    series: IYieldSeries,
    amount: number | BigNumber,
    runLocal: boolean = false,
  ): Promise<BigNumber|Error> => {
    // const type = previewType.toUpperCase();
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const contract = new ethers.Contract( poolAddr, poolAbi, fallbackProvider);
    let value = BigNumber.from('0');
      
    try {
      if ( series.isMature() === false && !runLocal ) {
        switch (previewType) {
          case 'buyDai':
            value = await contract.buyDaiPreview(parsedAmount); break;
          case 'sellDai': 
            value = await contract.sellDaiPreview(parsedAmount); break;
          case 'buyFYDai':
            value = await contract.buyFYDaiPreview(parsedAmount); break;
          case 'sellFYDai':
            value = await contract.sellFYDaiPreview(parsedAmount); break;
          default: 
            value = await BigNumber.from('0');
        }
        return value; 
      }

      /* if runLocal, use the mathHooks estTrade fn. */
      return estTrade( previewType, series, parsedAmount );

    } catch (e) {
      return e;
    }

  };

  /**
   * @dev Checks the health/state of a particular pool
   *
   * @param {IYieldSeries} series series to check the pool state
   * @returns {active:boolean, reason:string} status of the pool
   * 
   */
  const checkPoolState = (
    series: IYieldSeries,
  ): any => {

    if ( series.isMature() ) { return { active: false, reason: 'Series is mature' };}
    if ( series.totalSupply?.isZero() ) { return { active: false, reason: 'Pool not initiated' };}
    if ( series.yieldAPR && !(Number.isFinite(parseFloat(series.yieldAPR))) ) { return { active: false, reason: 'Limited Liquidity' };}
    return { active:true, reason:'Pool is operational' };
  };

  return { 

    sellFYDai,
    buyFYDai,
    sellDai,
    buyDai,

    getReserves,
    getFyDaiReserves,

    addPoolDelegate,
    checkPoolDelegate,
    checkPoolState,

    poolTotalSupply,
    previewPoolTx,

  } as const;
};
