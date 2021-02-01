/* eslint-disable @typescript-eslint/camelcase */
import { BigNumber } from 'ethers';
import * as withEthers from './yieldMath';

const { bignumber, add, subtract, multiply, divide, pow, floor }  = require('mathjs');

const daiReserves = 1450000;
const fyDaiReserves = 1023400;
const supply = 1023400;
const dai = 10223;
const lpTokens = 2230;
const fyDai = 9230;
const timeTillMaturity = 200000;
const fyDaiRealReserves = 3400;
const fyDaiVirtualReserves = 2023400;

// https://www.desmos.com/calculator/mllhtohxfx
export function mint(daiRes: any, fyDaiRes: any, sup: any, d: any): [any, any] {
  const Z = bignumber(daiRes);
  const Y = bignumber(fyDaiRes);
  const S = bignumber(sup);
  const z = bignumber(d);
  const m = divide(multiply(S, z), Z);
  const y = divide(multiply(Y, m), S);

  return [m, y];
}

// https://www.desmos.com/calculator/ubsalzunpo
export function burn(daiRes: any, fyDaiRes: any, sup: any, lpT: any): [any, any] {
  const Z = bignumber(daiRes);
  const Y = bignumber(fyDaiRes);
  const S = bignumber(sup);
  const x = bignumber(lpT);
  const z = divide(multiply(x, Z), S);
  const y = divide(multiply(x, Y), S);

  return [z, y];
}

// https://www.desmos.com/calculator/5nf2xuy6yb
export function sellDai(daiRes: any, fyDaiRes: any, d: any, ttm: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiRes);
  const Y = bignumber(fyDaiRes);
  const T = bignumber(ttm);
  const x = bignumber(d);
  const k = bignumber(1 / (4 * 365 * 24 * 60 * 60)); // 1 / seconds in four years
  const g = bignumber(950 / 1000);
  const t = multiply(k, T);
  const a = subtract(1, multiply(g, t));
  const invA = divide(1, a);
  const Za = pow(Z, a);
  const Ya = pow(Y, a);
  const Zxa = pow(add(Z, x), a);
  const sum = subtract(add(Za, Ya), Zxa);
  const y = subtract(Y, pow(sum, invA));
  const yFee = subtract(y, fee);

  return y.toString();
}

// https://www.desmos.com/calculator/6jlrre7ybt
export function sellFYDai(daiRes: any, fyDaiRes: any, fyD: any, ttm: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiRes);
  const Y = bignumber(fyDaiRes);
  const T = bignumber(ttm);
  const x = bignumber(fyD);
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

  return y.toString();
}

// https://www.desmos.com/calculator/0rgnmtckvy
export function buyDai(daiRes: any, fyDaiRes: any, d: any, ttm: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiRes);
  const Y = bignumber(fyDaiRes);
  const T = bignumber(ttm);
  const x = bignumber(d);
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

  return y.toString();
}

// https://www.desmos.com/calculator/ws5oqj8x5i
export function buyFYDai(daiRes: any, fyDaiRes: any, fyD: any, ttm: any): any {
  const fee = bignumber(1000000000000);
  const Z = bignumber(daiRes);
  const Y = bignumber(fyDaiRes);
  const T = bignumber(ttm);
  const x = bignumber(fyD);
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

  return y.toString();
}

export function fyDaiForMint(
  daiRes: any,
  fyDaiRealRes: any,
  fyDaiVirtualRes: any,
  d: any,
  ttm: any
): any {
  const Z = bignumber(daiRes);
  const YR = bignumber(fyDaiRealRes);
  const YV = bignumber(fyDaiVirtualRes);
  const z = bignumber(d);
  const t = bignumber(ttm);

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

it('Should give the same result for mint()', () => {
  expect( 
    withEthers.mint(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(supply),
      BigNumber.from(dai) 
    ).map( (x: BigNumber) => x.toString() )
  ).toEqual(
    mint(daiReserves, fyDaiReserves, supply, dai).map( (x:any) =>  x.toString())
  );
});

it('Should give the same result for burn()', () => {
  expect( 
    withEthers.burn(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(supply), 
      BigNumber.from(lpTokens)
    ).map( (x: BigNumber) => x.toString() )
  ).toEqual(
    burn(daiReserves, fyDaiReserves, supply, lpTokens).map( (x:any) => x.toString())
  );
});

it('Should give the same result for sellDai()', () => {
  expect(
    withEthers.sellDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(dai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    sellDai(daiReserves, fyDaiReserves, dai, timeTillMaturity).toString()
  );
});

it('Should give the same result for sellFYDai()', () => {
  expect(
    withEthers.sellFYDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(fyDai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    sellFYDai(daiReserves, fyDaiReserves, fyDai, timeTillMaturity).toString()
  );
});

it('Should give the same result for buyDai', () => {
  expect( 
    withEthers.buyDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(fyDai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    buyDai(daiReserves, fyDaiReserves, fyDai, timeTillMaturity).toString()
  );
});

it('Should give the same result for buyFYDai', () => {
  expect( 
    withEthers.buyFYDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(dai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    buyFYDai(daiReserves, fyDaiReserves, dai, timeTillMaturity).toString()
  );
});

it('Should give the same result for fyDaiForMint()', () => {
  expect( 
    withEthers.fyDaiForMint(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiRealReserves),
      BigNumber.from(fyDaiVirtualReserves), 
      BigNumber.from(dai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    fyDaiForMint(daiReserves, fyDaiRealReserves, fyDaiVirtualReserves, dai, timeTillMaturity).toString()
  );
});
