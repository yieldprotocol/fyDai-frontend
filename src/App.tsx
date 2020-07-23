import React from 'react';
import { Grommet, base, Grid, Main, Box } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { yieldTheme } from './themes';
import { useEagerConnect, useInactiveListener } from './hooks/connectionHooks';

import Dashboard from './views/Dashboard';
import Borrow from './views/Borrow';
import Lend from './views/Lend';
import Amm from './views/Amm';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
import YieldSidebar from './components/YieldSidebar';

import ConnectLayer from './components/layers/ConnectLayer';
import AccountLayer from './components/layers/AccountLayer';
import NotifyLayer from './components/layers/NotifyLayer';
import SeriesSelector from './components/SeriesSelector';

// TODO: remove testLayer for prod
import TestLayer from './components/layers/TestLayer';

import { IYieldSeries } from './types';

function App() {
  const [darkmode, setDarkmode] = React.useState(false);
  const [activeView, setActiveView] = React.useState<string>('LEND');
  // const [activeSeries, setActiveSeries] = React.useState<IYieldSeries | null>(null);

  const [showConnectLayer, setShowConnectLayer] = React.useState<boolean>(false);
  const [showAccountLayer, setShowAccountLayer] = React.useState<boolean>(false);
  const [showTestLayer, setShowTestLayer] = React.useState<boolean>(false);
  const [showSeriesLayer, setShowSeriesLayer] = React.useState<boolean>(false);

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
        {showAccountLayer && (
          <AccountLayer
            closeLayer={() => setShowAccountLayer(false)}
            changeWallet={() => changeConnection()}
          />
        )}
        {showConnectLayer && (
          <ConnectLayer closeLayer={() => setShowConnectLayer(false)} />
        )}
        { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }
        { showSeriesLayer  && <SeriesSelector closeLayer={()=>setShowSeriesLayer(false)} /> }

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
                  {/* <YieldSidebar setShowSeriesLayer={setShowSeriesLayer} activeSeries={activeSeries} setActiveSeries={setActiveSeries} /> */}
                  <Box background="background" />
                  <Box align="center">
                    {activeView === 'DASHBOARD' && <Dashboard />}
                    {activeView === 'BORROW' && (
                      <Borrow setShowSeriesLayer={setShowSeriesLayer} />
                    )}
                    {activeView === 'LEND' && (
                      <Lend setShowSeriesLayer={setShowSeriesLayer} />
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
}

export default App;
