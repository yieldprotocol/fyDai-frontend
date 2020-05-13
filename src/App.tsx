import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Anchor, Grommet, DropButton, base, Tabs, Tab, Grid, Main, Footer, Button, Box, Text } from 'grommet';
import { 
  FaSun as Sun,
  FaMoon as Moon,
  FaCheckCircle as CheckCircle,
  FaGithub as Github,
  FaInfo as Info,
  FaFileAlt as Docs,
  FaVial as Test,
  FaCaretDown as CaretDown,
} from 'react-icons/fa';

import { deepMerge } from 'grommet/utils';

import { useGetWeiBalance, useEagerConnect, getNetworkName }  from './hooks/connectionFns';
import { yieldTheme } from './themes';

import Borrow from './views/Borrow';
import Lend from './views/Lend';
import Position from './views/Position';
import TestLayer from './views/TestLayer';

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

  const [showTestLayer, setShowTestLayer] = React.useState<boolean>(false);

  const [darkmode, setDarkmode] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const getWeiBalance = useGetWeiBalance();
  const eagerConnect = useEagerConnect();

  const [indexTab, setIndexTab] = React.useState<number>(1);
  const onActiveTab = (nextIndex: any) => setIndexTab(nextIndex);

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

  const changeConnection = () => {
    setShowAccountLayer(false);
    setShowConnectLayer(true);
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
          { showAccountLayer && <AccountLayer closeLayer={()=>setShowAccountLayer(false)} changeWallet={()=>changeConnection()} /> }
          { showConnectLayer && <ConnectLayer closeLayer={()=>setShowConnectLayer(false)} />}
          { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }

          <YieldHeader openConnectLayer={()=>setShowConnectLayer(true)} openAccountLayer={()=>setShowAccountLayer(true)} />
          
          <Main
            align='center'
            pad={{ horizontal: 'none', vertical:'small' }}
          >

            <Box 
              fill='horizontal'
              justify='end'
              direction='row'
              pad={{ horizontal:'medium', vertical:'none' }}
              style={{ maxWidth:'600px', minWidth:'300px' }}
            > 
              <Box pad='small' direction='row' gap='small' align='baseline'>
                <Box>
                  <Text>Market:</Text>
                </Box>
                <DropButton
                  color='background-front'
                  label={<Box pad='xsmall' direction='row' gap='xsmall' align='center'>yDai <CaretDown /></Box>}
                  dropAlign={{ top: 'bottom', right: 'right' }}
                  dropContent={
                    <Box pad="medium" background="light-2">
                      <Text size='xsmall'>More markets coming soon!</Text> 
                    </Box>
                  }
                />
              </Box>
            </Box>

            <Box
              pad={{ horizontal:'medium', vertical:'none' }}
              style={{ maxWidth:'600px', minWidth:'300px' }}
              round='medium'
              fill
            >
              <Tabs 
                justify='start'
                flex={true}
                activeIndex={indexTab}
                onActive={onActiveTab}
              >
                <Tab title={<Box pad='none' align='center'><Text weight={(indexTab===0?'bold':'normal')}>Borrow</Text></Box>}>
                  <Borrow />
                </Tab>
                <Tab title={<Box pad='none' align='center'><Text weight={(indexTab===1?'bold':'normal')}>Lend</Text></Box>}>
                  <Lend />
                </Tab>
                <Tab title={<Box pad='none' align='center'><Text weight={(indexTab===2?'bold':'normal')}>Position</Text></Box>}>
                  <Position />
                </Tab>
              </Tabs>
            </Box>
          </Main>
          <Footer
            gap="xlarge"
            fill='horizontal'
            pad={{ horizontal: 'large', vertical:'medium' }}
          >
            <Box direction='row' gap='small'>
              <Anchor color='background-frontheader'><Github /></Anchor>
              <Anchor color='background-frontheader'><Docs /></Anchor>
              <Anchor color='background-frontheader'><Info /></Anchor>
            </Box>
            <Box>
              { !active && <Button style={{ minWidth:'160px' }} label='Connect to a wallet' onClick={()=>changeConnection()} />}
            </Box>
            <Box direction='row' gap='medium'>
              <Test onClick={()=>setShowTestLayer(!showTestLayer)} color={showTestLayer?yieldTheme.global.colors.brand.light:'grey'} /> 
              <Box direction='row'>
                {darkmode? 
                  <Sun onClick={()=>setDarkmode(!darkmode)} color={yieldTheme.global.colors.brand.light} />
                  :
                  <Moon onClick={()=>setDarkmode(!darkmode)} />}
              </Box>
            </Box>
          </Footer>
        </Grid>
      </Grommet>
    </div>
  );
}

export default App;
