export interface IYieldSeries {
  maturityDate: Date;
  interestRate: number;
  currentValue: number;
  balance: number; // credit?
  debt: number;
  // isAcceptable(s: string): boolean;
}

const enum notificationEnum {
  "warn",
  "info",
  "error",
  "success",
}
const enum nPositionEnum {
  "top",
  "center",
  "bottom",
}
export interface INotification {
  message: string;
  // type: notificationEnum;
  type?: string;

  callbackAction?: any;
  callbackCancel?: any;
  showFor?: number;
  position?: nPositionEnum;
}

export interface IYieldAccount {}

export interface IMakerVault {}
