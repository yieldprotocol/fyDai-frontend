import React, { useRef, useEffect, useState, useContext, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation, NavLink } from 'react-router-dom';

import { Text, Grommet, base, Grid, Main, Box, ThemeContext, ResponsiveContext, Nav, Sidebar, Collapsible, Layer } from 'grommet';
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
import CloseDai from './containers/CloseDai';
import WithdrawEth from './containers/WithdrawEth';
import Repay from './containers/Repay';
import RemoveLiquidity from './containers/RemoveLiquidity';


const App = (props:any) => {
  
  const { state: { seriesLoading, activeSeries } } = useContext(SeriesContext);
  const { state: { yieldLoading } } = useContext(YieldContext);

  const [cachedLastVisit, setCachedLastVisit] = useCachedState('lastVisit', null);

  const location = useLocation();
  React.useEffect(() => {
    /* remember/cache the following last visited routes: */
    ['borrow', 'lend', 'pool'].includes(location.pathname.split('/')[1]) &&
    /* but, ignore these other routes */
    !['withdraw', 'repay', 'removeLiquidity', 'close'].includes(location.pathname.split('/')[1]) &&
    setCachedLastVisit(`/${location.pathname.split('/')[1]}/${activeSeries?.maturity}` );
  }, [location]);

  
  const leftSideRef = useRef<any>(null);
  

  const [showConnectLayer, setShowConnectLayer] = useState<string|null>(null);
  // TODO remove for prod
  const [showTestLayer, setShowTestLayer] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const theme = useContext<any>(ThemeContext);

  const [columns, setColumns] = useState<string[]>(['7%', 'auto', '7%']);
  useEffect(()=> {
    mobile?
      setColumns(['0%', 'auto', '0%'])
      : setColumns(['7%', 'auto', '7%']);
  }, [mobile]);

  return (
    <div 
      className="App" 
      style={
        ( activeSeries && props.moodLight && !mobile) ? 
          { background: `radial-gradient(at 90% 90%, transparent 75%, ${modColor(activeSeries.seriesColor, 50)})` }
          :
          undefined
      }
    >
      <ConnectLayer view={showConnectLayer} closeLayer={() => setShowConnectLayer(null)} />
      { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }

      <Grid
        columns={columns} 
        justify='center'
        onClick={()=>setShowSidebar(!showSidebar)}
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

      <NotifyLayer target={!mobile?leftSideRef.current:undefined} columnsWidth={columns} />

      { !mobile &&
      <Box margin='large' align='center'>
        <YieldNav />
      </Box>}

      <Main 
        pad={{ bottom:'large' }}
        align='center'
      >      
        <Switch>
          <Route path="/post/:amnt?">
            <Deposit openConnectLayer={() => setShowConnectLayer('CONNECT')} />
          </Route>
          <Route path="/withdraw/:amnt?">
            <WithdrawEth />
          </Route>

          <Route path="/borrow/:series?/:amnt?">
            <Borrow openConnectLayer={() => setShowConnectLayer('CONNECT')} />
          </Route>
  
          <Route path="/repay/:series/:amnt?">
            <Repay />
          </Route>

          <Route path="/lend/:series?/:amnt?">
            <Lend openConnectLayer={() => setShowConnectLayer('CONNECT')} />
          </Route>

          <Route path="/close/:series/:amnt?">
            <CloseDai />
          </Route>

          <Route path="/pool/:series?/:amnt?">
            <Pool openConnectLayer={() => setShowConnectLayer('CONNECT')} />
          </Route>

          <Route path="/removeLiquidity/:series/:amnt?">
            <RemoveLiquidity />
          </Route>
            
          <Route exact path="/">
            <Redirect to={`${cachedLastVisit || '/borrow/'}`} />
          </Route>
            
          <Route path="/*">
            404
          </Route>
        </Switch>              
      </Main>

      <Grid 
        fill 
        columns={columns} 
        justify='center'
      >
        <Box />
        {!mobile &&
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
