import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Button } from 'grommet';
import { StatusGood, Connect } from 'grommet-icons';

import { injected, trezor } from './connectors';
import { useGetWeiBalance, useEagerConnect, getNetworkName }  from './hooks/connectionFns';


import './App.css';

function App() {
  const { active, activate, chainId, account } = useWeb3React();
  const [balance, setBalance] = React.useState();
  const getWeiBalance = useGetWeiBalance();
  const eagerConnect = useEagerConnect();

  const manageConnection = async () => {
    !active && chainId && account && (
      await eagerConnect
    );
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
        { active ?  (
          <>
            <StatusGood color='green' size='large' /><h1> Wallet connected.</h1>
            <p>Connected to: {chainId && getNetworkName(chainId) } </p>
            <p> with account:</p>
            <p>{ account && account }</p>
            <p>which has an WEI balance of:</p>
            <p>{ balance }</p>
          </>
        ):(
          <>
            <h1>No wallet connection </h1>
            <p>Try connect with:</p>
            <Button icon={<Connect />} label="Metamask" onClick={() => activate(injected, console.log)} />
            <p />
            <Button icon={<Connect />} label="Trezor" onClick={() => activate(trezor, console.log)} />
          </>
        )}
      </header>


    </div>
  );
}

export default App;
