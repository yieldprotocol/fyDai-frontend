


/* Trunctate a string value to a certain number of 'decimal' point */
export const cleanValue = (input:string, decimals:number=12) => {
  const re = new RegExp(`(\\d+\\.\\d{${decimals}})(\\d)`);
  const inpu = input.match(re); // inpu = truncated 'input'... get it?
  if (inpu) {
    return inpu[1];
  }
  return input.valueOf();
};

/* creates internal tracking code of a transaction type */
export const genTxCode = (txType: string, series:string|null) => {
  return `${txType}${series || ''}`; 
};

/* handle Address/hash shortening */
export const abbreviateHash = (addr:string, buffer:number=4) => {
  return `${addr?.substring(0, buffer)}...${addr?.substring(addr.length - buffer)}`; 
};

/**
 * number formatting if reqd.
 * */
export const nFormatter = (num:number, digits:number) => {
  const si = [
    { value: 1, symbol: '' },
    { value: 1E3, symbol: 'k' },
    { value: 1E6, symbol: 'M' },
    { value: 1E9, symbol: 'G' },
    { value: 1E12, symbol: 'T' },
    { value: 1E15, symbol: 'P' },
    { value: 1E18, symbol: 'E' }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol;
};

export const copyToClipboard=(str:string)=> {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
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

export const buildGradient = (colorFrom:string, colorTo:string  ) => {
  return `linear-gradient(to bottom right,
    ${modColor( colorFrom || '#add8e6', -50) }, 
    ${modColor( colorFrom || '#add8e6', 0) },
    ${modColor( colorFrom || '#add8e6', 0) },
    ${modColor( colorTo, 50)}, 
    ${modColor( colorTo, 50)}, 
    ${modColor( colorTo, 50)},
    ${modColor( colorTo, 25)}, 
    ${modColor( colorTo, 0)}, 
    ${modColor( colorTo, 0)})`;
};

/* google analytics log event */
export const logEvent = (eventName: string, eventParams: any ) => {
  if (eventName) {
    window?.gtag('event', eventName, eventParams);
  }
};