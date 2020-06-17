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

export interface ISeriesPosition {

}

export interface INotification {
  message: string;
  type?: string;
  callbackAction?: any;
  callbackCancel?: any;
  showFor?: number;
  position?: string;
}

export interface IYieldAccount {}

export interface IMakerVault {}
