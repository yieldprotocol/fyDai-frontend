import { BigNumber } from 'ethers';

export interface IYieldSeries {
  displayName: string;
  displayNameMobile: string;
  maturity: number;
  maturity_: Date;
  poolAddress: string;
  fyDaiAddress: string;
  hasPoolDelegatedProxy: boolean;
  isMature: any; // function typeScript this out
  fyDaiBalance_: number;
  fyDaiBalance: BigNumber;
  seriesColor: string;
  seriesDarkColor: string;
  seriesLightColor: string;
  seriesTextColor:string;
  totalSupply: BigNumber;
  totalSupply_: number;
  symbol: string;
  id: string;
  yieldAPR: string;
  yieldAPR_: string;
  poolTokens?:  BigNumber;
  poolTokens_?: number;
  poolState?: any;
  poolPercent_?:string;
  currentValue?: any;
  wethDebtDai?: BigNumber;
  wethDebtDai_?: number;
  wethDebtFYDai?: BigNumber;
  wethDebtFYDai_?: number;
  daiReserves: BigNumber;

  fyDaiReserves: BigNumber;
  fyDaiVirtualReserves: BigNumber;

}

export interface IConnection {
  provider: any;     /* a wallet connected provider */
  altProvider: any;  /* a provider with no connected wallet */
  signer: any;       /* derived from provider if EIP1192 */
  voidSigner: any;
  chainId: number|null;   /* official chain number or development number */
  networkName: string|null; /* network name (eg. Ropsten) */
  account: string|null;   /* user ethereum address */
}

export interface IYieldUser {
  appPrefs: any;
  account?: string;
  ethBalance?: BigNumber;
  ethBalance_?: number;
  ethPosted?: BigNumber;
  ethPosted_?: number;
  totalDebtFYDai?: BigNumber;
  totalDebtFYDai_?: number;
  ethAvailable?:BigNumber;
  ethAvailable_?:BigNumber;
}

export interface INotification {
  message: string;
  type?: string;
  callbackAction?: any;
  callbackCancel?: any;
  showFor?: number;
  position?: string;
  notifyOpen?: boolean,
  timerMs?: number,
  fatalOpen?: boolean,
  fatalMsg?: string,
  pendingTxs?: any,
  lastCompletedTx?: any,
  requestedSigs?: any,
}

export interface IProxyExecutable {
  contractAddress: string,
  calldata: any,
  overrides: any,
}

export interface ITx {
  tx: any, 
  msg: string,
  type: string,
  series: IYieldSeries|null,
  value: string | null,
  code?: string, // internal tracking code
}

export interface ISignListItem {
  id: string, 
  desc: string, 
  conditional: boolean| ( ()=>Promise<boolean> ),
  signFn: any,
  fallbackFn: any,
}

export interface IDelegableMessage {
  user: string;
  delegate: string;
  nonce: number | string;
  deadline: number | string;
}

export interface DaiPermitMessage {
  holder: string;
  spender: string;
  nonce: number;
  expiry: number | string;
  allowed?: boolean;
}

export interface ERC2612PermitMessage {
  owner: string;
  spender: string;
  value: number | string;
  nonce: number | string;
  deadline: number | string;
}

export interface IDomain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

export interface IAnalytics {
  event_name: string;
  event_parameters: any;
}

export interface ITxState {
  pendingTxs: any[],
  lastCompletedTx: any,
  requestedSigs: any[],
  txProcessActive: string|null,
}

export interface IReducerAction {
  type:string,
  payload?:any,
}