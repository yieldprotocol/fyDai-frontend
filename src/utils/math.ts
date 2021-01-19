/* eslint-disable @typescript-eslint/camelcase */
import { BigNumber } from 'ethers';

import {
  create,
  bignumberDependencies,
  powDependencies, 
} from 'mathjs';

const { bignumber, add, subtract, multiply, divide, pow, floor }  = require('mathjs');
// const { bignumber, pow, add, subtract, multiply, divide, floor } = create(bignumberDependencies, powDependencies);

// create(
//   BigNumberDependencies, 
//   addDependencies, 
//   subtractDependencies,
//   multiplyDependencies,
//   divideDependencies, 
//   powDependencies, 
//   floorDependencies
//   );

// const { pow } = create(powDependencies); 

// https://www.desmos.com/calculator/mllhtohxfx
export function mint(daiReserves: any, fyDaiReserves: any, supply: any, dai: any): [any, any] {
  const Z = bignumber(daiReserves);
  const Y = bignumber(fyDaiReserves);
  const S = bignumber(supply);
  const z = bignumber(dai);
  const m = divide(multiply(S, z), Z);
  const y = divide(multiply(Y, m), S);

  return [m, y];
}

// https://www.desmos.com/calculator/ubsalzunpo
export function burn(daiReserves: any, fyDaiReserves: any, supply: any, lpTokens: any): [any, any] {
  const Z = bignumber(daiReserves);
  const Y = bignumber(fyDaiReserves);
  const S = bignumber(supply);
  const x = bignumber(lpTokens);
  const z = divide(multiply(x, Z), S);
  const y = divide(multiply(x, Y), S);

  return [z, y];
}

// https://www.desmos.com/calculator/5nf2xuy6yb
export function sellDai(daiReserves: any, fyDaiReserves: any, dai: any, timeTillMaturity: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiReserves);
  const Y = bignumber(fyDaiReserves);
  const T = bignumber(timeTillMaturity);
  
  const x = bignumber(dai);
  const k = bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years
  const g = bignumber(950 / 1000);

  console.log(k.toString());
  console.log(g.toString());

  const t = multiply(k, T);
  const a = subtract(1, multiply(g, t));
  const invA = divide(1, a);
  const Za = pow(Z, a);
  const Ya = pow(Y, a);
  const Zxa = pow(add(Z, x), a);
  const sum = subtract(add(Za, Ya), Zxa);
  const y = subtract(Y, pow(sum, invA));
  const yFee = subtract(y, fee);

  return yFee;
}

// https://www.desmos.com/calculator/6jlrre7ybt
export function sellFYDai(daiReserves: any, fyDaiReserves: any, fyDai: any, timeTillMaturity: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiReserves);
  const Y = bignumber(fyDaiReserves);
  const T = bignumber(timeTillMaturity);
  const x = bignumber(fyDai);
  const k = bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years
  const g = bignumber(1000 / 950);
  const t = multiply(k, T);
  const a = subtract(1, multiply(g, t));
  const invA = divide(1, a);
  const Za = pow(Z, a);
  const Ya = pow(Y, a);
  const Yxa = pow(add(Y, x), a);
  const sum = add(Za, subtract(Ya, Yxa));
  const y = subtract(Z, pow(sum, invA));
  const yFee = subtract(y, fee);

  return yFee;
}

// https://www.desmos.com/calculator/0rgnmtckvy
export function buyDai(daiReserves: any, fyDaiReserves: any, dai: any, timeTillMaturity: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiReserves);
  const Y = bignumber(fyDaiReserves);
  const T = bignumber(timeTillMaturity);
  const x = bignumber(dai);
  const k = bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years
  const g = bignumber(1000 / 950);
  const t = multiply(k, T);
  const a = subtract(1, multiply(g, t));
  const invA = divide(1, a);
  const Za = pow(Z, a);
  const Ya = pow(Y, a);
  const Zxa = pow(subtract(Z, x), a);
  const sum = subtract(add(Za, Ya), Zxa);
  const y = subtract(pow(sum, invA), Y);
  const yFee = add(y, fee);

  return yFee;
}

// https://www.desmos.com/calculator/ws5oqj8x5i
export function buyFYDai(daiReserves: any, fyDaiReserves: any, fyDai: any, timeTillMaturity: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiReserves);
  const Y = bignumber(fyDaiReserves);
  const T = bignumber(timeTillMaturity);
  const x = bignumber(fyDai);
  const k = bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years
  const g = bignumber(950 / 1000);
  const t = multiply(k, T);
  const a = subtract(1, multiply(g, t));
  const invA = divide(1, a);
  const Za = pow(Z, a);
  const Ya = pow(Y, a);
  const Yxa = pow(subtract(Y, x), a);
  const sum = add(Za, subtract(Ya, Yxa));
  const y = subtract(pow(sum, invA), Z);
  const yFee = add(y, fee);

  return yFee;
}

export function fyDaiForMint(
  daiReserves: any,
  fyDaiRealReserves: any,
  fyDaiVirtualReserves: any,
  dai: any,
  timeTillMaturity: any
): any {
  const Z = bignumber(daiReserves);
  const YR = bignumber(fyDaiRealReserves);
  const YV = bignumber(fyDaiVirtualReserves);
  const z = bignumber(dai);
  const t = bignumber(timeTillMaturity);

  let min = bignumber(0);
  let max = z;
  let y_out = divide(add(min, max), bignumber(2)); // average

  let i = 0;
  while (true) {
    const z_in = bignumber(buyFYDai(Z, YV, y_out, t));
    const Z_1 = add(Z, z_in); // New dai reserves
    const Y_1 = subtract(YR, y_out); // New fyDai reserves

    const pz = divide(subtract(z, z_in), add(subtract(z, z_in), y_out)); // dai proportion in my assets
    const PZ = divide(Z_1, add(Z_1, Y_1)); // dai proportion in the reserves
    // console.log(`i = ${i}`)
    // console.log(`pz = ${pz}`)
    // console.log(`PZ = ${PZ}`)

    // The dai proportion in my assets needs to be higher than but very close to the dai proportion in the reserves, to make sure all the fyDai is used.
    if (multiply(PZ, bignumber(1.000001)) <= pz) min = y_out;
    y_out = divide(add(y_out, max), bignumber(2)); // bought too little fyDai, buy some more
    if (pz <= PZ) max = y_out;
    y_out = divide(add(y_out, min), bignumber(2)); // bought too much fyDai, buy a bit less
    // console.log(`y = ${floor(y_out).toFixed()}\n`)

    if (multiply(PZ, bignumber(1.000001)) > pz && pz > PZ) return floor(y_out).toFixed(); // Just right

    // eslint-disable-next-line no-plusplus
    if (i++ > 10000) return floor(y_out).toFixed();
  }
}