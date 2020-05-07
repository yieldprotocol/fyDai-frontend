import React from 'react';
import ReactDOM from 'react-dom';
import { Web3ReactProvider } from '@web3-react/core';
// import { provider } from '@web3-react/types'
import { ethers } from 'ethers';

import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';


// TODO: ProviderType definition
// TODO: Implement a 2nd/fallback provider for robustness
async function getLibrary(provider : any) {
   // return new ethers.providers.InfuraProvider([network = “homestead”][,apiAccessToken])
   // brute local ganache for initial dev period.
  const url = 'http://192.168.1.68:8545';
  return new ethers.providers.JsonRpcProvider(url);
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
