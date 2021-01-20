import { ethers, BigNumber, BigNumberish } from 'ethers';
import { Decimal } from 'decimal.js';

Decimal.set({ precision: 64 });

const ZERO: Decimal = new Decimal(0);
const ONE: Decimal = new Decimal(1);
const TWO: Decimal = new Decimal(2);
const SECONDS_PER_YEAR: number = (4 * 365 * 24 * 60 * 60);

const k = new Decimal(1 / SECONDS_PER_YEAR); // inv of seconds in 4 years
const g1 = new Decimal(950 / 1000);
const g2 = new Decimal(1000 / 950);
// const fee = new Decimal(1000000000000);

// https://www.desmos.com/calculator/mllhtohxfx
export function mint(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  supply: BigNumber | string, 
  dai: BigNumber | string
) : [any, any] {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const supply_ = new Decimal(supply.toString());
  const dai_ = new Decimal(dai.toString());

  const m = (supply_.mul(dai_)).div(daiReserves_);
  const y = (fyDaiReserves_.mul(m)).div(supply_);

  return [ m, y ];
}

// https://www.desmos.com/calculator/ubsalzunpo
export function burn(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  supply: BigNumber | string, 
  lpTokens: BigNumber | string
): [any, any] {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const supply_ = new Decimal(supply.toString());
  const lpTokens_ = new Decimal(lpTokens.toString());

  const z = (lpTokens_.mul(daiReserves_ )).div(supply_);
  const y = (lpTokens_.mul(fyDaiReserves_)).div(supply_);

  return [ z, y ];
}

// https://www.desmos.com/calculator/5nf2xuy6yb
export function sellDai(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  dai: BigNumber | string, 
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false
): any {
  
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const dai_ = new Decimal(dai.toString());
 
  const g = withNoFee? ONE : g1;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Zxa = (daiReserves_.add(dai_)).pow(a);
  const sum = (Za.add(Ya)).sub(Zxa);
  const y = fyDaiReserves_.sub( sum.pow(invA) ) ; 
  // const yFee = y.sub(fee);

  return y.toString();
}

// https://www.desmos.com/calculator/6jlrre7ybt
export function sellFYDai(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  fyDai: BigNumber | string, 
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false
): any {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyDai.toString());

  const g = withNoFee? ONE : g2;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Yxa = (fyDaiReserves_.add(fyDai_)).pow(a);
  const sum = Za.add(Ya.sub(Yxa));
  const y = daiReserves_.sub(sum.pow(invA));
  // const yFee = y.sub(fee);

  return y.toString();
}

// https://www.desmos.com/calculator/0rgnmtckvy
export function buyDai(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  dai: BigNumber | string, 
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false
): any {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const dai_ = new Decimal(dai.toString());

  const g = withNoFee? ONE : g2;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Zxa = (daiReserves_.sub(dai_)).pow(a);
  const sum = (Za.add(Ya)).sub(Zxa);
  const y = (sum.pow(invA)).sub(fyDaiReserves_);
  // const yFee = y.add(fee);

  return y.toString();
}

// https://www.desmos.com/calculator/ws5oqj8x5i
export function buyFYDai(
  daiReserves: BigNumber | string, 
  fyDaiReserves: BigNumber | string, 
  fyDai: BigNumber | string,
  timeTillMaturity: BigNumber | string,
  withNoFee: boolean = false
): string {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyDai.toString());

  const g = withNoFee? ONE : g1;
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Yxa = (fyDaiReserves_.sub(fyDai_)).pow(a);
  const sum = Za.add( Ya.sub(Yxa));
  const y = (sum.pow(invA) ).sub(daiReserves_);
  // const yFee = y.add(fee);

  return y.toString();
}

