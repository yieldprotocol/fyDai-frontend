import { InjectedConnector } from '@web3-react/injected-connector';
import { NetworkConnector } from '@web3-react/network-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';
import { LedgerConnector } from '@web3-react/ledger-connector';
import { TrezorConnector } from '@web3-react/trezor-connector';
import { FortmaticConnector } from '@web3-react/fortmatic-connector';
import { TorusConnector } from '@web3-react/torus-connector';

const POLLING_INTERVAL = 12000;

const RPC_URLS: { [chainId: number]: string } = {
  1: 'https://mainnet.infura.io/v3/9dbb21faf34448c9af1f3047c45b15df', // process.env.REACT_APP_RPC_URL_1 as string,
  4: 'https://rinkeby.infura.io/v3/9dbb21faf34448c9af1f3047c45b15df', // process.env.REACT_APP_RPC_URL_4 as string
  1337: 'http://localhost:8545' // process.env.REACT_APP_RPC_LOCAL as string
};

export const injected = new InjectedConnector({ supportedChainIds: [1337] });
// export const injected = new InjectedConnector({ supportedChainIds: [1, 4, 1337] });

export const network = new NetworkConnector({
  urls: { 1: RPC_URLS[1], 4: RPC_URLS[4], 1337: RPC_URLS[1337], },
  defaultChainId: 1337
});

export const walletlink = new WalletLinkConnector({
  url: RPC_URLS[1],
  appName: 'web3-react example'
});

export const ledger = new LedgerConnector({ chainId: 1, url: RPC_URLS[1], pollingInterval: POLLING_INTERVAL });

export const trezor = new TrezorConnector({
  chainId: 1,
  url: RPC_URLS[1],
  pollingInterval: POLLING_INTERVAL,
  manifestEmail: 'dummy@abc.xyz',
  manifestAppUrl: 'http://localhost:1234'
});

export const torus = new TorusConnector({ chainId: 1 });

export const fortmatic = new FortmaticConnector({ apiKey: process.env.FORTMATIC_API_KEY as string, chainId: 4 });

// export const portis = new PortisConnector({ dAppId: process.env.PORTIS_DAPP_ID as string, networks: [1, 100] });

// export const squarelink = new SquarelinkConnector({
//   clientId: process.env.SQUARELINK_CLIENT_ID as string,
//   networks: [1, 100]
// });

// export const walletconnect = new WalletConnectConnector({
//   rpc: { 1: RPC_URLS[1] },
//   bridge: 'https://bridge.walletconnect.org',
//   qrcode: true,
//   pollingInterval: POLLING_INTERVAL
// });

// export const authereum = new AuthereumConnector({ chainId: 42 });

// export const frame = new FrameConnector({ supportedChainIds: [1] });
