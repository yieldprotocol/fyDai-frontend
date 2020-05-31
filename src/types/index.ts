export interface IYieldSeries {
  name: string
  maturity: number|Date;
  YDai: string;
  ChaiDealer: string;
  Mint: string;
  WethDealer: string;
  symbol:string;
  id?: string;
  rate?: any;
  currentValue?: any;
}

export interface INotification {
  message: string;
  // type: notificationEnum;
  type?: string;
  callbackAction?: any;
  callbackCancel?: any;
  showFor?: number;
  position?: string;
}

export interface IYieldAccount {}

export interface IMakerVault {}

// export interface ICallTx {
//   addr:string;
//   contract:string;
//   fn:string;
//   data?:any[];
// }
