import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Grommet, grommet, Grid, Main, Image, Heading, Footer, Button, Box, Avatar, Text, CheckBox, ThemeContext } from 'grommet';
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
import { useGetWeiBalance, useEagerConnect, useConnectorImage, getNetworkName }  from './hooks/connectionFns';
import { yieldTheme } from './theme';

import Header from './components/header';

import metamaskImage from './assets/images/metamask.png';
import trezorImage from './assets/images/trezor.png';
import walletlinkImage from './assets/images/walletlink.png';
import torusImage from './assets/images/torus.png';
// import noConnectionImage from '../assets/images/noconnection.png';

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

  const connectorList = [
    { name:'Metamask', image:metamaskImage, connection:injected },
    { name:'Tezor', image:trezorImage, connection:trezor },
    { name:'Torus', image:torusImage, connection:torus },
    { name:'Walletlink', image:walletlinkImage, connection:walletlink }
  ];

  return (
    <div className="App">
      <Grommet theme={deepMerge(grommet, yieldTheme)} themeMode={darkmode?'dark':'light'} full>
        <Grid fill rows={['auto', 'flex', 'auto']}>
          <Header />
          <Main pad='large'>
            <Box
              align="center" 
              justify="center"
            >
              { !active ?  (
                <Box 
                  background='background-front'
                  wrap
                  align="center"
                  justify="center"
                  elevation="small"
                  pad="small"
                  gap='small'
                >
                  <h1>No wallet connection </h1>
                  <p>Try connect with:</p>
                  {connectorList.map((x) => (
                    <Button 
                      key={x.name}
                      icon={<Box height="15px" width="15px"><Image src={x.image} fit='contain' /></Box>}
                      label={x.name}
                      onClick={() => activate(x.connection, console.log)}
                    />
                  ))}
                </Box>
              ):(
                <Box background='background-front' align="center" justify="center" elevation="small" pad="large">
                  <CheckCircle color={yieldTheme.global.colors.brand.dark} size='64' /><h1> Wallet connected.</h1>
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
