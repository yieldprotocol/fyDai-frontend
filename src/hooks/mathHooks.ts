import { useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';
import { 
  divDecimal, 
  mulDecimal, 
  collateralizationRatio, 
  borrowingPower, 
  calculateAPR as calcAPR, 
  floorDecimal 
} from '../utils/yieldMath';

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
  const  { state: { preferences: { slippage } } }  = useContext(UserContext);

  /**
   * Calculates the total value of collateral at the current unit price
   * @returns { string } USD value (in wad/wei precision)
   */
  const estCollateralValue = (collateralAmount:BigNumber | string): string => {
    return mulDecimal(collateralAmount, feedData.ethPrice );
  };

  /**
   * Calculates the collateralization ratio 
   * ETH collat value, price and DAI debt value (in USD)
   *
   * @param {BigNumber | string } collateralAmount  amount of collateral (eg. 10ETH)
   * @param {BigNumber | string } debtValue value of dai debt (in USD)
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


  const calculateSlippage = (value:BigNumber, minimise:boolean=false ) => {
    const slippageAmount = floorDecimal( mulDecimal(value, slippage));
    if (minimise) {
      return value.sub(slippageAmount);
    } 
    return value.add(slippageAmount);
  };


  // /**
  //  * Split a certain amount of Dai liquidity into its fyDai and Dai componetnts
  //  * 
  //  * @param {BigNumber} daiAmount // amount dai to split
  //  * @param { BigNumber } _daiReserves// Dai reserves
  //  * @param { BigNumber } _fyDaiReserves// fyDai reservers
  //  * 
  //  * @returns  [ BigNumber, BigNumber ] returns an array of [dai, fyDai] 
  //  */
  // const splitDaiLiquidity =(
  //   _daiAmount: BigNumber,
  //   _daiReserves: BigNumber,
  //   _fyDaiReserves: BigNumber,
  // )=> {
  //   const daiPortion = _daiAmount.mul(_daiReserves).div(_fyDaiReserves.add(_daiReserves));
  //   const fyDaiPortion = _daiAmount.sub(daiPortion);
  //   return [ daiPortion, fyDaiPortion ];
  // };

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
    rate: BigNumber,
    amount: BigNumber,
    maturity:number,
    fromDate:number = (Math.round(new Date().getTime() / 1000)), // if not provided, defaults to current time.
  ): string => {
    // Get the rate etc for Dai 
    return calcAPR(rate, amount, maturity, fromDate ) || '0';
  };

  return {
    calculateAPR,
    calculateSlippage,
    estCollateralValue,
    estCollateralRatio,
    estBorrowingPower,
  } as const;

};
