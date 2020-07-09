import { ethers, BigNumber } from 'ethers';

export const BN_RAY = BigNumber.from('1000000000000000000000000000');
export const N_RAY = '1000000000000000000000000000';
export const WAD = BigNumber.from('1000000000000000000');
export const RAY = BigNumber.from('1000000000000000000000000000');

export const RAD = BigNumber.from('10000000000000000000000000000000000000000');
export const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export const WETH = ethers.utils.formatBytes32String('WETH');
export const CHAI = ethers.utils.formatBytes32String('CHAI');

// / @dev Converts a number to WAD precision, for number up to 10 decimal places
export const toWad = (value:number) => {
  const exponent = BigNumber.from('10').pow(BigNumber.from('8'));
  return BigNumber.from(value*10**10).mul(exponent);
};

// / @dev Converts a number to RAY precision, for number up to 10 decimal places
export const toRay = (value:number) => {
  const exponent = BigNumber.from('10').pow(BigNumber.from('17'));
  return BigNumber.from(value*10**10).mul(exponent);
};

// / @dev Converts a number to RAD precision, for number up to 10 decimal places
export const toRad = (value:number) => {
  const exponent = BigNumber.from('10').pow(BigNumber.from('35'));
  return BigNumber.from(value*10**10).mul(exponent);
};

export const toWei = (value:string|number) => {
  return ethers.utils.parseEther(value.toString()); 
};

// / @dev Adds two numbers
// / I.e. addBN(ray(x), ray(y)) = ray(x - y)
export const addBN = (x:string, y:string) => {
  return BigNumber.from(x).add(BigNumber.from(y));
};

// / @dev Substracts a number from another
// / I.e. subBN(ray(x), ray(y)) = ray(x - y)
export const subBN = (x:string, y:string) => {
  return BigNumber.from(x).sub(BigNumber.from(y));
};

// / @dev Multiplies a number in any precision by a number in RAY precision, with the output in the first parameter's precision.
// / I.e. mulRay(wad(x), ray(y)) = wad(x*y)
export const mulRay = (x:BigNumber, ray:BigNumber) => {
  const unit = BigNumber.from('10').pow(BigNumber.from('27'));
  return BigNumber.from(x).mul(BigNumber.from(ray)).div(unit);
};

// / @dev Divides a number in any precision by a number in RAY precision, with the output in the first parameter's precision.
// / I.e. divRay(wad(x), ray(y)) = wad(x/y)
export const divRay = (x:BigNumber, ray:BigNumber) => {
  const unit = BigNumber.from('10').pow(BigNumber.from('27'));
  return unit.mul(BigNumber.from(x)).div(BigNumber.from(ray));
};

// @dev Takes a bignumber in RAY and converts it to a human accesible number string
export const rayToHuman = (x:any) => {
  // const unit = BigNumber.from('10').pow(BigNumber.from('27'));
  return BigNumber.from(x).div(RAY).toString();
};

// Yield Math type utils NB: EARLY STAGES