export function getFee(
  fyDaiReserves: BigNumber | string, 
  daiReserves: BigNumber | string, 
  timeTillMaturity: BigNumber | string,
  fyDai: BigNumber | string
): string {
  let fee_: Decimal = ZERO;
  const fyDai_: BigNumber =  BigNumber.isBigNumber(fyDai) ? fyDai : BigNumber.from(fyDai);

  if (fyDai_.gte(ethers.constants.Zero)) {
    const daiWithFee: string = buyFYDai(fyDaiReserves, daiReserves, timeTillMaturity, fyDai);
    const daiWithoutFee: string = buyFYDai(fyDaiReserves, daiReserves, timeTillMaturity, fyDai, true);
    fee_ = (new Decimal(daiWithFee)).sub(new Decimal(daiWithoutFee)); 

  } else {
    const daiWithFee:string = sellFYDai(fyDaiReserves, daiReserves, timeTillMaturity, fyDai_.mul(BigNumber.from('-1')) );
    const daiWithoutFee:string = sellFYDai(fyDaiReserves, daiReserves, timeTillMaturity, fyDai_.mul(BigNumber.from('-1')), true);
    fee_ = (new Decimal(daiWithoutFee)).sub(new Decimal(daiWithFee));
  }
  return fee_.toString();
}

export function fyDaiForMint(
  daiReserves: BigNumber,
  fyDaiRealReserves: BigNumber,
  fyDaiVirtualReserves: BigNumber,
  dai: BigNumber,
  timeTillMaturity: BigNumber,
): string {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiRealReserves_ = new Decimal(fyDaiRealReserves.toString());
  const dai_ = new Decimal(dai.toString());

  let min = ZERO;
  let max = dai_;
  let yOut = Decimal.floor( (min.add(max)).div(TWO) ); 

  let i = 0;
  while ( true ) {
    const zIn = new Decimal( buyFYDai(daiReserves, fyDaiVirtualReserves, BigNumber.from(yOut.toFixed(0)), timeTillMaturity) );
    const Z_1 = daiReserves_.add(zIn); // New dai reserves
    const Y_1 = fyDaiRealReserves_.sub(yOut); // New fyDai reserves
    const pz = (dai_.sub(zIn)).div( (dai_.sub(zIn)).add(yOut) ); // dai proportion in my assets
    const PZ = Z_1.div(Z_1.add(Y_1)); // dai proportion in the reserves

    // The dai proportion in my assets needs to be higher than but very close to the dai proportion in the reserves, to make sure all the fyDai is used.
    if ( PZ.mul(new Decimal(1.000001)) <= pz ) min = yOut;
    yOut = (yOut.add(max)).div(TWO); // bought too little fyDai, buy some more
    if (pz <= PZ) max = yOut;
    yOut = (yOut.add(min)).div(TWO); // bought too much fyDai, buy a bit less
    // console.log(`y = ${floor(y_out).toFixed()}\n`)

    if ( PZ.mul(new Decimal(1.000001)) > pz && pz > PZ) return Decimal.floor(yOut).toFixed(); // Just right
    // eslint-disable-next-line no-plusplus
    if (i++ > 10000) return Decimal.floor(yOut).toFixed();
  }
}

/**
   * Split a certain amount of Dai liquidity into its fyDai and Dai componetnts
   * 
   * @param { BigNumber } xReserves// Dai reserves
   * @param { BigNumber } yReserves// fyDai reservers
   * @param {BigNumber} xAmount // amount dai to split
   * 
   * @returns  [ BigNumber, BigNumber ] returns an array of [dai, fyDai] 
   */
export const splitLiquidity =(
  xReserves: BigNumber,
  yReserves: BigNumber,
  xAmount: BigNumber,
)=> {
  const xPortion = xAmount.mul(yReserves).div(yReserves.add(xReserves));
  const yPortion = xAmount.sub(xPortion);
  return [xPortion, yPortion];
};

/**
   * Calculate amount of LP Tokens that will be minted  
   *
   * @param { BigNumber } xReserves // eg. dai balance of pool
   * @param { BigNumber } yReserves// eg. yDai series balance of Pool
   * @param { BigNumber } totalSupply // total LP tokens
   * @param { BigNumber } xInput // dai input value by user
   * 
   * @returns { BigNumber } number of tokens minted
   */
export const calcTokensMinted =(
  xReserves: BigNumber,
  yReserves: BigNumber,
  totalSupply: BigNumber,
  xInput: BigNumber,
) => {
  const daiOffered = (xInput.mul(xReserves)).div(yReserves.add(xReserves) );
  return (totalSupply).mul(daiOffered).div(xReserves);
};

/**
   * Calculate Annualised Yield Rate
   *
   * @param { BigNumber } _rate // current [Dai] price per unit y[Dai]
   * @param { BigNumber } _amount // y[Dai] amount at maturity
   * @param { number } _maturity  // date of maturity
   * @param { number } _fromDate // ***optional*** start date - defaults to now()
   * 
   * @returns { string | undefined } human readable string
   */
