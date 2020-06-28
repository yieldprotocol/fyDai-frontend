import React from 'react';
import ReactDOM from 'react-dom';
import { ethers } from 'ethers';
// TODO: re-implement web3-react
import { Web3ReactProvider, createWeb3ReactRoot, UnsupportedChainIdError } from '@web3-react/core';
import { NoEthereumProviderError, UserRejectedRequestError as UserRejectedRequestErrorInjected } from '@web3-react/injected-connector';


import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { NotifyProvider }  from './contexts/NotifyContext';
import { YieldProvider }  from './contexts/YieldContext';
import { PositionsProvider }  from './contexts/PositionsContext';
import { ConnectionProvider } from './contexts/ConnectionContext';

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
            <PositionsProvider>
              <App />
            </PositionsProvider>
          </YieldProvider>
        </NotifyProvider>
      </ConnectionProvider>
    {/* </Web3ReactProvider> */}
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.register();
