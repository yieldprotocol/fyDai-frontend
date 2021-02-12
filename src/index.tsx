import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import { ethers } from 'ethers';
import { Web3ReactProvider, createWeb3ReactRoot } from '@web3-react/core';

import './index.css';

import App from './App';
import { NotifyProvider }  from './contexts/NotifyContext';
import { YieldProvider }  from './contexts/YieldContext';
import { UserProvider }  from './contexts/UserContext';
import { SeriesProvider }  from './contexts/SeriesContext';
import { TxProvider } from './contexts/TxContext';
import { HistoryProvider } from './contexts/HistoryContext';

function getLibrary(provider: any) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}
function getFallbackLibrary(provider: any) {
  const library = new ethers.providers.InfuraProvider(provider.chainId, '646dc0f33d2449878b28e0afa25267f6');
  // const library = ethers.getDefaultProvider('ropsten');
  library.pollingInterval = 12000;
  return library;
}
const Web3ReactProviderFallback = createWeb3ReactRoot('fallback');

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Web3ReactProvider getLibrary={getLibrary}> 
        <Web3ReactProviderFallback getLibrary={getFallbackLibrary}> 
          
          <NotifyProvider>
            <YieldProvider>
              <UserProvider>
                <SeriesProvider>
                  <TxProvider>
                    <HistoryProvider>
    
                      <App />
                    
                    </HistoryProvider>                  
                  </TxProvider>
                </SeriesProvider>
              </UserProvider>
            </YieldProvider>
          </NotifyProvider>
          
        </Web3ReactProviderFallback>
      </Web3ReactProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
