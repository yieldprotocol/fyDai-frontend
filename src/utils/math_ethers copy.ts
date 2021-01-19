/* eslint-disable @typescript-eslint/camelcase */
import { BigNumber } from 'ethers';

import { Decimal } from 'decimal.js';

const { add, sub, div, mul, pow, floor } = Decimal; 

const ZERO: Decimal = new Decimal(0);
const ONE: Decimal = new Decimal(1);
const TWO: Decimal = new Decimal(2);


// / @dev Divides a number in any precision by a number in RAY precision, with the output in the first parameter's precision.
// / I.e. divRay(wad(x), ray(y)) = wad(x/y)

const SECONDS_IN_4_YEARS: number = (4 * 365 * 24 * 60 * 60);
const INV_SECONDS_4_YEARS: Decimal = ONE.div(SECONDS_IN_4_YEARS); 

// https://www.desmos.com/calculator/mllhtohxfx
export function mint(
  daiReserves: BigNumber,
  fyDaiReserves: BigNumber,
  supply: BigNumber,
  dai: BigNumber
): [BigNumber, BigNumber] {

  const daiReserves_ = Decimal(daiReserves.toString());
  const fyDaiReserves_ = bignumber(fyDaiReserves.toString());
  const supply_ = bignumber(supply.toString());
  const dai_ = bignumber(dai.toString());
  
  const m = ( supply.mul(dai) ).div(daiReserves) ;
  const y = div_f64( fyDaiReserves.mul(m), supply ); 

  return [m, y];
}

// https://www.desmos.com/calculator/ubsalzunpo
export function burn(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  supply: BigNumber, 
  lpTokens: BigNumber
): [BigNumber, BigNumber] {

  const z =  divP64(lpTokens.mul(daiReserves), supply);
  const y =  divP64(lpTokens.mul(fyDaiReserves), supply);

  return [z, y];
}

// https://www.desmos.com/calculator/5nf2xuy6yb
export function sellDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  dai: BigNumber,
  timeTillMaturity: BigNumber
): BigNumber {
  const fee = BigNumber.from(1000000000000); // bignumber(1000000000000);
  const T = timeTillMaturity; // bignumber(timeTillMaturity);
  const x = dai; // bignumber(dai);
  const k = INV_SECONDS_4_YEARS; // bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years
  const g = BigNumber.from('950000000000000000'); // bignumber(950 / 1000);  //TODO check this
  const t =  k.mul(T); // multiply(k, T);
  const a =  ONE.sub( g.mul(t)); // subtract(1, multiply(g, t));
  const invA = divP64( ONE, a); // divide(1, a);
  const Za = daiReserves.pow(a); // pow(Z, a);
  const Ya = fyDaiReserves.pow(a); // pow(Y, a);
  const Zxa = (daiReserves.add(x)).pow(a); // pow(add(Z, x), a);
  const sum = (Za.add(Ya)).sub(Zxa); // subtract(add(Za, Ya), Zxa);
  const y =  fyDaiReserves.sub( sum.pow(invA)); // subtract(Y, pow(sum, invA));
  const yFee = y.sub(fee); // subtract(y, fee);

  return yFee;
}

// https://www.desmos.com/calculator/6jlrre7ybt
export function sellFYDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  fyDai: BigNumber, 
  timeTillMaturity: BigNumber
): any {
  const fee = BigNumber.from(1000000000000); // bignumber(1000000000000);
  const Z = daiReserves; // bignumber(daiReserves);
  const Y = fyDaiReserves; // bignumber(fyDaiReserves);
  const T = timeTillMaturity; // bignumber(timeTillMaturity);
  const x = fyDai; // bignumber(fyDai);
  const k = INV_SECONDS_4_YEARS; // bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years //TODO CHECK
  const g = BigNumber.from('1100000000000000000'); // bignumber(1000 / 950); //TODO CHECK 
  const t = k.mul(T); // multiply(k, T);
  const a = ONE.sub( g.mul(t)); // subtract(1, multiply(g, t));
  const invA = divP64( ONE, a); // divide(1, a);
  const Za = Z.pow(a); // pow(Z, a);
  const Ya = Y.pow(a); // pow(Y, a);
  const Yxa = (Y.add(x)).pow(a); // pow(add(Y, x), a);
  const sum = Za.add( (Ya.sub(Yxa)) ) ; // add(Za, subtract(Ya, Yxa));
  const y = Z.sub( sum.pow(invA)); // subtract(Z, pow(sum, invA));
  const yFee = y.sub(fee); // subtract(y, fee);

  return yFee;
}

