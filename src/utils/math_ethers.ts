/* eslint-disable @typescript-eslint/camelcase */
import { BigNumber } from 'ethers';

import { Decimal } from 'decimal.js';

// const math = create(bignumberDependencies, powDependencies);
// const { Decimal, pow, add, subtract, multiply, divide, floor } = math;
Decimal.set({ precision: 64 });
// const { add, sub, div, mul, pow, floor } = Decimal; 

const ZERO: Decimal = new Decimal(0);
const ONE: Decimal = new Decimal(1);
const TWO: Decimal = new Decimal(2);

const k = new Decimal(1 / (4 * 365 * 24 * 60 * 60)); // inv of seconds in 4 years
const fee = new Decimal(1000000000000);

// https://www.desmos.com/calculator/mllhtohxfx
export function mint(
  daiReserves:BigNumber, 
  fyDaiReserves: BigNumber, 
  supply: BigNumber, 
  dai: BigNumber
) : [any, any] {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const supply_ = new Decimal(supply.toString());
  const dai_ = new Decimal(dai.toString());

  const m = (supply_.mul(dai_)).div(daiReserves_);
  const y = (fyDaiReserves_.mul(m)).div(supply_);

  return [m, y];
}

// https://www.desmos.com/calculator/ubsalzunpo
export function burn(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  supply: BigNumber, 
  lpTokens: BigNumber
): [any, any] {
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const supply_ = new Decimal(supply.toString());
  const lpTokens_ = new Decimal(lpTokens.toString());

  const z = (lpTokens_.mul(daiReserves_ )).div(supply_);
  const y = (lpTokens_.mul(fyDaiReserves_)).div(supply_);
  return [z, y];
}

// https://www.desmos.com/calculator/5nf2xuy6yb
export function sellDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  dai: BigNumber, 
  timeTillMaturity: BigNumber
): any {
  
  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const dai_ = new Decimal(dai.toString());
 
  const g = new Decimal(950 / 1000);
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Zxa = (daiReserves_.add(dai_)).pow(a);
  const sum = (Za.add(Ya)).sub(Zxa);
  const y = fyDaiReserves_.sub( sum.pow(invA) ) ; 
  const yFee = y.sub(fee);

  return yFee;
}

// https://www.desmos.com/calculator/6jlrre7ybt
export function sellFYDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  fyDai: BigNumber, 
  timeTillMaturity: BigNumber
): any {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyDai.toString());

  const g = new Decimal(1000 / 950);
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Yxa = (fyDaiReserves_.add(fyDai_)).pow(a);
  const sum = Za.add(Ya.sub(Yxa));
  const y = daiReserves_.sub(sum.pow(invA));
  const yFee = y.sub(fee);

  return yFee;
}

// https://www.desmos.com/calculator/0rgnmtckvy
export function buyDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  dai: BigNumber, 
  timeTillMaturity: BigNumber
): any {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const dai_ = new Decimal(dai.toString());

  const g = new Decimal(1000/ 950);
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Zxa = (daiReserves_.sub(dai_)).pow(a);
  const sum = (Za.add(Ya)).sub(Zxa);
  const y = (sum.pow(invA)).sub(fyDaiReserves_);
  const yFee = y.add(fee);

  return yFee;
}

// https://www.desmos.com/calculator/ws5oqj8x5i
export function buyFYDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  fyDai: BigNumber, 
  timeTillMaturity: BigNumber
): any {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiReserves_ = new Decimal(fyDaiReserves.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());
  const fyDai_ = new Decimal(fyDai.toString());

  const g = new Decimal(950 / 1000);
  const t = k.mul(timeTillMaturity_);
  const a = ONE.sub( g.mul(t));
  const invA = ONE.div(a);

  const Za = daiReserves_.pow(a);
  const Ya = fyDaiReserves_.pow(a);
  const Yxa = (fyDaiReserves_.sub(fyDai_)).pow(a);
  const sum = Za.add( Ya.sub(Yxa));
  const y = (sum.pow(invA) ).sub(daiReserves_);
  const yFee = y.add(fee);

  return yFee;
}

export function fyDaiForMint(
  daiReserves: BigNumber,
  fyDaiRealReserves: BigNumber,
  fyDaiVirtualReserves: BigNumber,
  dai: BigNumber,
  timeTillMaturity: BigNumber,
): any {

  const daiReserves_ = new Decimal(daiReserves.toString());
  const fyDaiRealReserves_ = new Decimal(fyDaiRealReserves.toString());
  const fyDaiVirtualReserves_ = new Decimal(fyDaiVirtualReserves.toString());
  const dai_ = new Decimal(dai.toString());
  const timeTillMaturity_ = new Decimal(timeTillMaturity.toString());

  let min = ZERO;
  let max = dai_;
  let y_out = (min.add(max)).div(TWO);

  let i = 0;
  while (true) {
    const z_in = new Decimal( buyFYDai(daiReserves, fyDaiVirtualReserves, BigNumber.from( BigInt(y_out)), timeTillMaturity) );

    const Z_1 = daiReserves_.add(z_in); // New dai reserves
    const Y_1 = fyDaiRealReserves_.sub(y_out); // New fyDai reserves
    const pz = (dai_.sub(z_in)).div( (dai_.sub(z_in)).add(y_out) ); // dai proportion in my assets
    const PZ = Z_1.div(Z_1.add(Y_1)); // dai proportion in the reserves

    // The dai proportion in my assets needs to be higher than but very close to the dai proportion in the reserves, to make sure all the fyDai is used.
    if ( PZ.mul(new Decimal(1.000001)) <= pz ) min = y_out;
    y_out = (y_out.add(max)).div(TWO); // bought too little fyDai, buy some more
    if (pz <= PZ) max = y_out;
    y_out = (y_out.add(min)).div(TWO); // bought too much fyDai, buy a bit less
    // console.log(`y = ${floor(y_out).toFixed()}\n`)

    if ( PZ.mul(new Decimal(1.000001)) > pz && pz > PZ) return Decimal.floor(y_out).toFixed(); // Just right
    // eslint-disable-next-line no-plusplus
    if (i++ > 10000) return Decimal.floor(y_out).toFixed();
  }
}

/**
   * Calculates the collateralization ratio 
   * ETH collat value and Dai debt value (in USD)
   *
   * @param {BigNumber} _collateralValue (wei/wad precision)
   * @param {BigNumber} _debtValue (wei/wad precision)
   * @returns {BigNumber} in Ray
   */
export const collRatio = ( _collateralValue:BigNumber, _debtValue:BigNumber ) => {
  if (_debtValue.eq(0) ) {
    // handle this case better
    return BigNumber.from(0);
  }
  return divP64(_collateralValue, _debtValue);
};


