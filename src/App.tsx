import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Grommet, Collapsible, Grid, Main, Heading, Footer, Button, Box, Avatar, Text, CheckBox, ThemeContext } from 'grommet';

import { 
  FaSun as Sun,
  FaMoon as Moon,
  FaUser as User,
  FaPlug as Plug,
  FaCheckCircle as CheckCircle,
} from 'react-icons/fa';

import { base } from 'grommet/themes';
import { deepMerge } from 'grommet/utils';

import { injected, trezor, walletlink, torus, ledger } from './connectors';
import { useGetWeiBalance, useEagerConnect, getNetworkName }  from './hooks/connectionFns';
import { yieldTheme } from './theme';

import Header from './components/header';

import './App.css';

function App() {
  const { active, activate, chainId, account, connector } = useWeb3React();
  const [balance, setBalance] = React.useState();
  const [darkmode, setDarkmode] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const getWeiBalance = useGetWeiBalance();
  const eagerConnect = useEagerConnect();

  const manageConnection = async () => {
    setLoading(true);
    !active && chainId && account && (
      await eagerConnect
    );
    setLoading(false);
  };

  const updateBalance = async () => {
    setBalance(await getWeiBalance);
  };

  React.useEffect(() => {
    manageConnection();
    // (async () => activate(injected, console.log))();
    updateBalance();
  }, [ active, account, chainId ]);

  return (
    <div className="App">
      <Grommet theme={deepMerge(base, yieldTheme)} themeMode={darkmode?'dark':'light'} full>
        <Grid fill rows={['auto', 'flex', 'auto']}>
          <Header />
          <Main pad='large'>
            <Box
              align="center" 
              justify="center"
            >
              { !active ?  (
                <Box background='background-front' wrap align="center" justify="center" elevation="small" pad="small">
                  <h1>No wallet connection </h1>
                  <p>Try connect with:</p>
                  <Button icon={<Plug />} label="Metamask" onClick={() => activate(injected, console.log)} />
                  <p />
                  <Button icon={<Plug />} label="Trezor" onClick={() => activate(trezor, console.log)} />
                  <p />
                  <Button icon={<Plug />} label="Torus" onClick={() => activate(torus, console.log)} />
                  <p />
                  <Button icon={<Plug />} label="WalletLink" onClick={() => activate(walletlink, console.log)} />
                </Box>
              ):(
                <Box background='background-front' align="center" justify="center" elevation="small" pad="large">
                  <CheckCircle color={yieldTheme.global.colors.brand.dark} size='64'/><h1> Wallet connected.</h1>
                  <Text>Connected to:</Text> {chainId && getNetworkName(chainId) }
                  <p />
                  <Box direction="row" gap="small">
                    <Avatar size="small" background="accent-1">
                      <User color="accent-2" />
                    </Avatar>
                    <Text style={{ overflow:'hidden' }}>{ account && account }</Text>
                  </Box>
                  <p />
                  <Text size='small'>with a WEI balance of:</Text>
                  <p>{ balance }</p>
                  <p />
                </Box>
              )}
            </Box>
          </Main>
          <Footer
            pad="small"
            justify="end"
          >
            {darkmode? 
              <Sun onClick={()=>setDarkmode(!darkmode)} color={yieldTheme.global.colors.brand.light} />
              :
              <Moon onClick={()=>setDarkmode(!darkmode)} />}
            <CheckBox 
              checked={darkmode} 
              reverse 
              toggle={true} 
              onChange={()=>setDarkmode(!darkmode)} 
            />
          </Footer>
        </Grid>
      </Grommet>
    </div>
  );
}

export default App;
