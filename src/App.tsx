/* 3rd Party */
import React, { useRef, useEffect, useState, useContext, Suspense } from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import { Grommet, base, Main, Box, ResponsiveContext, Collapsible, Header, Footer } from 'grommet';
import { deepMerge } from 'grommet/utils';

/* utils and support */
import * as serviceWorker from './serviceWorker';
import { yieldTheme } from './themes';
import { modColor } from './utils';

/* contexts */
import { SeriesContext } from './contexts/SeriesContext';
import { NotifyContext } from './contexts/NotifyContext';
import { UserContext } from './contexts/UserContext';

/* hooks */
import { useCachedState } from './hooks/appHooks';

/* layers (modal-like containers) */
import ConnectLayer from './layers/ConnectLayer';
import NotifyLayer from './layers/NotifyLayer';
import TxLayer from './layers/TxLayer';

/* containers */
import Borrow from './containers/Borrow';
import Lend from './containers/Lend';
import Pool from './containers/Pool';
import Deposit from './containers/Deposit';
import CloseDai from './containers/CloseDai';
import WithdrawEth from './containers/WithdrawEth';
import Repay from './containers/Repay';
import RemoveLiquidity from './containers/RemoveLiquidity';
import RateLock from './containers/RateLock';

/* components */
import YieldHeader from './components/YieldHeader';
import YieldFooter from './components/YieldFooter';
import ErrorBoundary from './components/ErrorBoundry';
import YieldNav from './components/YieldNav';
import RaisedBox from './components/RaisedBox';

declare global {
  interface Window {
    gtag: any;
  }
}

