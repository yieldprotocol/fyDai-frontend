import React, { useRef, useEffect, useState, useContext, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import { Grommet, base, Main, Box, ResponsiveContext, Collapsible, Header, Footer } from 'grommet';
import { deepMerge } from 'grommet/utils';

import * as serviceWorker from './serviceWorker';

import { yieldTheme } from './themes';
import { modColor } from './utils';

import { SeriesContext } from './contexts/SeriesContext';
import { YieldContext } from './contexts/YieldContext';
import { NotifyContext } from './contexts/NotifyContext';

import { useCachedState } from './hooks';

import ConnectLayer from './containers/layers/ConnectLayer';
import NotifyLayer from './containers/layers/NotifyLayer';

import Borrow from './containers/Borrow';
import Lend from './containers/Lend';
import Pool from './containers/Pool';
import Deposit from './containers/Deposit';
import CloseDai from './containers/CloseDai';
import WithdrawEth from './containers/WithdrawEth';
import Repay from './containers/Repay';
import RemoveLiquidity from './containers/RemoveLiquidity';

import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
import Authorization from './components/Authorization';
import ErrorBoundary from './components/ErrorBoundry';
import YieldNav from './components/YieldNav';

import { initGA, logPageView } from './utils/analytics';

declare global {
  interface Window {
    GA_INITIALIZED: any;
  }
}

const App = (props:any) => {
  const { state: { seriesLoading, activeSeries } } = useContext(SeriesContext);
  const { state: { yieldLoading } } = useContext(YieldContext);
  const { dispatch } = useContext(NotifyContext);
  const [ cachedLastVisit, setCachedLastVisit ] = useCachedState('lastVisit', null);

  /* App route caching */
  const location = useLocation();
  React.useEffect(() => {
    /* Remember the following last visited routes: */
    ['borrow', 'lend', 'pool'].includes(location.pathname.split('/')[1]) &&
    /* but, ignore these other routes */
    !['withdraw', 'repay', 'removeLiquidity', 'close'].includes(location.pathname.split('/')[1]) &&
    setCachedLastVisit(`/${location.pathname.split('/')[1]}/${activeSeries?.maturity}` );
  }, [location]);

  /* Serivce Worker registraion and handle app updates and user confirmations */
  useEffect(()=>{
    serviceWorker.register({ 
      onUpdate: (registration:any)=> {
        // eslint-disable-next-line no-console
        console.log( 'A new version of the app is available' );
        dispatch({ 
          type: 'updateAvailable',
          payload: { 
            updateAvailable:true,
            updateAccept: ()=> { 
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              /* Clear the cache (except user Preferences) on update - in future, save user preferences */
              localStorage.removeItem('deployedContracts');
              localStorage.removeItem('lastFeed');
              localStorage.removeItem('deployedSeries');
              localStorage.removeItem('cache_chainId');
              localStorage.removeItem('txHistory');
              window.location.reload();
            },    
          },
        });
      } 
    });
  }, []);

  /* Google Analytics */
  useEffect(() => {
    if (!window.GA_INITIALIZED as boolean) {
      initGA();
      window.GA_INITIALIZED = true;
    }
    logPageView();
  }, []);

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const leftSideRef = useRef<any>(null);
  const [showConnectLayer, setShowConnectLayer] = useState<string|null>(null);

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
      <Header margin={mobile? undefined: { horizontal:'xlarge' }}>
        <YieldHeader
          openConnectLayer={(v:string) => setShowConnectLayer(v)}
        />
      </Header>

      <ConnectLayer view={showConnectLayer} closeLayer={() => setShowConnectLayer(null)} />

      {!yieldLoading &&
        <Collapsible open={!seriesLoading} ref={leftSideRef}>
          <Authorization />
        </Collapsible>}

      <NotifyLayer target={!mobile?leftSideRef.current:undefined} />

      {!mobile && 
        <Box margin='large' align='center'>
          <YieldNav />
        </Box>}

      <Main 
        pad={{ bottom:'large' }}
        align='center'
        flex
      >      
        <Switch>
          <Route path="/post/:amnt?"> <Deposit openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route>
          <Route path="/withdraw/:amnt?"> <WithdrawEth /> </Route>
          <Route path="/borrow/:series?/:amnt?"> <Borrow openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route> 
          <Route path="/repay/:series/:amnt?"> <Repay /> </Route>
          <Route path="/lend/:series?/:amnt?"> <Lend openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route>
          <Route path="/close/:series/:amnt?"> <CloseDai /> </Route>
          <Route path="/pool/:series?/:amnt?"> <Pool openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route>
          <Route path="/removeLiquidity/:series/:amnt?"> <RemoveLiquidity /> </Route>           
          <Route exact path="/"> <Redirect to={`${cachedLastVisit || '/borrow/'}`} /> </Route>
          <Route path="/*"> 404 </Route>
        </Switch>              
      </Main>

      <Footer margin={mobile? undefined: { horizontal:'xlarge' }}>
        {!mobile &&
        <YieldFooter
          darkMode={props.darkMode}
          setDarkMode={props.setDarkMode}
          moodLight={props.moodLight}
          toggleMoodLight={props.toggleMoodLight}
          openConnectLayer={() => setShowConnectLayer('CONNECT')}
        />}                  
      </Footer>
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
