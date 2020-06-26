import React from 'react';
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

import { yieldTheme } from './themes';
import { useEagerConnect }  from './hooks/connectionHooks';

import Landing from './views/Landing';
import Borrow from './views/Borrow';
import Lend from './views/Lend';
import Amm from './views/Amm';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
import YieldSidebar from './components/YieldSidebar';

import ConnectLayer from './views/layers/ConnectLayer';
import AccountLayer from './views/layers/AccountLayer';
import NotifyLayer from './views/layers/NotifyLayer';
import SeriesLayer from './views/layers/SeriesLayer';

// TODO: remove testLayer for prod
import TestLayer from './views/layers/TestLayer';

import { IYieldSeries } from './types';

function App() {
  const [darkmode, setDarkmode] = React.useState(false);
  const [activeView, setActiveView] = React.useState<string>('BORROW');
  const [activeSeries, setActiveSeries] = React.useState<IYieldSeries | null>(null);

  const [loading, setLoading] = React.useState(false);

  const [showConnectLayer, setShowConnectLayer] = React.useState<boolean>(false);
  const [showAccountLayer, setShowAccountLayer] = React.useState<boolean>(false);
  const [showTestLayer, setShowTestLayer] = React.useState<boolean>(false);
  const [showSeriesLayer, setShowSeriesLayer] = React.useState<boolean>(false);

  const changeConnection = () => {
    setShowAccountLayer(false);
    setShowConnectLayer(true);
  };

  return (
    <div className="App">
      <Grommet theme={deepMerge(base, yieldTheme)} themeMode={darkmode?'dark':'light'} full>
        <NotifyLayer />
        { showAccountLayer && <AccountLayer closeLayer={()=>setShowAccountLayer(false)} changeWallet={()=>changeConnection()} /> }
        { showConnectLayer && <ConnectLayer closeLayer={()=>setShowConnectLayer(false)} />}
        { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }
        { showSeriesLayer  && <SeriesLayer setActiveSeries={setActiveSeries} closeLayer={()=>setShowSeriesLayer(false)} /> }
        <Box direction="row" height={{ min: '100%' }}>
          <Box flex>
            <Grid fill rows={['auto', 'flex', 'auto']}>
              <YieldHeader 
                openConnectLayer={()=>setShowConnectLayer(true)} 
                openAccountLayer={()=>setShowAccountLayer(true)}
                activeView={activeView}
                setActiveView={setActiveView}
              />
              <Main
                // align='center'
                // pad={{ horizontal: 'none', vertical:'none' }}
                pad='none'
                // background='background-front'
                direction='row'
                flex
              >
                <Grid fill columns={['25%', 'auto', '15%']}>
                  <YieldSidebar setShowSeriesLayer={setShowSeriesLayer} activeSeries={activeSeries} setActiveSeries={setActiveSeries} />
                  <Box align='center'>
                    {!activeSeries && <Landing />}
                    {activeSeries && activeView === 'BORROW' && <Borrow activeSeries={activeSeries} setActiveSeries={setActiveSeries} setShowSeriesLayer={setShowSeriesLayer} />}
                    {activeSeries && activeView === 'LEND' && <Lend activeSeries={activeSeries} setActiveSeries={setActiveSeries} setShowSeriesLayer={setShowSeriesLayer} />}
                    {activeSeries && activeView === 'AMM' && <Amm />}
                  </Box>
                  <Box background='background' />
                </Grid>
              </Main>

              <YieldFooter 
                showTestLayer={showTestLayer}
                setShowTestLayer={setShowTestLayer}
                darkmode={darkmode}
                setDarkmode={setDarkmode}
                changeConnection={changeConnection}
              /> 
            </Grid>
          </Box>
        </Box>
      </Grommet>
    </div>
  );
}

export default App;
