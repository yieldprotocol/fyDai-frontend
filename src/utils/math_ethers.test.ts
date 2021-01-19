import { BigNumber, ethers, utils } from 'ethers';

import * as withEthers from './math_ethers';
import * as withMath from './math';

const { bignumber, add, subtract, multiply, divide, pow, floor } = require('mathjs');

const ZERO: BigNumber = BigNumber.from('0');
const ONE: BigNumber  = BigNumber.from('1');
const TWO: BigNumber  = BigNumber.from('2');

const daiReserves = 1450000;
const fyDaiReserves = 1023400;
const supply = 1023400;
const dai = 1020;
const lpTokens = 2230;
const fyDai = 9230;
const timeTillMaturity = 200000;
const fyDaiRealReserves = 3400;
const fyDaiVirtualReserves = 2023400;

it('Should give the same result for *mint()*', () => {
  expect( 
    withEthers.mint(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(supply),
      BigNumber.from(dai) 
    ).map( (x: BigNumber) => x.toString() )
  ).toEqual(
    withMath.mint(daiReserves, fyDaiReserves, supply, dai).map( (x:any) =>  x.toString())
  );
});

it('Should give the same result for *burn()*', () => {
  expect( 
    withEthers.burn(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(supply), 
      BigNumber.from(lpTokens)
    ).map( (x: BigNumber) => x.toString() )
  ).toEqual(
    withMath.burn(daiReserves, fyDaiReserves, supply, lpTokens).map( (x:any) => x.toString())
  );
});

it('Should give the same result for *sellDai()*', () => {
  expect(
    withEthers.sellDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(dai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    withMath.sellDai(daiReserves, fyDaiReserves, dai, timeTillMaturity).toString()
  );
});


it('Should give the same result for *sellFYDai()*', () => {
  expect( 
    withEthers.sellFYDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(fyDai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    withMath.sellFYDai(daiReserves, fyDaiReserves, fyDai, timeTillMaturity).toString()
  );
});

it('Should give the same result for *buyDai*', () => {
  expect( 
    withEthers.buyDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(fyDai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    withMath.buyDai(daiReserves, fyDaiReserves, fyDai, timeTillMaturity).toString()
  );
});

it('Should give the same result for *buyFYDai*', () => {
  expect( 
    withEthers.buyFYDai(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiReserves), 
      BigNumber.from(dai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    withMath.buyFYDai(daiReserves, fyDaiReserves, dai, timeTillMaturity).toString()
  );
});

it('Should give the same result for *fyDaiForMint()*', () => {
  expect( 
    withEthers.fyDaiForMint(
      BigNumber.from(daiReserves), 
      BigNumber.from(fyDaiRealReserves),
      BigNumber.from(fyDaiVirtualReserves), 
      BigNumber.from(dai), 
      BigNumber.from(timeTillMaturity)
    ).toString()
  ).toEqual(
    withMath.fyDaiForMint(daiReserves, fyDaiRealReserves, fyDaiVirtualReserves, dai, timeTillMaturity).toString()
  );
});
