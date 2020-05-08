import React from 'react';
import ReactDOM from 'react-dom';
import { Web3ReactProvider, UnsupportedChainIdError } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector';
import { ethers } from 'ethers';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// TODO: ProviderType definition
// TODO: Implement a 2nd/fallback provider for robustness

function getErrorMessage(error: Error) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  } if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } if (
    error instanceof UserRejectedRequestErrorInjected
    // error instanceof UserRejectedRequestErrorWalletConnect ||
    // error instanceof UserRejectedRequestErrorFrame
  ) {
    return 'Please authorize this website to access your Ethereum account.';
  } 
  console.error(error);
  return 'An unknown error occurred. Check the console for more details.';
}

function getLibrary(provider : any) {
  // return new ethers.providers.InfuraProvider([network = “homestead”][,apiAccessToken])
  return new ethers.providers.Web3Provider(provider);
}

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
