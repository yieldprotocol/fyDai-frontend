import { BigNumber } from 'ethers';

export interface IYieldSeries {
  name: string
  displayName: string;
  maturity: number;
  maturity_: Date;
  poolAddress: string;
  fyDaiAddress: string;
  liquidityProxyAddress: string;
  hasDelegatedPool: boolean;
  isMature: any; // function typeScript this out
  fyDaiBalance_: number;
  fyDaiBalance: BigNumber;
  totalSupply?: BigNumber;
  totalSupply_?: number;
  poolTokens?:  BigNumber;
  poolTokens_?: number;
  poolState?: any; // TODO type this
  symbol?: string;
  id?: string;
  currentValue?: any;
  seriesColor?: string;
  seriesTextColor?:string;
  wethDebtDai?: BigNumber;
  wethDebtDai_?: number;
  wethDebtFyDai?: BigNumber;
  wethDebtFyDai_?: number;
  yieldAPR?: number;
  yieldAPR_?: string;
}

export interface IConnection {
  // TODO get provider types
  provider: any;     /* a wallet connected provider */
  altProvider: any;  /* a provider with no connected wallet */
  // TODO get signer types
  signer: any;       /* derived from provider if EIP1192 */
  voidSigner: any;
  chainId: number|null;   /* official chain number or development number */
  networkName: string|null; /* network name (eg. Ropsten) */
  account: string|null;   /* user ethereum address */
}

export interface IUser {
  appPrefs: any;
  account?: string;
  ethBalance?: BigNumber;
  ethBalance_?: number;
  ethPosted?: BigNumber;
  ethPosted_?: number;
  totalDebtFyDai?: BigNumber;
  totalDebtFyDai_?: number;
  ethAvailable?:BigNumber;
  ethAvailable_?:BigNumber;
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
  pendingTxs?: any,
  lastCompletedTx?: any,
  requestedSigs?: any,
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