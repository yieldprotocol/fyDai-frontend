import React, { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext'; // TODO sort out this cyclic ref (not critical)

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
  const [ ilks, setIlks ] = useState<any>();
  
  useEffect(()=>{
    feedData.ilks && setIlks(feedData.ilks);
  }, [feedData]);

  /**
   * Calculates the USD value per unit collateral
   * @returns {BigNumber} USD in Ray precision
   */
  const collPrice = (): BigNumber => {
    // TODO: Update this to use ETH-A Oracle - not ilks.spot for market price USD
    console.log('ETH price:', ethers.utils.formatEther(utils.mulRay(utils.toWad(1.5), (ilks.spot)).toString()));
    return utils.mulRay(utils.toRay(1.5), (ilks.spot));
  };

  /**
   * Calculates the total value of collateral at the current unit price
   * @returns {BigNumber} USD value (in wad/wei precision)
   */
  const collValue = (collateralPosted:BigNumber): BigNumber => {
    console.log('Collateral Value USD:', ethers.utils.formatEther( utils.mulRay(collateralPosted, collPrice()) ) );
    return utils.mulRay(collateralPosted, collPrice());
  };

  /**
   * Calculates value of debt (eDaiDebt at maturity or Dai) at current Dai price
   * the rate used is the rate and spot price of Dai.
   * @param {BigNumber} _amount eDai amount (= amount of Dai at maturity)
   * @returns 
   */
  const debtValAdj = (_amount:BigNumber ) => {
    // this would require a DAI/USD (ratio fluctuations? ) but maybe just assume it will be 1 at maturity?
    return _amount;
  };

  /**
   * Calculates the collateralisation ratio 
   * ETH collat value and Dai debt value (in USD)
   *
   * @param {BigNumber} _collateralValue (wei/wad precision)
   * @param {BigNumber} _debtValue (wei/wad precision)
   * @returns {BigNumber} in Ray
   */
  const collRatio = (_collateralValue:BigNumber, _debtValue:BigNumber) => {
    if (_debtValue.eq(0) ) {
      // handle this case better
      return BigNumber.from(0);
    }
    console.log('colRatio in RAY :', utils.divRay(_collateralValue, _debtValue).toString());
    return utils.divRay(_collateralValue, _debtValue);
  };

  /**
   * Calculates the collateralisation percentage from a RAY ratio
   *
   * @param {BigNumber} _collateralizationRate(Ray precision)
   * @returns {BigNumber} percentage as a big number
   */
  const collPercent = ( _collateralizationRate:BigNumber ) => {
    console.log('collat %:', utils.mulRay(BigNumber.from('100'), _collateralizationRate).toString());
    return utils.mulRay(BigNumber.from('100'), _collateralizationRate);
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
  // TODO merge this in to the 'collateralization ratio function' above.
  const estCollRatio = (_collateralAmount:Number, _debtValue:Number) => {
    if (!_collateralAmount || _debtValue === 0 ) {
      // TODO handle this better
      return undefined;
    }
    const _colAmnt = ethers.utils.parseEther(_collateralAmount.toString());
    const _debtVal = ethers.utils.parseEther(_debtValue.toString());
    const _colVal = utils.mulRay(_colAmnt, collPrice());
    const _ratio = utils.divRay(_colVal, _debtVal);
    console.log( parseFloat(utils.mulRay(BigNumber.from('100'), _ratio).toString()) );
    return parseFloat(utils.mulRay(BigNumber.from('100'), _ratio).toString());
  };

  /**
   * Minimum amount of collateral required to stay above liquidation point
   *
   * @param {BigNumber} _debtValue (wei/wad precision)
   * @param {number} _liquidationRatio eg. 1.5
   * @param { BigNumber } _collateralPrice (in Ray precision)
   * @returns {BigNumber} (wad/wei precision)
   */
  const minSafeColl=(_debtValue:BigNumber, _liquidationRatio:number, _collateralPrice:BigNumber)=> {
    const _s = utils.divRay( utils.toRay(_liquidationRatio), _collateralPrice);
    const _msc = utils.mulRay(_debtValue, _s);
    console.log('minSafeColl:', ethers.utils.formatEther(_msc).toString());
    return _msc;
  };

  /**
   *  Calculates the liquidation price
   *
   * @param {BigNumber} _collateralAmount
   * @param {BigNumber} _debtValue
   * @param {number} _liquidationRatio eg. 150
   * @returns
   */
  const liquidationPrice = (
    _collateralAmount:BigNumber,
    _debtValue:BigNumber,
    _liquidationRatio:number
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
   * @param {BigNumber} _collateralValue in wei wad precision
   * @param {BigNumber} _debtValue in wei wad precision
   * @param {number} _liquidationRatio eg. 1.5
   * @returns {BigNumber} in wei/wad precision
   */
  const daiAvailable = (
    _collateralValue:BigNumber, 
    _debtValue:BigNumber, 
    _liquidationRatio:number
  ) =>{
    const maxSafeDebtValue = utils.divRay(_collateralValue, utils.toRay(_liquidationRatio));
    const _max = _debtValue.lt(maxSafeDebtValue) ? maxSafeDebtValue.sub(_debtValue) : BigNumber.from('0');
    console.log('max debt:', ethers.utils.formatEther(_max).toString());
    return _max;
  };

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
      return  ( parseFloat(ethers.utils.formatEther(_balance)) / parseFloat(ethers.utils.formatEther(_supply)))*100;
    }
    return 0;
  };

  /**
   * Split a certain amount of Dai liquidity into its eDai and Dai componetnts
   * 
   * @param {BigNumber} daiAmount // amount dai to split
   * @param { BigNumber } _daiReserves// Dai reserves
   * @param { BigNumber } _eDaiReserves// eDai reservers
   * 
   * @returns  [ BigNumber, BigNumber ] returns an array of [dai, eDai] 
   */
  const splitDaiLiquidity =(
    _daiAmount: BigNumber,
    _daiReserves: BigNumber,
    _eDaiReserves: BigNumber,
  )=> {
    const daiPortion = _daiAmount.mul(_daiReserves).div(_eDaiReserves.add(_daiReserves));
    const eDaiPortion = _daiAmount.sub(daiPortion);
    return [daiPortion, eDaiPortion];
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
  const yieldAPR =(
    _rate: BigNumber,
    _amount: BigNumber,
    _maturity:number,
    _fromDate:number= (Math.round(new Date().getTime() / 1000)), // if not provided, defaults to current time.
  )=> {

    if (
      _maturity > Math.round(new Date().getTime() / 1000)
    ) {
      const secsToMaturity = _maturity - _fromDate;
      const propOfYear = secsToMaturity/utils.SECONDS_PER_YEAR;
      const priceRatio = parseFloat(ethers.utils.formatEther(_amount)) / parseFloat(ethers.utils.formatEther(_rate));
      const powRatio = 1 / propOfYear;
      const apr = Math.pow(priceRatio, powRatio) - 1;
      console.log(apr*100);
      return apr*100;
    }
    return 0;
  };

  return {
    yieldAPR,
    poolPercent,
    splitDaiLiquidity,

    collValue,
    collPrice,
    debtValAdj,
    collRatio,
    collPercent,
    estCollRatio,
    minSafeColl,
    daiAvailable
  } as const;

};
