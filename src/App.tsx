import React, { useRef, useEffect, useState, useContext, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation, NavLink } from 'react-router-dom';

import { Text, Grommet, base, Grid, Main, Box, ThemeContext, ResponsiveContext, Nav, Layer, Collapsible } from 'grommet';
import { deepMerge } from 'grommet/utils';


import { yieldTheme } from './themes';

import { modColor } from './utils';

import { SeriesContext } from './contexts/SeriesContext';
import { YieldContext } from './contexts/YieldContext';

import Borrow from './containers/Borrow';
import Lend from './containers/Lend';
import Pool from './containers/Pool';
import Deposit from './containers/Deposit';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
import Authorization from './components/Authorization';
import ErrorBoundary from './components/ErrorBoundry';


import ConnectLayer from './containers/layers/ConnectLayer';
import NotifyLayer from './containers/layers/NotifyLayer';

// TODO: remove testLayer for prod
import TestLayer from './containers/layers/TestLayer';
import { useCachedState } from './hooks';
import YieldNav from './components/YieldNav';


const App = (props:any) => {
  
  const { state: { seriesLoading, activeSeries } } = useContext(SeriesContext);
  const { state: { yieldLoading } } = useContext(YieldContext);

  const [cachedLastVisit, setCachedLastVisit] = useCachedState('lastVisit', null);

  const location = useLocation();
  React.useEffect(() => {
    location?.pathname !== '/borrow/collateral/' &&
    ['borrow', 'lend', 'pool'].includes(location.pathname.split('/')[1]) &&
    setCachedLastVisit(`/${location.pathname.split('/')[1]}/${activeSeries?.maturity}` );
  }, [location]);

  const [showConnectLayer, setShowConnectLayer] = useState<string|null>(null);
  const leftSideRef = useRef<any>(null);
  
  // TODO remove for prod
  const [showTestLayer, setShowTestLayer] = useState<boolean>(false);

  const screenSize = useContext<string>(ResponsiveContext);
  const theme = useContext<any>(ThemeContext);

  const [columns, setColumns] = useState<string[]>(['10%', 'auto', '10%']);
  useEffect(()=> {
    screenSize === 'small'?
      setColumns(['0%', 'auto', '0%'])
      : setColumns(['10%', 'auto', '10%']);
  }, [screenSize]);

  return (
    <div 
      className="App" 
      style={
        ( activeSeries && props.moodLight && screenSize!=='small') ? 
          { background: `radial-gradient(at 90% 90%, transparent 75%, ${modColor(activeSeries.seriesColor, 50)})` }
          :
          undefined
      }
    >
      <ConnectLayer view={showConnectLayer} closeLayer={() => setShowConnectLayer(null)} />
      { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }

      <Grid 
        fill 
        columns={columns} 
        justify='center'
      >
        <Box background={{ color: 'background-front' }} />
        <YieldHeader
          openConnectLayer={(v:string) => setShowConnectLayer(v)}
        />
        <Box background={{ color: 'background-front' }} />
      </Grid>

      { !yieldLoading &&
        <Collapsible open={!seriesLoading} ref={leftSideRef}>
          <Authorization />
        </Collapsible>}

      <NotifyLayer target={leftSideRef.current} columnsWidth={columns} />

      { screenSize !== 'small' &&
      <Box margin={{ top:'large' }} align='center'>
        <YieldNav />
      </Box>}

      <Main 
        pad={{ bottom:'large' }}
      >      
        <Box
          pad={{ vertical: 'large' }}
          align='center'
        > 
          <Switch>
            <Route path="/borrow/collateral/:amnt?">
              <Deposit openConnectLayer={() => setShowConnectLayer('CONNECT')} />
            </Route>
            <Route path="/borrow/:series?/:amnt?">
              <Borrow openConnectLayer={() => setShowConnectLayer('CONNECT')} />
            </Route>
            <Route path="/lend/:series?/:amnt?">
              <Lend openConnectLayer={() => setShowConnectLayer('CONNECT')} />
            </Route>
            <Route path="/pool/:series?/:amnt?">
              <Pool openConnectLayer={() => setShowConnectLayer('CONNECT')} />
            </Route>
            <Route exact path="/">
              <Redirect to={`${cachedLastVisit || '/borrow/'}`} />
            </Route>
            <Route path="/*">
              404
            </Route>
          </Switch>
        </Box>               
      </Main>

      <Grid 
        fill 
        columns={columns} 
        justify='center'
      >
        <Box />
        {screenSize !== 'small' &&
          <YieldFooter
            showTestLayer={showTestLayer}
            setShowTestLayer={setShowTestLayer}
            darkMode={props.darkMode}
            setDarkMode={props.setDarkMode}
            moodLight={props.moodLight}
            toggleMoodLight={props.toggleMoodLight}
            openConnectLayer={() => setShowConnectLayer('CONNECT')}
          />}                  
        <Box />
      </Grid>
    </div>
  );
};

const WrappedApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [ moodLight, setMoodLight] = useState(false);
  return (
    <Suspense fallback={null}>
      <Grommet
        theme={deepMerge(base, yieldTheme)}
        themeMode={darkMode ? 'dark' : 'light'}
        full
      >     
        <ErrorBoundary>
          <App 
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            moodLight={moodLight}
            toggleMoodLight={()=>setMoodLight(!moodLight)}
          />
        </ErrorBoundary>
      </Grommet>
    </Suspense>
  );
};

export default WrappedApp;
