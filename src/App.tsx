import React, { useEffect, useState, useContext } from 'react';

import { Grommet, base, Grid, Main, Box, ResponsiveContext, Text, Nav, Layer, Collapsible } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { yieldTheme } from './themes';

import { SeriesContext } from './contexts/SeriesContext';
import { UserContext } from './contexts/UserContext';
import { YieldContext } from './contexts/YieldContext';

import BorrowView from './views/BorrowView';
import LendView from './views/LendView';
import PoolView from './views/PoolView';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
import SeriesSelector from './components/SeriesSelector';
import YieldMark from './components/logos/YieldMark';

import ConnectLayer from './containers/layers/ConnectLayer';
import NotifyLayer from './containers/layers/NotifyLayer';

// TODO: remove testLayer for prod
import TestLayer from './containers/layers/TestLayer';
import Splash from './components/Splash';
import RaisedBox from './components/RaisedBox';
import Authorization from './components/Authorization';

// const LendView = React.lazy(() => import('./views/LendView'));
// const PoolView = React.lazy(() => import('./views/PoolView'));
// const BorrowView = React.lazy(() => import('./views/BorrowView'));
// const Dashboard = React.lazy(() => import('./views/Dashboard'));

const ThemedApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  return (
    <Grommet
      theme={deepMerge(base, yieldTheme)}
      themeMode={darkMode ? 'dark' : 'light'}
      full
    >
      <App 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        partyMode={partyMode}
        setPartyMode={setPartyMode}
      />     
    </Grommet>
  );
};

const App = (props:any) => {

  const { state: { seriesLoading, activeSeries } } = useContext(SeriesContext);
  const { state : { authorizations : { hasDelegatedProxy } } } = useContext(UserContext);

  const { state: { yieldLoading } } = useContext(YieldContext);

  // TODO Switch out for react router
  const [activeView, setActiveView] = useState<string>('BORROW');

  const [showConnectLayer, setShowConnectLayer] = useState<string|null>(null);
  const [showSeriesLayer, setShowSeriesLayer] = useState<boolean>(false);

  // TODO remove for prod
  const [showTestLayer, setShowTestLayer] = useState<boolean>(false);

  const [appReady, setAppReady] = useState<boolean>(false);

  const screenSize = useContext(ResponsiveContext);
  const [columnsWidth, setColumnsWidth] = useState<string[]>(['5%', 'auto', '5%']);

  useEffect(()=> {
    if (screenSize === 'small') { 
      setColumnsWidth(['0%', 'auto', '0%']);
    } else {
      setColumnsWidth(['5%', 'auto', '5%']);
    }
  }, [screenSize]);

  useEffect(()=> {
    !yieldLoading && !seriesLoading && setAppReady(true);
    console.log(yieldLoading, seriesLoading);
    console.log(hasDelegatedProxy);
  }, [yieldLoading, seriesLoading, hasDelegatedProxy]);

  return (
    <div className="App">
      <NotifyLayer />
      <ConnectLayer view={showConnectLayer} closeLayer={() => setShowConnectLayer(null)} />

      { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }
      { showSeriesLayer  && <SeriesSelector activeView='borrow' close={()=>setShowSeriesLayer(false)} /> }

      <Grid fill columns={columnsWidth}>
        <Box background={{ color: 'background-front' }} />
        <YieldHeader
          openConnectLayer={(v:string) => setShowConnectLayer(v)}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        <Box background={{ color: 'background-front' }} />
      </Grid>

      { !yieldLoading &&
        <Collapsible open={!seriesLoading}>
          <Authorization />
        </Collapsible>}

      <Main 
        pad={{ bottom:'large' }} 
        direction="row" 
        flex
      >
        <Grid fill columns={columnsWidth}>
          <Box />
          <Box
            pad={{ vertical: 'large' }}
            fill="horizontal"
            align="center"
          > 
            
            {activeView === 'BORROW' && <BorrowView />}
            {activeView === 'LEND' && <LendView />}
            {activeView === 'POOL' && <PoolView />}
          </Box>               
          <Box />
        </Grid>
      </Main>

      <Grid fill columns={columnsWidth}>
        <Box />
        {screenSize !== 'small' &&
        <YieldFooter
          showTestLayer={showTestLayer}
          setShowTestLayer={setShowTestLayer}
          darkMode={props.darkMode}
          setDarkMode={props.setDarkMode}
          openConnectLayer={() => setShowConnectLayer('CONNECT')}
        />}                  
        <Box />      
      </Grid>

      {screenSize === 'small' &&    
        <Layer
          position='bottom'
          modal={false}
          responsive={false}
          full='horizontal'
        >
          <Nav 
            direction="row"
            background="background-mid"          
            round={{ corner:'top', size:'small' }}
            elevation='small'
            pad="medium"
            justify='evenly'
          >
            <Box><YieldMark /></Box>
            <Box>Collateral</Box>
            <Box>Borrow</Box>
            <Box>Repay</Box>         
          </Nav>
        </Layer>}
    </div>
  );
};

export default ThemedApp;
