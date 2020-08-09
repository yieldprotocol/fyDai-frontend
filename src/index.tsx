import React from 'react';
import ReactDOM from 'react-dom';
import { ethers } from 'ethers';
import { Web3ReactProvider } from '@web3-react/core';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { NotifyProvider }  from './contexts/NotifyContext';
import { YieldProvider }  from './contexts/YieldContext';
import { UserProvider }  from './contexts/UserContext';
import { SeriesProvider }  from './contexts/SeriesContext';

function getLibrary(provider: any) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}> 
      <NotifyProvider>
        <YieldProvider>
          <UserProvider>
            <SeriesProvider>
              <App />
            </SeriesProvider>
          </UserProvider>
        </YieldProvider>
      </NotifyProvider>
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

serviceWorker.register();