// https://www.desmos.com/calculator/0rgnmtckvy
export function buyDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  dai: BigNumber, 
  timeTillMaturity: BigNumber 
): any {
  const fee = BigNumber.from(1000000000000); // bignumber(1000000000000);
  const Z = daiReserves; // bignumber(daiReserves);
  const Y = fyDaiReserves; // bignumber(fyDaiReserves);
  const T = timeTillMaturity; // bignumber(timeTillMaturity);
  const x = dai; // bignumber(dai);
  const k = INV_SECONDS_4_YEARS; // bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years //TODO CHECK
  const g = BigNumber.from('1100000000000000000'); // bignumber(1000 / 950); //TODO CHECK 
  const t = k.mul(T); // multiply(k, T);
  const a = ONE.sub(g.mul(t)); // subtract(1, multiply(g, t));
  const invA = divP64( ONE, a); // divide(1, a);
  const Za = Z.pow(a); // pow(Z, a);
  const Ya = Y.pow(a); // pow(Y, a);
  const Zxa = (Z.sub(x)).pow(a); // pow(subtract(Z, x), a);
  const sum = (Za.add(Ya)).sub(Zxa); // subtract(add(Za, Ya), Zxa);
  const y = (sum.pow(invA)).sub(Y); // subtract(pow(sum, invA), Y);
  const yFee = y.add(fee); // add(y, fee);

  return yFee;
}

// https://www.desmos.com/calculator/ws5oqj8x5i
export function buyFYDai(
  daiReserves: BigNumber, 
  fyDaiReserves: BigNumber, 
  fyDai: BigNumber, 
  timeTillMaturity: BigNumber
): any {
  const fee = BigNumber.from(1000000000000); // bignumber(1000000000000);
  const Z = daiReserves; // bignumber(daiReserves);
  const Y = fyDaiReserves; // bignumber(fyDaiReserves);
  const T = timeTillMaturity; // bignumber(timeTillMaturity);
  const x = fyDai; // bignumber(fyDai);
  const k = INV_SECONDS_4_YEARS; // bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years
  const g = BigNumber.from('950000000000000000'); // bignumber(950 / 1000);
  const t = k.mul(T); // multiply(k, T);
  const a = ONE.sub( g.mul(t)); // subtract(1, multiply(g, t));
  const invA = divP64( ONE, a); // divide(1, a);
  const Za = Z.pow(a); // pow(Z, a);
  const Ya = Y.pow(a); // pow(Y, a);
  const Yxa = (Y.sub(x)).pow(a); // pow(subtract(Y, x), a);
  const sum =  Za.add(Ya.sub(Yxa)); // add(Za, subtract(Ya, Yxa));
  const y = (sum.pow(invA)).sub(Z); // subtract(pow(sum, invA), Z);
  const yFee = y.add(fee); // add(y, fee);

  return yFee;
}

export function fyDaiForMint(
  daiReserves: BigNumber,
  fyDaiRealReserves: BigNumber,
  fyDaiVirtualReserves: BigNumber,
  dai: BigNumber,
  timeTillMaturity: BigNumber
): BigNumber {
  const Z = daiReserves; // bignumber(daiReserves);
  const YR = fyDaiRealReserves; // bignumber(fyDaiRealReserves);
  const YV = fyDaiVirtualReserves; // bignumber(fyDaiVirtualReserves);
  const z = dai; // bignumber(dai);
  const t = timeTillMaturity; // bignumber(timeTillMaturity);

  let min = ZERO;
  let max = z;
  let y_out = divP64(min.add(max), TWO); // divide(add(min, max), bignumber(2)); // average

  let i = 0;
  while (true) {
    const z_in =  buyFYDai(Z, YV, y_out, t); // bignumber(buyFYDai(Z, YV, y_out, t));
    const Z_1 =  Z.add(z_in); // add(Z, z_in); // New dai reserves
    const Y_1 = YR.sub(y_out); // subtract(YR, y_out); // New fyDai reserves

    const pz =  divP64(z.sub(z_in), (z.sub(z_in)).add(y_out) ) ; // divide(subtract(z, z_in), add(subtract(z, z_in), y_out)); // dai proportion in my assets
    const PZ =  divP64(Z_1, Z_1.add(Y_1)); // divide(Z_1, add(Z_1, Y_1)); // dai proportion in the reserves
    // console.log(`i = ${i}`)
    // console.log(`pz = ${pz}`)
    // console.log(`PZ = ${PZ}`)

    // The dai proportion in my assets needs to be higher than but very close to the dai proportion in the reserves, to make sure all the fyDai is used.
    
    if ( (PZ.mul(BigNumber.from('1.000001'))).lte(pz) ) min = y_out; // if (multiply(PZ, bignumber(1.000001)) <= pz) min = y_out;
    y_out = divP64( y_out.add(max), TWO); // divide(add(y_out, max), bignumber(2)); // bought too little fyDai, buy some more

    if (pz.lte(PZ)) max = y_out; // if (pz <= PZ) max = y_out;
    y_out = (y_out.add(min)).div(TWO); // y_out = divide(add(y_out, min), bignumber(2)); // bought too much fyDai, buy a bit less
    // console.log(`y = ${floor(y_out).toFixed()}\n`)

    // if (multiply(PZ, bignumber(1.000001)) > pz && pz > PZ) return floor(y_out).toFixed(); // Just right
    if ( (PZ.mul(BigNumber.from('1.000001'))).gt(pz) && pz.gt(PZ) ) return y_out.div(ONE);
 
    // eslint-disable-next-line no-plusplus
    if (i++ > 10000) return y_out.div(ONE); // if (i++ > 10000) return floor(y_out).toFixed();

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