const App = (props:any) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { seriesLoading, activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { actions: userActions } = useContext(UserContext);
  const { dispatch } = useContext(NotifyContext);
  const [ cachedLastVisit, setCachedLastVisit ] = useCachedState('lastVisit', null);
  const [ showConnectLayer, setShowConnectLayer ] = useState<string|null>(null); // TODO: move this to a general app context?
  const leftSideRef = useRef<any>(null);

  /* App route caching - update on location change */
  const location = useLocation();
  useEffect(() => {
    /* Remember the following 'LAST VISITED' routes: */
    ['borrow', 'lend', 'pool'].includes(location.pathname.split('/')[1]) &&
    /* but, ignore these other routes */
    !['withdraw', 'repay', 'removeLiquidity', 'close', 'post'].includes(location.pathname.split('/')[1]) &&
    setCachedLastVisit(`/${location.pathname.split('/')[1]}/${activeSeries?.maturity}` );
  }, [ location ]);

  /* Service Worker registraion, handle app updates and update confirmations */
  useEffect(()=>{
    const cachesToClear = ['txPending', 'lastFeed', 'lastVisit', 'deployedSeries', 'cache_chainId', 'txHistory' ];
    serviceWorker.register({ 
      onUpdate: (registration:any) => {
        // eslint-disable-next-line no-console
        console.log( 'A new version of the app is available!' );
        dispatch({ 
          type: 'updateAvailable',
          payload: {
            updateAvailable: true,
            updateAccept: ()=> {         
              registration.waiting && registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              /* clear the cache (except user Preferences) on update */
              for (const cache of cachesToClear) {
                localStorage.removeItem(cache);
              }
              window.location.reload();
            },
          },
        });
      },
      onWaiting: (registration:any) => { 
        // eslint-disable-next-line no-console
        console.log( 'A new version of the app is still available.' );
        dispatch({ 
          type: 'updateAvailable',
          payload: {
            updateAvailable: true,
            updateAccept: ()=> {
              registration.waiting && registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              /* Clear the cache (except user preferences) on update */
              for (const cache of cachesToClear) {
                localStorage.removeItem(cache);
              }
              window.location.reload();
            },  
          },
        });
      }
    });
  }, []);

  /* Handle user connectivity issues at the window level */ 
  useEffect(()=>{
    window.addEventListener('offline', () => {
      // eslint-disable-next-line no-console
      console.log('App is offline.');
      dispatch({ type:'notify', payload:{ message:'No Network', type:'error' } });
    });
    window.addEventListener('online', () => {
      dispatch({ type:'notify', payload:{ message:'Back Online', type:'success' } });
      seriesActions.updateAllSeries();
      userActions.updatePosition();
      userActions.updateAuthorizations();
    });
  }, []);

  // /* Google Analytics */
  // useEffect(() => {
  //   if (!window.GA_INITIALIZED as boolean) {
  //     initGA();
  //     window.GA_INITIALIZED = true;
  //   }
  //   logPageView();
  // }, []);

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
        <YieldHeader openConnectLayer={(view:string) => setShowConnectLayer(view)} />
      </Header>

      <ConnectLayer view={showConnectLayer} closeLayer={() => setShowConnectLayer(null)} />

      <Collapsible open={!seriesLoading} ref={leftSideRef}>
        <TxLayer />
      </Collapsible>

      <NotifyLayer target={!mobile?leftSideRef.current:undefined} />

      {!mobile && 
        <Box margin='large' align='center'>
          <YieldNav />
        </Box>}

      <Main 
        pad={{ vertical:'medium' }}
        align='center'
        flex
      >
        <Switch>
          <Route path="/post/:amnt?"> <Deposit openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route>
          <Route path="/borrow/:series?/:amnt?"> <Borrow openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route>      
          <Route path="/lend/:series?/:amnt?"> <Lend openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route>
          <Route path="/pool/:series?/:amnt?"> <Pool openConnectLayer={() => setShowConnectLayer('CONNECT')} /> </Route>
          <Route path="/ratelock/:vault?/:series?"> <RaisedBox><RateLock openConnectLayer={() => setShowConnectLayer('CONNECT')} /></RaisedBox> </Route>  
          
          <Route path="/withdraw/:amnt?"> <WithdrawEth /> </Route> 
          <Route path="/repay/:series/:amnt?"> <Repay /> </Route>
          <Route path="/close/:series/:amnt?"> <CloseDai close={()=>null} /> </Route> 
          <Route path="/removeLiquidity/:series/:amnt?"> <RemoveLiquidity /> </Route>

          <Route exact path="/"> <Redirect to={`${cachedLastVisit || '/borrow/'}`} /> </Route>
          <Route path="/*"> 404 </Route>
        </Switch>              
      </Main>

      <Footer margin={mobile? undefined: { horizontal:'xlarge' }}>
        {!mobile &&
        <YieldFooter
          themeMode={props.themeMode}
          moodLight={props.moodLight}
          openConnectLayer={() => setShowConnectLayer('CONNECT')}
        />}                  
      </Footer>
    </div>
  );
};

const WrappedApp = () => {
 
  const [ colorScheme, setColorScheme ] = useState<'light'|'dark'>('light');
  const { state: { preferences: userPreferences } } = useContext(UserContext);

  useEffect(()=>{
    if (userPreferences.themeMode === 'auto') {
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? setColorScheme('dark') : setColorScheme('light');
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const newColorScheme = e.matches ? 'dark' : 'light';
        userPreferences.themeMode === 'auto' && setColorScheme(newColorScheme);
      });
    } else {
      setColorScheme( userPreferences.themeMode );
    }
  }, [userPreferences]);

  return (
    <Suspense fallback={null}>
      <Grommet
        theme={deepMerge(base, yieldTheme)}
        themeMode={colorScheme === 'dark'? 'dark':'light' || 'light'}
        full
      >
        <ErrorBoundary>
          <App
            themeMode={userPreferences.themeMode}
            moodLight={colorScheme==='dark'? false: userPreferences.moodLight}
          />
        </ErrorBoundary>
      </Grommet>
    </Suspense>
  );
};

export default WrappedApp;
