export interface IYieldSeries {
  name: string
  maturity: number;
  maturity_: Date;
  YDai: string;
  yDaiBalance_: any;
  yDaiBalance: any;
  symbol:string;
  id?: string;
  rate?: any;
  currentValue?: any;
  seriesColor?: string;
}

export interface ISeriesPosition {

}

export interface IReducerAction {
  type:string,
  payload?:any,
}

export interface INotification {
  message: string;
  type?: string;
  callbackAction?: any;
  callbackCancel?: any;
  showFor?: number;
  position?: string;
  open?: boolean,
  timerMs?: number,
  fatalOpen?: boolean,
  fatalMsg?: string,
}

export interface IYieldAccount {}

export interface IMakerVault {}
