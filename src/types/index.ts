export interface IYieldSeries {
  maturityDate: Date;
  interestRate: number;
  currentValue: number;
  balance: number; // credit?
  debt: number;
  // isAcceptable(s: string): boolean;
}

export interface IYieldAccount {

}

export interface IMakerVault {

}

