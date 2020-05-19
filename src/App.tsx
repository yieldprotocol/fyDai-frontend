import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { 
  Grommet, 
  base, 
  Tabs, 
  Tab, 
  Grid,
  Main,
  Box,
  Text 
} from 'grommet';
import { deepMerge } from 'grommet/utils';
import { yieldTheme } from './themes';

import { useGetWeiBalance, useEagerConnect }  from './hooks/connectionFns';

import Borrow from './views/Borrow';
import Lend from './views/Lend';
import Position from './views/Position';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
// import YieldTabs from './components/YieldTabs';

import ConnectLayer from './views/layers/ConnectLayer';
import AccountLayer from './views/layers/AccountLayer';
import NotifyLayer from './views/layers/NotifyLayer';
// TODO: remove testLayer for prod
import TestLayer from './views/layers/TestLayer';

import { PositionsContext } from './contexts/PositionsContext';

function App() {
  const { active, library, chainId, account } = useWeb3React();
  const [ balance, setBalance ] = React.useState();
  const [darkmode, setDarkmode] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [indexTab, setIndexTab] = React.useState<number>(0);

  const { state: posState } = React.useContext(PositionsContext);

  // TODO move to layerContext
  const [showConnectLayer, setShowConnectLayer] = React.useState<boolean>(false);
  const [showAccountLayer, setShowAccountLayer] = React.useState<boolean>(false);
  const [showTestLayer, setShowTestLayer] = React.useState<boolean>(false);

  const getWeiBalance = useGetWeiBalance();
  const eagerConnect = useEagerConnect();
  // const makerVault = useMakerVault();

  const onActiveTab = (nextIndex: any) => setIndexTab(nextIndex);

  const manageConnection = async () => {
    setLoading(true);
    if ( !active && chainId && account ) {
      console.log(library.provider);
      // const maker = await createMaker(library.providers);
      // await maker.authenticate();
      // maker && console.log(`makerConnection: ${maker.currentAddress()}`);
      await eagerConnect;
    }
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
    // (async () => activate(injected, console.log))();
    manageConnection();
    updateBalance();
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
                <Tab title={<Box pad='none' align='center'><Text weight={(indexTab===0?'bold':'normal')}>Borrow</Text></Box>}>
                  {/* <Box overflow='auto'> */}
                  <Borrow />
                  {/* </Box> */}
                </Tab>
                <Tab title={<Box pad='none' align='center'><Text weight={(indexTab===1?'bold':'normal')}>Lend</Text></Box>}>
                  <Box overflow='auto'>
                    <Lend />
                  </Box>
                </Tab>
                <Tab 
                  title={
                    <Box 
                      gap='xsmall'
                      direction='row'
                    >
                      <Text weight={(indexTab===2?'bold':'normal')}>Positions</Text>
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
                  <Box overflow='auto'>
                    <Position />
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
