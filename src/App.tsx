import React from 'react';

import { Grommet, base, Grid, Main, Box } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { yieldTheme } from './themes';

import { useWeb3React } from './hooks';

import Dashboard from './views/Dashboard';
import BorrowView from './views/BorrowView';
import LendView from './views/LendView';
import Amm from './views/Amm';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
// import YieldSidebar from './components/YieldSidebar';

import ConnectLayer from './containers/layers/ConnectLayer';
import AccountLayer from './containers/layers/AccountLayer';
import NotifyLayer from './containers/layers/NotifyLayer';
// TODO: remove testLayer for prod
import TestLayer from './containers/layers/TestLayer';

import SeriesSelector from './components/SeriesSelector';

const App = () =>  {

  // TODO: Better connection error supporting
  const { connector, library, chainId, account, activate, deactivate, active, error } = useWeb3React();

  React.useEffect(()=> {
    library && (async () => console.log(await library.getSigner()))();
  }, [account]);

  const [darkmode, setDarkmode] = React.useState(false);
  // TODO Switch out for react router
  const [activeView, setActiveView] = React.useState<string>('BORROW');

  const [showConnectLayer, setShowConnectLayer] = React.useState<boolean>(false);
  const [showAccountLayer, setShowAccountLayer] = React.useState<boolean>(false);
  const [showSeriesLayer, setShowSeriesLayer] = React.useState<boolean>(false);
  const [showTestLayer, setShowTestLayer] = React.useState<boolean>(false);

  const changeConnection = () => {
    setShowAccountLayer(false);
    setShowConnectLayer(true);
  };

  const columnsWidth = ['5%', 'auto', '5%'];

  return (
    <div className="App">
      <Grommet
        theme={deepMerge(base, yieldTheme)}
        themeMode={darkmode ? 'dark' : 'light'}
        full
      >
        <NotifyLayer />
        <ConnectLayer open={showConnectLayer} closeLayer={() => setShowConnectLayer(false)} />
        { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }
        { showSeriesLayer  && <SeriesSelector activeView='borrow' close={()=>setShowSeriesLayer(false)} /> }
        { showAccountLayer &&
          <AccountLayer
            closeLayer={() => setShowAccountLayer(false)}
            changeWallet={() => changeConnection()}
          /> }

        <Box direction="row" height={{ min: '100%' }}>
          <Box flex>
            <Grid fill rows={['auto', 'flex', 'auto']}>
              <Grid fill columns={columnsWidth}>
                <Box background={{ color: 'background-front' }} />
                <YieldHeader
                  openConnectLayer={() => setShowConnectLayer(true)}
                  openAccountLayer={() => setShowAccountLayer(true)}
                  activeView={activeView}
                  setActiveView={setActiveView}
                />
                <Box background={{ color: 'background-front' }} />
              </Grid>

              <Main pad="none" direction="row" flex>
                <Grid fill columns={columnsWidth}>
                  <Box background="background" />
                  <Box align="center">
                    {activeView === 'DASHBOARD' && <Dashboard />}
                    {activeView === 'BORROW' && (
                      <BorrowView  />
                    )}
                    {activeView === 'LEND' && (
                      <LendView  />
                    )}
                    {activeView === 'AMM' && <Amm />}
                  </Box>
                  <Box background="background" />
                </Grid>
              </Main>
              <Grid fill columns={columnsWidth}>
                <Box background="background" />
                <YieldFooter
                  showTestLayer={showTestLayer}
                  setShowTestLayer={setShowTestLayer}
                  darkmode={darkmode}
                  setDarkmode={setDarkmode}
                  changeConnection={changeConnection}
                />
                <Box background="background" />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Grommet>
    </div>
  );
};

export default App;
