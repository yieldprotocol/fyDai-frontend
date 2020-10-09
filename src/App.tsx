import React, { useRef, useEffect, useState, useContext, Suspense } from 'react';

import { Grommet, base, Grid, Main, Box, ResponsiveContext, Nav, Layer, Collapsible } from 'grommet';
import { deepMerge } from 'grommet/utils';
import { yieldTheme } from './themes';

import { SeriesContext } from './contexts/SeriesContext';
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
import Authorization from './components/Authorization';
import { modColor } from './utils';
import ErrorBoundary from './components/ErrorBoundry';

const App = (props:any) => {
  const { state: { seriesLoading, activeSeries } } = useContext(SeriesContext);
  const { state: { yieldLoading } } = useContext(YieldContext);

  // TODO Switch out for react router
  const [activeView, setActiveView] = useState<string>('BORROW');
  const [showConnectLayer, setShowConnectLayer] = useState<string|null>(null);
  const [showSeriesLayer, setShowSeriesLayer] = useState<boolean>(false);

  // TODO remove for prod
  const [showTestLayer, setShowTestLayer] = useState<boolean>(false);

  const leftSideRef = useRef<any>(null);

  const screenSize = useContext(ResponsiveContext);
  const [columnsWidth, setColumnsWidth] = useState<string[]>(['5%', 'auto', '5%']);

  useEffect(()=> {
    if (screenSize === 'small') { 
      setColumnsWidth(['0%', 'auto', '0%']);
    } else { 
      setColumnsWidth(['5%', 'auto', '5%']);
    }
  }, [screenSize]);

  return (

    <div 
      className="App" 
      style={
        ( activeSeries && props.moodLight) ? 
          { background: `radial-gradient(at 90% 90%, transparent 75%, ${modColor(activeSeries.seriesColor, 50)})`}
          :
          undefined
          // { background: 'radial-gradient(at 90% 90%, transparent 70%, #00000010)', transition: 'all 1s ease-in' }
      }
    >
      <ConnectLayer view={showConnectLayer} closeLayer={() => setShowConnectLayer(null)} />
      { showTestLayer  && <TestLayer closeLayer={()=>setShowTestLayer(false)} /> }
      { showSeriesLayer  && <SeriesSelector activeView='borrow' close={()=>setShowSeriesLayer(false)} /> }

      <Grid fill columns={columnsWidth} justify='center'>
        <Box background={{ color: 'background-front' }} />
        <YieldHeader
          openConnectLayer={(v:string) => setShowConnectLayer(v)}
          activeView={activeView}
          setActiveView={setActiveView}
        />
        <Box background={{ color: 'background-front' }} />
      </Grid>

      { !yieldLoading &&
        <Collapsible open={!seriesLoading} ref={leftSideRef}>
          <Grid fill columns={columnsWidth}>
            <Box background={{ color: '#555555' }} />
            <Authorization />
            <Box background={{ color: '#555555' }} />
          </Grid> 
        </Collapsible>}

      <NotifyLayer target={leftSideRef.current} columnsWidth={columnsWidth} />

      <Main 
        pad={{ bottom:'large' }}
      >
        <Grid columns={columnsWidth}>
          <Box />
          <Box
            pad={{ vertical: 'large' }}
            align='center'         
          >  
            {activeView === 'BORROW' && <BorrowView openConnectLayer={(v:string) => setShowConnectLayer('CONNECT')} />}
            {activeView === 'LEND' && <LendView openConnectLayer={(v:string) => setShowConnectLayer('CONNECT')} />}
            {activeView === 'POOL' && <PoolView openConnectLayer={(v:string) => setShowConnectLayer('CONNECT')} />}
          </Box>               
          <Box />
        </Grid>
      </Main>

      <Grid fill columns={columnsWidth} justify='center'>
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

const ThemedApp = () => {
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

export default ThemedApp;
