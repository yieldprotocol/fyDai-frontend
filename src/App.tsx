import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from './connectors';
import { getNetworkName, useGetWeiBalance } from './hooks';


import logo from './logo.svg';
import './App.css';

// const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42, 1337] });

// const manageConnection = async () => {
//   const web3React = useWeb3React();
//   return (<> </>);
// };

function App() {
  const { activate, chainId, library, account } = useWeb3React();
  const [balance, setBalance] = React.useState(0);
  const getWeiBalance = useGetWeiBalance();
  
  const updateBalance = async () => {
    setBalance(await getWeiBalance);
  };

  React.useEffect(() => {
    (async () => activate(injected, console.log))();
    updateBalance();
    // manageConnection();
  }, [ activate, account ]);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Connected to chainID: {chainId && getNetworkName(chainId) }
        </p>
        <p>
          with account: 
        </p>
        <p>
          { account && account }
        </p>
        <p>
          which has an WEI balance of: 
        </p>
        <p>
          { balance }
        </p>
         
      </header>
    </div>
  );
}

export default App;
