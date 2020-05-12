import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Grommet, Header, Heading, base, Grid, Main, Footer, Button, Box, Text, CheckBox } from 'grommet';
import { 
  FaSun as Sun,
  FaMoon as Moon,
  FaCheckCircle as CheckCircle,
} from 'react-icons/fa';

import { deepMerge } from 'grommet/utils';

import { useGetWeiBalance, useEagerConnect, getNetworkName }  from './hooks/connectionFns';
import { yieldTheme } from './themes';

import YieldHeader from './components/YieldHeader';
import ConnectLayer from './components/ConnectLayer';
import AccountLayer from './components/AccountLayer';

// import metamaskImage from './assets/images/metamask.png';
// import trezorImage from './assets/images/trezor.png';
// import walletlinkImage from './assets/images/walletlink.png';
// import torusImage from './assets/images/torus.png';
// // import noConnectionImage from '../assets/images/noconnection.png';

function App() {
  const { active, activate, chainId, account, connector } = useWeb3React();
  const [balance, setBalance] = React.useState();
  const [showConnectLayer, setShowConnectLayer] = React.useState<boolean>(false);
  const [showAccountLayer, setShowAccountLayer] = React.useState<boolean>(false);
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
          <YieldHeader openConnectLayer={()=>setShowConnectLayer(true)} openAccountLayer={()=>setShowAccountLayer(true)} />
          <Main pad='large'>
            <Box
              align="center" 
              justify="center"
            >
              { showAccountLayer && <AccountLayer closeLayer={()=>setShowAccountLayer(false)} /> }
              { showConnectLayer && <ConnectLayer closeLayer={()=>setShowConnectLayer(false)} />}
              { active ? (
                <Box 
                  background='background-front'
                  // align="center"
                  // justify="center"
                  elevation="small"
                  // pad="large"
                  round
                >
                  <Header 
                    round='medium'
                    direction='column'
                    background='background-frontheader'
                    pad='medium'
                  >
                    <CheckCircle color={yieldTheme.global.colors.brand.dark} size='64' />
                    <Heading> Wallet connected.</Heading>
                  </Header>
                  <Box
                    pad="medium"
                    align="center"
                    justify="center"
                    gap='small'
                  >
                    <Text size='xsmall'>Connected to:</Text> 
                    <Text weight="bold">{chainId && getNetworkName(chainId) }</Text>
                    <Text size='xsmall'>WEI balance:</Text>
                    <Text>{ balance }</Text>
                    <Button fill='horizontal' label='Connect to another wallet' onClick={()=>setShowConnectLayer(true)} />
                  </Box>
                </Box>
              ) : (
                <Button label='Connect to a wallet' onClick={()=>setShowConnectLayer(true)} />
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
