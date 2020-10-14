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

export const injected = new InjectedConnector({ supportedChainIds: [5, 42, 31337] });

export const walletconnect = new WalletConnectConnector({
  rpc: { 42: RPC_URLS[42]  },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: POLLING_INTERVAL
});

// export const walletlink = new WalletLinkConnector({
//   url: RPC_URLS[1],
//   appName: 'web3-react example'
// });
// export const ledger = new LedgerConnector({ chainId: 1, url: RPC_URLS[1], pollingInterval: POLLING_INTERVAL });
// export const trezor = new TrezorConnector({
//   chainId: 1,
//   url: RPC_URLS[1],
//   pollingInterval: POLLING_INTERVAL,
//   manifestEmail: 'dummy@abc.xyz',
//   manifestAppUrl: 'http://localhost:1234'
// });

// export const fortmatic = new FortmaticConnector({ apiKey: process.env.FORTMATIC_API_KEY as string, chainId: 4 });
// export const portis = new PortisConnector({ dAppId: process.env.PORTIS_DAPP_ID as string, networks: [1, 100] });
// export const squarelink = new SquarelinkConnector({
//   clientId: process.env.SQUARELINK_CLIENT_ID as string,
//   networks: [1, 100]
// });
// export const authereum = new AuthereumConnector({ chainId: 42 });
// export const frame = new FrameConnector({ supportedChainIds: [1] });
