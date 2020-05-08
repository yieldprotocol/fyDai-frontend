import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Button, Box, Avatar, Text } from 'grommet';
import { StatusGood, Connect, UserAdmin } from 'grommet-icons';
import { injected, trezor, walletlink, torus, ledger } from './connectors';
import { useGetWeiBalance, useEagerConnect, getNetworkName }  from './hooks/connectionFns';

import './App.css';

function App() {
  const { active, activate, chainId, account, connector } = useWeb3React();
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
            <StatusGood color="lightgreen" size='large' /><h1> Wallet connected.</h1>
            <Text>Connected to:</Text> {chainId && getNetworkName(chainId) }
            <p />
            <Box direction="row" gap="small">
              <Avatar size="small" background="accent-1">
                <UserAdmin size="small" color="accent-2" />
              </Avatar>
              <Text>{ account && account }</Text>
            </Box>
            <p />
            <Text size='small'>with a WEI balance of:</Text>
            <p>{ balance }</p>
            <p />
            {/* <Button icon={<Connect />} label="LogOut" onClick={() => connector && ( connector as any).close()} /> */}
          </>
        ):(
          <>
            <h1>No wallet connection </h1>
            <p>Try connect with:</p>
            <Button icon={<Connect />} label="Metamask" onClick={() => activate(injected, console.log)} />
            <p />
            <Button icon={<Connect />} label="Trezor" onClick={() => activate(trezor, console.log)} />
            <p />
            <Button icon={<Connect />} label="Torus" onClick={() => activate(torus, console.log)} />
            <p />
            <Button icon={<Connect />} label="WalletLink" onClick={() => activate(walletlink, console.log)} />
          </>
        )}
      </header>
    </div>
  );
}

export default App;
