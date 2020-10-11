import React, { useRef, useEffect, useState, useContext, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation, useParams } from 'react-router-dom';
import { Grommet, base, Grid, Main, Box, ResponsiveContext, Nav, Layer, Collapsible } from 'grommet';
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

import YieldMark from './components/logos/YieldMark';

import ConnectLayer from './containers/layers/ConnectLayer';
import NotifyLayer from './containers/layers/NotifyLayer';

// TODO: remove testLayer for prod
import TestLayer from './containers/layers/TestLayer';
import { useCachedState } from './hooks';
import YieldNav from './components/YieldNav';


const App = (props:any) => {

  const { state: { seriesLoading, activeSeries }, actions: seriesActions } = useContext(SeriesContext);
  const { state: { yieldLoading } } = useContext(YieldContext);

  const [cachedLastVisit, setCachedLastVisit] = useCachedState('lastVisit', null);

  const location = useLocation();
  React.useEffect(() => {
    location && setCachedLastVisit(location.pathname);
  }, [location]);

  const [showConnectLayer, setShowConnectLayer] = useState<string|null>(null);
  
  // TODO remove for prod
  const [showTestLayer, setShowTestLayer] = useState<boolean>(false);

  const leftSideRef = useRef<any>(null);

  const screenSize = useContext(ResponsiveContext);
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
        ( activeSeries && props.moodLight) ? 
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

      <Box margin={{ top:'large' }} align='center'><YieldNav /></Box>

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
              <Redirect to={`${cachedLastVisit || '/borrow'}`} />
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

const WrappedApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [ moodLight, setMoodLight] = useState(true);

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
