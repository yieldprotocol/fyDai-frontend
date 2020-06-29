import React from 'react';
import ReactDOM from 'react-dom';
import { ethers } from 'ethers';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { NotifyProvider }  from './contexts/NotifyContext';
import { YieldProvider }  from './contexts/YieldContext';
import { SeriesProvider }  from './contexts/SeriesContext';
import { ConnectionProvider } from './contexts/ConnectionContext';

// TODO: re-implement web3-react
import { Web3ReactProvider, createWeb3ReactRoot, UnsupportedChainIdError } from '@web3-react/core';
import { NoEthereumProviderError, UserRejectedRequestError as UserRejectedRequestErrorInjected } from '@web3-react/injected-connector';

// TODO: Production infura support
function getLibrary(provider:any) {
  // return new ethers.providers.InfuraProvider([network = “homestead”][,apiAccessToken])
  // @ts-ignore
  return new ethers.providers.Web3Provider(provider);
}

ReactDOM.render(
  <React.StrictMode>
    {/* <Web3ReactProvider getLibrary={getLibrary}> */}
    <ConnectionProvider>
      <NotifyProvider>
        <YieldProvider>
          <SeriesProvider>
            <App />
          </SeriesProvider>
        </YieldProvider>
      </NotifyProvider>
    </ConnectionProvider>
    {/* </Web3ReactProvider> */}
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.register();
