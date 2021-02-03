import { useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { YieldContext } from '../contexts/YieldContext';

import { 
  divDecimal,
  mulDecimal, 
  collateralizationRatio, 
  borrowingPower, 
  calculateAPR as calcAPR,
  buyDai,
  buyFYDai,
  sellDai,
  sellFYDai,
  secondsToFrom,
  floorDecimal,
  calcTokensMinted
} from '../utils/yieldMath';
import { IYieldSeries } from '../types';

/**
 * Hook for Yieldmaths functions: 
 * 
 * yieldMath with batteries ( app context )
 * 
 * @returns { function } collPrice 
 * @returns { function } estCollateralValue
 * @returns { function } estCollateralRatio
 * @returns { function } estBorrowingPower
 * @returns { function } calculateApr
 * 
 */
export const useMath = () => {

  const { state: { feedData } } = useContext(YieldContext);

  /**
   * Calculates the VALUE of collateral at the current unit price (from feedData context).
   * 
   * @param {BigNumber | string } collateralAmount collateral for estimation (in wad/Wei precision) 
   * @returns { string } USD value (in wad/wei precision)
   */
  const estCollateralValue = (collateralAmount:BigNumber | string): string => {
    return mulDecimal(collateralAmount, feedData.ethPrice );
  };

  /**
   * 
   * Calculates the collateralization ratio / percentage (from feedData context)
   *
   * @param { BigNumber | string } collateralAmount  amount of collateral ( in wad/wei precision )
   * @param { BigNumber | string } debtValue value of dai debt ( in wad/wei precision )
   * @param { boolean } asPercent return value string sent as a percentage instead of ratio.
   * @returns { string | undefined }
   */
  const estCollateralRatio = ( 
    collateralAmount:BigNumber |string, 
    debtValue: BigNumber,
    asPercent: boolean = false // optional return as a percentage
  ): string => {
    return collateralizationRatio(collateralAmount, feedData.ethPrice, debtValue, asPercent) || '0'; 
  };
  
  /**
   * Calculates the borrowing power based on a certain
   * ETH collateral value and DAI debt value
   * with a min collateralization ration 150% 
   *
   * @param {BigNumber | string } collateralAmount amount of collateral ( in wad/wei precision )
   * @param {BigNumber | string } debtValue value of dai debt ( in wad/wei precision )
   * @returns { string | undefined }
   */
  const estBorrowingPower = (collateralAmount:BigNumber | string, debtValue: BigNumber | string ) => {
    return borrowingPower( collateralAmount, feedData.ethPrice, debtValue ); 
  };


  /**
   * Estimates the pool share given 
   *
   * @param {IYieldSeries } series amount of collateral ( in wad/wei precision )
   * @param {BigNumber | string } tokens extra tokens to factor in (defaults to none 0)
   * @returns { string | undefined }
   */
  const estPoolShare = (
    series: IYieldSeries,
    amount: BigNumber | string,
    asPercentage: boolean = true,
  ) => {

    const { daiReserves, fyDaiReserves, fyDaiVirtualReserves, totalSupply, poolTokens } = series;
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    
    const _newTokens = calcTokensMinted(
      daiReserves, 
      fyDaiReserves,
      totalSupply, 
      parsedAmount
    );
    
    const _newBalance = BigNumber.from( floorDecimal( _newTokens) ).add( poolTokens || 0 );
    const _newTotalSupply = totalSupply.add( floorDecimal( _newTokens) );
    const _ratio = divDecimal( _newBalance, _newTotalSupply );
    const _percent = mulDecimal( _ratio, '100'); 

    return asPercentage? _percent : _ratio; 
  };


  /**
   * Annualised Yield Rate
   *
   * @param { BigNumber } rate // current [Dai] price per unit y[Dai]
   * @param { BigNumber } amount // y[Dai] amount at maturity
   * @param { number } maturity  // date of maturity
   * @param { number } fromDate // ***optional*** start date - defaults to now()
   * 
   * @returns { number } human readable number.
   */
  const calculateAPR =(
    tradeValue: BigNumber,
    amount: BigNumber,
    maturity:number,
    fromDate:number = (Math.round(new Date().getTime() / 1000)), // if not provided, defaults to current time.
  ): number => {

    // Get the rate etc for Dai 
    const res = calcAPR(tradeValue, amount, maturity, fromDate );
    const resFloat = res && parseFloat(res);
    return resFloat || 0;
  };


  const estTrade = (
    tradeType: string,
    series: IYieldSeries,  
    amount: number | BigNumber,
  ): BigNumber | Error => {

    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const { daiReserves, fyDaiVirtualReserves }  = series;
    const ttm: string = secondsToFrom( series.maturity.toString() );

    try {
      switch (tradeType) {
        case 'buyDai':
          return BigNumber.from( floorDecimal( buyDai(daiReserves, fyDaiVirtualReserves, parsedAmount, ttm) ) );
        case 'sellDai': 
          return BigNumber.from( floorDecimal( sellDai(daiReserves, fyDaiVirtualReserves, parsedAmount, ttm)) );
        case 'buyFYDai':
          return BigNumber.from( floorDecimal( buyFYDai(daiReserves, fyDaiVirtualReserves, parsedAmount, ttm)) );
        case 'sellFYDai':
          return BigNumber.from( floorDecimal( sellFYDai(daiReserves, fyDaiVirtualReserves, parsedAmount, ttm)) );
        default: 
          return BigNumber.from('0');
      }
    } catch (e) {
      return e;
    }
  };

  return {
    calculateAPR,
    estCollateralValue,
    estCollateralRatio,
    estBorrowingPower,
    estTrade,
    estPoolShare
  } as const;

};
