import { ethers, BigNumber } from 'ethers';
import { constants } from 'buffer';

/* constants */
export const BN_RAY = BigNumber.from('1000000000000000000000000000');
export const N_RAY = '1000000000000000000000000000';
export const WAD = BigNumber.from('1000000000000000000');
export const RAY = BigNumber.from('1000000000000000000000000000');
export const RAD = BigNumber.from('10000000000000000000000000000000000000000');
export const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
export const ETH = ethers.utils.formatBytes32String('ETH-A');
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

// @dev Takes a bignumber in RAY and converts it to a human understandalble number
export const rayToHuman = (x:BigNumber) => {
  // const unit = BigNumber.from('10').pow(BigNumber.from('27'));
  return divRay(x, RAY).toString();
};

// @dev Takes a bignumber in WEI, WAD or the like and converts it to human.
// @return {number}
export const humanizeNumber = (x:BigNumber) => {
  return parseFloat(ethers.utils.formatEther(x));
};

// / @dev Converts a number to WAD precision, for number up to 10 decimal places
export const dehumanizeNumber = (value:number) => {
  const exponent = BigNumber.from('10').pow(BigNumber.from('8'));
  return BigNumber.from(value*10**10).mul(exponent);
};


/* Trunctate a string value to a certain number of 'decimal' point */
export const cleanValue = (input:string, decimals:number=12) => {
  const re = new RegExp(`(\\d+\\.\\d{${decimals}})(\\d)`);
  const inpu = input.match(re); // inpu = truncated 'input'... get it?
  if (inpu) {
    console.log('Value truncated: ', inpu[1]);
    return inpu[1];
  }
  return input.valueOf();
};

/* handle Address/hash shortening */

export const abbreviateHash = (addr:string) => {
  return `${addr?.substring(0, 4)}...${addr?.substring(addr.length - 4)}`; 
};

/**
 * color functions
 * */
export const modColor = (color:any, amount:any) => {
  let c;
  let cT;
  if (color.length === 9 || color.length === 8 ) {
    c=color.substring(0, color.length - 2);
    cT=color.slice(-2);
  } else {
    c=color;
    cT='FF';
  }
  // eslint-disable-next-line prefer-template
  return '#' + c.replace(/^#/, '').replace(/../g, (col:any) => ('0'+Math.min(255, Math.max(0, parseInt(col, 16) + amount)).toString(16)).substr(-2))+ cT;
};

export const contrastColor = (hex:any) => {
  const hex_ = hex.slice(1);
  if (hex_.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  const r = parseInt(hex_.slice(0, 2), 16);
  const g = parseInt(hex_.slice(2, 4), 16);
  const b = parseInt(hex_.slice(4, 6), 16);

  return (r * 0.299 + g * 0.587 + b * 0.114) > 186
    ? 'brand'
    : 'brand-light';
};

export const invertColor = (hex:any) => {
  function padZero(str:string) {
    const zeros = new Array(2).join('0');
    return (zeros + str).slice(-2);
  }
  const hex_ = hex.slice(1);
  if (hex_.length !== 6) {
    throw new Error('Invalid HEX color.');
  }
  const r = (255 - parseInt(hex_.slice(0, 2), 16) ).toString(16);
  const g = (255 - parseInt(hex_.slice(2, 4), 16)).toString(16);
  const b = (255 - parseInt(hex_.slice(4, 6), 16)).toString(16);
  // pad each with zeros and return
  return `#${  padZero(r)  }${padZero(g)  }${padZero(b)}`;
};
