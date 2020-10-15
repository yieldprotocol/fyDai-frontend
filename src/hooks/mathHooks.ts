import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext';

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
    return utils.mulRay(utils.toRay(1.5), (ilks.spot));
  };

  /**
   * Calculates the total value of collateral at the current unit price
   * @returns {BigNumber} USD value (in wad/wei precision)
   */
  const collValue = (collateralPosted:BigNumber): BigNumber => {
    // console.log('Collateral Value USD:', ethers.utils.formatEther( utils.mulRay(collateralPosted, collPrice()) ) );
    return utils.mulRay(collateralPosted, feedData.ethPrice);
  };

  /**
   * Calculates value of debt (fyDaiDebt at maturity or Dai) at current Dai price
   * the rate used is the rate and spot price of Dai.
   * @param {BigNumber} _amount fyDai amount (= amount of Dai at maturity)
   * @returns 
   */
  const debtValAdj = (_amount:BigNumber ) => {
    // this would require a DAI/USD (ratio fluctuations? ) but maybe just assume it will be 1 at maturity?
    return _amount;
  };

  /**
   * Calculates the collateralization ratio 
   * ETH collat value and Dai debt value (in USD)
   *
   * @param {BigNumber} _collateralValue (wei/wad precision)
   * @param {BigNumber} _debtValue (wei/wad precision)
   * @returns {BigNumber} in Ray
   */
  const collRatio = ( _collateralValue:BigNumber, _debtValue:BigNumber ) => {
    if (_debtValue.eq(0) ) {
      // handle this case better
      return BigNumber.from(0);
    }
    return utils.divRay(_collateralValue, _debtValue);
  };

  /**
   * Calculates the collateralization percentage from a RAY ratio
   *
   * @param {BigNumber} _collateralizationRate(Ray precision)
   * @returns {BigNumber} percentage as a big number
   */
  const collPercent = ( _collateralizationRate:BigNumber ) => {
    return utils.mulRay(BigNumber.from('100'), _collateralizationRate);
  };

  /**
   * Calculates an ESTIMATE of the collateralization ratio 
   * ETH collat value and DAI debt value (in USD) using 
   * normal numbers
   *
   * @param {BigNumber} _collateralAmount  amount of collateral (eg. 10ETH)
   * @param {BigNumber} _debtValue value of dai debt (in USD)
   * @returns {BigNumber} 
   */
  // TODO merge this in to the 'collateralization ratio function' above.
  const estCollRatio = (_collateralAmount:BigNumber, _debtValue:BigNumber) => {
    if (!_collateralAmount || _debtValue.isZero() ) {
      return undefined;
    }
    const _colVal = utils.mulRay(_collateralAmount, collPrice());
    const _ratio = utils.divRay(_colVal, _debtValue);
    return utils.mulRay(BigNumber.from('100'), _ratio).toString();
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
    _fromDate:number= (Math.round(new Date().getTime() / 1000)), // if not provided, defaults to current time.
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
    liquidationPrice,
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
