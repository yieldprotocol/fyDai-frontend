import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';

const POLLING_INTERVAL = 12000;

const RPC_URLS: { [chainId: number]: string } = {
  1: process.env.REACT_APP_RPC_URL_1 as string,
  4: process.env.REACT_APP_RPC_URL_4 as string,
  5: process.env.REACT_APP_RPC_URL_5 as string,
  42: process.env.REACT_APP_RPC_URL_42 as string,
  1337: process.env.REACT_APP_RPC_URL_1337 as string,
  31337: process.env.REACT_APP_RPC_URL_31337 as string,
};

export const injected = new InjectedConnector({ supportedChainIds: [1, 42] });

export const walletconnect = new WalletConnectConnector({
  rpc: { 1: RPC_URLS[1]  },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: POLLING_INTERVAL
});
