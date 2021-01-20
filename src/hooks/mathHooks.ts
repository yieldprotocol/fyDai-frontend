import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext';
import { divDecimal, mulDecimal, collateralizationRatio, borrowingPower } from '../utils/yieldMath';

/**
 * Hook for Yield maths functions
 * 
 * ( not really 'hooks' - but beneficial to keep app logic together.)
 * 
 * @returns { function } collPrice 
 * @returns { function } collValue 
 * @returns { function } getEvents
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
  const estBorrowingPower = (collateralAmount:BigNumber | string, debtValue: BigNumber | string ) => {
    return borrowingPower( collateralAmount, feedData.ethPrice, debtValue, '1.5'); 
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
    debtValue: BigNumber 
  ): string => {
    return collateralizationRatio(collateralAmount, feedData.ethPrice, debtValue) || '0'; 
  };

  // /**
  //  * Minimum amount of collateral required to stay above liquidation point
  //  *
  //  * @param {BigNumber} _debtValue (wei/wad precision)
  //  * @param {number} _liquidationRatio eg. 1.5
  //  * @param { BigNumber } _collateralPrice (in Ray precision)
  //  * @returns {BigNumber} (wad/wei precision)
  //  */
  // const minSafeColl=(_debtValue:BigNumber, _liquidationRatio:number, _collateralPrice:BigNumber)=> {
  //   const _s = utils.divRay( utils.toRay(_liquidationRatio), _collateralPrice);
  //   const _msc = utils.mulRay(_debtValue, _s);
  //   return _msc;
  // };

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
   * Percentage holding of the Pool 
   *
   * @param { BigNumber } _supply // current [Dai] price per unit y[Dai]
   * @param { BigNumber } _balance// y[Dai] amount/price at maturity
   * 
   * @returns { number } human readable number as a percent.
   */
  const poolPercent =(
    _supply: BigNumber,
    _balance: BigNumber,
  )=> {
    if (!_supply.isZero()) {
      return parseFloat(ethers.utils.formatEther(_balance))/parseFloat( ethers.utils.formatEther(_supply))*100;
    } 
    return 0;
  };

  /**
   * Calculate amount of LP Tokens that will be minted  
   *
   * @param { BigNumber } daiReservess // dai balance of pool
   * @param { BigNumber } fyDaiReserves// yDai series balance of Pool
   * @param { BigNumber } totalSupply // total LP tokens
   * @param { BigNumber } daiInput // dai input value by user
   * 
   * @returns { BigNumber } number of tokens minted
   */
  const calcTokensMinted =(
    daiReserves: BigNumber,
    fyDaiReserves: BigNumber,
    totalSupply: BigNumber,
    daiInput: BigNumber,
  )=> {
    const daiOffered = (daiInput.mul(daiReserves)).div(fyDaiReserves.add(daiReserves) );
    return (totalSupply).mul(daiOffered).div(daiReserves);
  };

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
    return [daiPortion, fyDaiPortion];
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
    calcTokensMinted,
    poolPercent,
    splitDaiLiquidity,
    collateralValue,

    estCollRatio,
    estBorrowingPower,
    // daiAvailable
  } as const;

};
