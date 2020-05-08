import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from './connectors';
import { useGetWeiBalance, useEagerConnect, getNetworkName }  from './hooks/connectionFns';

import './App.css';

function App() {
  const { activate, chainId, account } = useWeb3React();
  const [balance, setBalance] = React.useState();
  const getWeiBalance = useGetWeiBalance();
  const eagerConnect = useEagerConnect();

  const manageConnection = async () => {
    const result = await eagerConnect;
    // !result && await activate(injected, console.log);
  };

  const updateBalance = async () => {
    setBalance(await getWeiBalance);
  };

  React.useEffect(() => {
    manageConnection();
    // (async () => activate(injected, console.log))();
    updateBalance();
  }, [ activate, account, chainId ]);

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
