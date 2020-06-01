import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { 
  Grommet, 
  base, 
  Tabs, 
  Tab, 
  Grid,
  Main,
  Heading,
  Box,
  Text 
} from 'grommet';
import { deepMerge } from 'grommet/utils';

import { FaSeedling as YieldLeaf } from 'react-icons/fa';

import { yieldTheme } from './themes';

import { useEagerConnect }  from './hooks/connectionFns';

import Series from './views/Series';
import Positions from './views/Positions';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
// import YieldTabs from './components/YieldTabs';

import ConnectLayer from './components/layers/ConnectLayer';
import AccountLayer from './components/layers/AccountLayer';
import NotifyLayer from './components/layers/NotifyLayer';
// TODO: remove testLayer for prod
import TestLayer from './components/layers/TestLayer';

import { PositionsContext } from './contexts/PositionsContext';

function App() {
  const { active, library, chainId, account } = useWeb3React();
  const [darkmode, setDarkmode] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [indexTab, setIndexTab] = React.useState<number>(0);

  const { state: posState } = React.useContext(PositionsContext);

  // TODO move to layerContext
  const [showConnectLayer, setShowConnectLayer] = React.useState<boolean>(false);
  const [showAccountLayer, setShowAccountLayer] = React.useState<boolean>(false);
  const [showTestLayer, setShowTestLayer] = React.useState<boolean>(true);

  const eagerConnect = useEagerConnect();
  // const makerVault = useMakerVault();

  const onActiveTab = (nextIndex: any) => setIndexTab(nextIndex);

  const manageConnection = async () => {
    setLoading(true);
    if ( !active && chainId && account ) {
      await eagerConnect;
      // const maker = await createMaker(library.providers);
      // await maker.authenticate();
      // maker && console.log(`makerConnection: ${maker.currentAddress()}`);
    }
    setLoading(false);
  };

  const changeConnection = () => {
    setShowAccountLayer(false);
    setShowConnectLayer(true);
  };

  React.useEffect(() => {
    // (async () => activate(injected, console.log))();
    manageConnection();
  }, [ active, account, chainId ]);

  return (
    <div className="App">
      <Grommet theme={deepMerge(base, yieldTheme)} themeMode={darkmode?'dark':'light'} full>
        <Grid fill rows={['auto', 'flex', 'auto']}>
          <NotifyLayer />
          { showAccountLayer && <AccountLayer closeLayer={()=>setShowAccountLayer(false)} changeWallet={()=>changeConnection()} /> }
          { showConnectLayer && <ConnectLayer closeLayer={()=>setShowConnectLayer(false)} />}
          { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }
          <YieldHeader 
            openConnectLayer={()=>setShowConnectLayer(true)} 
            openAccountLayer={()=>setShowAccountLayer(true)}
          />
          <Main
            align='center'
            pad={{ horizontal: 'none', vertical:'none' }}
          >
            {/* <Box 
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
            </Box> */}
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
                <Tab 
                  title={
                    <Box pad='none' align='center' >
                      <Text size='small' weight={indexTab===0?'bold':'normal'}>Current Series</Text>
                    </Box>
                  }
                >
                  <Series />
                </Tab>
                <Tab
                  title={
                    <Box 
                      gap='xsmall'
                      direction='row'
                    >
                      <Text size='small' weight={indexTab===1?'bold':'normal'}>Positions</Text>
                      {/* <Heading margin='none' level='6'>Positions</Heading> */}
                      { posState.positionsIndicator > 0 &&
                        <Box
                          background="brand"
                          pad={{ horizontal: 'small', vertical:'none' }}
                          align='center'
                          round
                        >
                          <Text>{posState.positionsIndicator}</Text>
                        </Box>}
                    </Box>
                  }
                >
                  <Positions />
                </Tab>
                <Tab
                  disabled
                  title={
                    <Box
                      gap='xsmall'
                      direction='row'
                    >
                      <YieldLeaf /><Text margin='none' weight={(indexTab===2?'bold':'normal')}>Yield Market</Text>
                    </Box>
                  }
                >
                  <Box 
                    pad="medium" 
                    border={{ side:'all', color:'lightgreen' }}
                    round
                    gap='large'
                  >  Market 
                  </Box>
                </Tab>

              </Tabs>
            </Box>
          </Main>
          <YieldFooter 
            showTestLayer={showTestLayer}
            setShowTestLayer={setShowTestLayer}
            darkmode={darkmode}
            setDarkmode={setDarkmode}
            changeConnection={changeConnection}
          /> 
        </Grid>
      </Grommet>
    </div>
  );
}

export default App;
