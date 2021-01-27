import { useContext } from 'react';
import { BigNumber }  from 'ethers';

import { YieldContext } from '../contexts/YieldContext';

import { 
  mulDecimal, 
  collateralizationRatio, 
  borrowingPower, 
  calculateAPR as calcAPR,
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
  ): number => {
    // Get the rate etc for Dai 
    const res = calcAPR(rate, amount, maturity, fromDate );
    const resFloat = res && parseFloat(res);
    return resFloat || 0;
  };

  return {
    calculateAPR,
    estCollateralValue,
    estCollateralRatio,
    estBorrowingPower,
  } as const;

};