export const calculateAPR =(
  _rate: BigNumber,
  _amount: BigNumber,
  _maturity:number,
  _fromDate:number = (Math.round(new Date().getTime() / 1000)), // if not provided, defaults to current time.
): string | undefined => {
  const rate_ = new Decimal(_rate.toString());
  const amount_ = new Decimal(_amount.toString());
  if (
    _maturity > Math.round(new Date().getTime() / 1000)
  ) {
    const secsToMaturity = _maturity - _fromDate;
    const propOfYear = new Decimal(secsToMaturity/SECONDS_PER_YEAR);
    const priceRatio = amount_.div(rate_);
    const powRatio = ONE.div(propOfYear);
    const apr = (priceRatio.pow(powRatio)).sub(ONE);
    if(apr.gt(ZERO) && apr.lt(100)) {
      return apr.mul(100).toFixed();
    }
    return undefined;
  }
  return undefined;
};


/**
   * Calculates the collateralization ratio 
   * based on the collat amount and value and debt value.
   *
   * @param { BigNumber | string } collateralAmount  amount of collateral ( in wei)
   * @param { BigNumber | string } collateralPrice price of collateral (in USD)
   * @param { BigNumber | string } debtValue value of dai debt (in USD)
  
   * @returns { string | undefined }
   */
export const collateralizationRatio = ( 
  collateralAmount: BigNumber | string, 
  collateralPrice: BigNumber | string, 
  debtValue: BigNumber | string, 
  asPercent: boolean = false // Optional flag to return as percentage
): string | undefined => {
  if (
    ethers.BigNumber.isBigNumber(debtValue) ? debtValue.isZero(): debtValue == '0' 
  ) {
    return undefined;
  }
  const _colVal = mulDecimal(collateralAmount, collateralPrice); 
  const _ratio = divDecimal(_colVal, debtValue);

  if ( asPercent ) {
    return mulDecimal('100', _ratio);
  }
  return _ratio;
};


/**
   * Calcualtes the amount (Dai, or other variant) that can be borrowed based on 
   * an amount of collateral (ETH, or other), and collateral price.
   *
   * @param {BigNumber | string} collateralAmount amount of collateral
   * @param {BigNumber | string} collateralPrice price of unit collateral (in currency x)
   * @param {BigNumber | string} debtValue value of debt (in currency x)
   * @param {BigNumber | string} liquidationRatio eg. 1.5 for 150%
   * 
   * @returns {string}
   */
export const borrowingPower = (
  collateralAmount: BigNumber | string,
  collateralPrice: BigNumber | string,
  debtValue:BigNumber | string,
  liquidationRatio: BigNumber | string = '1.5' // Optional: 150% as default
): string => {
  const collateralValue = mulDecimal(collateralAmount, collateralPrice );
  const maxSafeDebtValue_ = new Decimal(divDecimal(collateralValue, liquidationRatio));
  const debtValue_ = new Decimal(debtValue.toString());
  const _max = debtValue_.lt(maxSafeDebtValue_) ? maxSafeDebtValue_.sub(debtValue_) : new Decimal('0');
  return _max.toFixed(0);
};

// /**
//    * Percentage holding of the Pool 
//    *
//    * @param { BigNumber } supply  // token supply 
//    * @param { BigNumber } balance // token holdings
//    * 
//    * @returns { string } human readable string as a percent.
//    */
// export const calcPoolPercent =(
//   supply: BigNumber,
//   balance: BigNumber,
// ): string => {
//   if (!supply.isZero()) {
//     const supply_ = new Decimal(supply.toString());
//     const balance_ = new Decimal(balance.toString());
//     return ( (balance_.div(supply_)).mul(100) ).toFixed(4); 
//   } 
//   return '0';
// };

export const mulDecimal = (multiplicant:BigNumber | string, multiplier:BigNumber | string): string => {
  const multiplicant_ = new Decimal(multiplicant.toString());
  const multiplier_ = new Decimal(multiplier.toString());
  return multiplicant_.mul(multiplier_).toFixed();
};

export const divDecimal = (numerator:BigNumber | string, divisor:BigNumber | string): string => {
  const numerator_ = new Decimal(numerator.toString());
  const divisor_ = new Decimal(divisor.toString());
  return numerator_.div(divisor_).toFixed();
};
