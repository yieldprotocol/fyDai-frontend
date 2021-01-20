import { useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext';
import { divDecimal, mulDecimal, collateralizationRatio, borrowingPower } from '../utils/yieldMath';

/**
 * Hook for Yield maths functions
 * 
 * @returns { function } collPrice 
 * @returns { function } collateralValue
 * @returns { function } estBorrowingPower
 * 
 */
export const useMath = () => {
  const { state: { feedData } } = useContext(YieldContext);
  
  /**
   * Calculates the total value of collateral at the current unit price
   * @returns { string } USD value (in wad/wei precision)
   */
  const collateralValue = (collateralAmount:BigNumber | string): string => {
    return mulDecimal(collateralAmount, feedData.ethPrice );
  };


  /**
   * Calculates an ESTIMATE of the collateralization ratio 
   * ETH collat value and DAI debt value (in USD) using 
   * normal numbers
   *
   * @param {BigNumber | string } collateralAmount  amount of collateral (eg. 10ETH)
   * @param {BigNumber | string } debtValue value of dai debt (in USD)
   * @returns { string | undefined }
   */
  const estCollRatio = ( 
    collateralAmount:BigNumber |string, 
    debtValue: BigNumber,
    asPercent: boolean = false // optional return as a percentage
  ): string => {
    return collateralizationRatio(collateralAmount, feedData.ethPrice, debtValue, asPercent) || '0'; 
  };
  
  /**
   * Calculates the borrowing power for a certain
   * ETH collat value and DAI debt value (in USD)
   * with a min collateralization ration 150% 
   *
   * @param {BigNumber | string } collateralAmount amount of collateral (in wei)
   * @param {BigNumber | string } debtValue value of dai debt (in USD)
   * @returns { string | undefined }
   */
  const estBorrowingPower = (collateralAmount:BigNumber | string, debtValue: BigNumber | string ) => {
    return borrowingPower( collateralAmount, feedData.ethPrice, debtValue ); 
  };

  // /**
  //  * Max amount of Dai that can be borrowed
  //  *
  //  * @param {BigNumber} collateralValue in wei wad precision
  //  * @param {BigNumber} debtValue in wei wad precision
  //  * @param {number} liquidationRatio eg. 1.5
  //  * @returns {BigNumber} in wei/wad precision
  //  */
  // const daiAvailable = (
  //   collateralValue:BigNumber | string, 
  //   debtValue:BigNumber,
  //   liquidationRatio: BigNumber | string
  // ) =>{
  //   const maxSafeDebtValue = new Decimal(divDecimal(collateralValue, liquidationRatio));
  //   const _max = debtValue.lt(maxSafeDebtValue) ? maxSafeDebtValue.sub(debtValue) : BigNumber.from('0');
  //   return _max;
  // };


  /**
   * Split a certain amount of Dai liquidity into its fyDai and Dai componetnts
   * 
   * @param {BigNumber} daiAmount // amount dai to split
   * @param { BigNumber } _daiReserves// Dai reserves
   * @param { BigNumber } _fyDaiReserves// fyDai reservers
   * 
   * @returns  [ BigNumber, BigNumber ] returns an array of [dai, fyDai] 
   */
  const splitDaiLiquidity =(
    _daiAmount: BigNumber,
    _daiReserves: BigNumber,
    _fyDaiReserves: BigNumber,
  )=> {
    const daiPortion = _daiAmount.mul(_daiReserves).div(_fyDaiReserves.add(_daiReserves));
    const fyDaiPortion = _daiAmount.sub(daiPortion);
    return [ daiPortion, fyDaiPortion ];
  };

  /**
   * Annualised Yield Rate
   *
   * @param { BigNumber } _rate // current [Dai] price per unit y[Dai]
   * @param { BigNumber } _amount // y[Dai] amount at maturity
   * @param { number } _maturity  // date of maturity
   * @param { number } _fromDate // ***optional*** start date - defaults to now()
   * 
   * @returns { number } human readable number.
   */
  const calcAPR =(
    _rate: BigNumber,
    _amount: BigNumber,
    _maturity:number,
    _fromDate:number = (Math.round(new Date().getTime() / 1000)), // if not provided, defaults to current time.
  )=> {

    if (
      _maturity > Math.round(new Date().getTime() / 1000)
    ) {
      const secsToMaturity = _maturity - _fromDate;
      const propOfYear = secsToMaturity/utils.SECONDS_PER_YEAR;
      const priceRatio = parseFloat(_amount.toString()) / parseFloat(_rate.toString());
      const powRatio = 1 / propOfYear;
      const apr = Math.pow(priceRatio, powRatio) - 1;
      if(apr>0 && apr<100) {
        return apr*100;
      }
      return 0;
    }
    return 0;
  };



  return {
    calcAPR,

    splitDaiLiquidity,

    collateralValue,
    estCollRatio,
    estBorrowingPower,
  } as const;

};
