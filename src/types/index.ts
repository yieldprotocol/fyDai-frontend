export interface IYieldSeries {
  name: string
  maturity: number;
  maturity_p: Date;
  YDai: string;
  yDaiBalance_p: any;
  yDaiBalance: any;
  ChaiDealer: string;
  Mint: string;
  WethDealer: string;
  symbol:string;
  id?: string;
  rate?: any;
  currentValue?: any;
  seriesColor?: string;
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
