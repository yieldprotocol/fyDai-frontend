import React from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext';
// import { SeriesContext } from '../contexts/SeriesContext';

/**
 * Hooks for yeild maths functions
 * 
 * @returns { function } addEventListner
 * @returns { function } removeEventListener
 * @returns { function } getEvents
 */
export const useMath = () => {

  const { state: { feedData, userData } } = React.useContext(YieldContext);
  const { ilks } = feedData;
  const ethPosted = userData?.ethPosted || BigNumber.from('0');
  // const { seriesRates, seriesData } = React.useContext(SeriesContext);

  /**
   * Gets the amount of collateral posted
   * @returns {BigNumber}
   */
  const collAmount = (): BigNumber => {
    return ethPosted;
  };

  /**
   * Calculates the USD value per unit collateral
   * @returns {BigNumber} in RAY
   */
  const collUnitValue = (): BigNumber => {
    // TODO: Update this to use ETH-A Oracle - not ilks.spot for market price USD
    return utils.mulRay(BigNumber.from(150), (ilks.spot));
  };

  /**
   * Calculates the total value of collateral at the current unit price
   * @returns {BigNumber}
   */
  const collValue = (): BigNumber => {
    return collAmount().mul(collUnitValue());
    // return utils.mulRay(collatAmount(), CollatUSDValue());
  };

  /**
   * Calculates value of debt (yDaiDebt at maturity or Dai) at current DAI price
   * the rate used is the spot price of Dai.
   * @param {BigNumber} _amount yDai amount (= amount of Dai at maturity)
   * @returns
   */
  const debtVal = (_amount:BigNumber ) => {
    return utils.divRay(_amount, ilks.spot);
  };

  /**
   * Calculates the collateralisation ratio 
   * ETH collat value and DAI debt value (in USD)
   *
   * @param {BigNumber} _collateralValue
   * @param {BigNumber} _debtValue
   * @returns
   */
  const collRatio = (_collateralValue:BigNumber, _debtValue:BigNumber) => {
    if (_debtValue.eq(0) ) {
      // handle this case better
      return BigNumber.from(0);
    }
    return _collateralValue.div(_debtValue);
  };

  /**
   * Calculates an ESTIMATE of the collateralisation ratio 
   * ETH collat value and DAI debt value (in USD) using 
   * normal numbers
   *
   * @param {number} _collateralAmount  amount of collateral (eg. 10ETH)
   * @param {number} _debtValue value of dai debt (in USD)
   * @returns {number}
   */
  const estCollRatio = (_collateralAmount:Number, _debtValue:Number) => {
    if (!_collateralAmount || _debtValue === 0 ) {
      // TODO handle this better
      return undefined;
    }
    const _colAmnt = ethers.utils.parseEther(_collateralAmount.toString());
    const _debtVal = ethers.utils.parseEther(_debtValue.toString());
    const _colVal = _colAmnt.mul(collUnitValue());
    const _ratio = _colVal.div(_debtVal);
    return parseFloat(_ratio.toString());
  };

  /**
   * Minimum amount of collateral required to stay above liquidation point
   *
   * @param {BigNumber} _debtValue
   * @param {BigNumber} _liquidationRatio
   * @param {*} _price
   * @returns
   */
  const minSafeColl=(_debtValue:BigNumber, _liquidationRatio:BigNumber)=> {
    return _debtValue.mul(_liquidationRatio).div(collUnitValue());
  };

  /**
   *  Calculates the liquidation price
   *
   * @param {BigNumber} _collateralAmount
   * @param {BigNumber} _debtValue
   * @param {*} _liquidationRatio
   * @returns
   */
  const liquidationPrice = (
    _collateralAmount:BigNumber,
    _debtValue:BigNumber,
    _liquidationRatio:any
  ) => {
    if (_collateralAmount.eq(0)) {
      // // Do something here to handle 0 collateral
      // const ratio = createCurrencyRatio(USD, _collateralAmount.type);
      // handle this case better
      return BigNumber.from(0);
    }
    return _debtValue.mul(_liquidationRatio).div(_collateralAmount);
  };

  /**
   * Max amount of Dai that can be borrowed
   *
   * @param {BigNumber} _collateralValue
   * @param {BigNumber} _debtValue
   * @param {*} _liquidationRatio
   * @returns {BigNumber} 
   */
  const daiAvailable =(_collateralValue:BigNumber, _debtValue:BigNumber, _liquidationRatio:BigNumber) =>{
    const maxSafeDebtValue = _collateralValue.div(_liquidationRatio);
    const _max = _debtValue.lt(maxSafeDebtValue) ? maxSafeDebtValue.sub(_debtValue) : 0;
    return _max;
  };

  /**
   * Annualised Yield Rate
   *
   * @param { BigNumber } _rate // current [Dai] price per unit y[Dai]
   * @param { number } _maturity  // date of maturity 
   * @returns { number }
   */
  const yieldAPR =(_rate: BigNumber, _maturity:number)=> {
    const secsToMaturity = _maturity - (Math.round(new Date().getTime() / 1000));
    const propOfYear = secsToMaturity/utils.SECONDS_PER_YEAR;
    const priceRatio = 1 / parseFloat(ethers.utils.formatEther(_rate));
    const powRatio = 1 / propOfYear;
    const apr = Math.pow(priceRatio, powRatio) - 1;
    // console.log('series:', _maturity, 'APR:', apr);
    return apr;
  };

  return {
    yieldAPR,
    collAmount,
    collValue,
    debtVal,
    collRatio,
    estCollRatio,
    minSafeColl,
    daiAvailable
  } as const;

};
