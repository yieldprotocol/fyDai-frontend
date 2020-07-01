import React from 'react';
import * as firebase from 'firebase/app';
// import 'firebase/firestore';

import { ethers, BigNumber } from 'ethers';
// import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';
import { IYieldSeries, IUser } from '../types';

import { NotifyContext } from './NotifyContext';
import { ConnectionContext } from './ConnectionContext';

import { useCallTx, useCachedState, useBalances, useEvents } from '../hooks';

const YieldContext = React.createContext<any>({});

firebase.initializeApp({
  apiKey: 'AIzaSyATOt3mpg8B512V-6Pl_2ZqjY1WjE5q49s',
  projectId: 'yield-ydai'
});

const seriesColors = ['#726a95', '#709fb0', '#a0c1b8', '#f4ebc1', '#3f51b5', '#5677fc', '#03a9f4', '#00bcd4', '#009688', '#259b24', '#8bc34a', '#afb42b', '#ff9800', '#ff5722', '#795548', '#607d8b']; 

// reducer
function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updateDeployedSeries':
      return {
        ...state,
        deployedSeries: action.payload,
      };
    case 'updateDeployedCore':
      return {
        ...state,
        deployedCore: action.payload,
      };
    case 'updateDeployedPeripheral':
      return {
        ...state,
        deployedPeripheral: action.payload,
      };
    case 'updateDeployedExternal':
      return {
        ...state,
        deployedExternal: action.payload,
      };
    case 'updateYieldData':
      return {
        ...state,
        yieldData: action.payload,
      };
    case 'updateUserData':
      return {
        ...state,
        userData: action.payload,
      };
    case 'updateMakerData': 
      return {
        ...state,
        makerData: action.payload,
      };
    case 'isLoading':
      return { 
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const YieldProvider = ({ children }:any) => {

  const initState = {
    isLoading: true,
    // cachable
    deployedSeries : [],
    deployedCore: {},
    deployedExternal: {},
    deployedPeripheral: {},
    // transient
    yieldData: {},
    makerData: {},
    // user
    userData: {},
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const { state: { account, chainId } } = React.useContext(ConnectionContext);
  // const { account, chainId } = useWeb3React();

  const [ cachedCore, setCachedCore ] = useCachedState('deployedCore', null);
  const [ cachedExternal, setCachedExternal ] = useCachedState('deployedExternal', null);
  const [ cachedPeripheral, setCachedPeripheral ] = useCachedState('deployedPeripheral', null);
  const [ cachedSeries, setCachedSeries ] = useCachedState('deployedSeries', null);

  // TODO: maybe move this to a separate AppContext?
  const [ userPreferences, setUserPreferences ] = useCachedState('userPreferences', null);
  const [ userTxHistory, setUserTxHistory] = useCachedState('userTxHistory', null);

  const [ callTx ] = useCallTx();
  const { getEventHistory } = useEvents(); 
  const { getEthBalance, getTokenBalance }  = useBalances();

  // async get all public yield addresses from localStorage/chain
  const _getYieldAddrs = async (networkId:number|string, forceUpdate:boolean): Promise<any[]> => {
    const _deployedSeries:any[] = [];
    let _deployedCore;
    let _deployedExternal;
    let _deployedPeripheral;

    try {
      if (!cachedCore || forceUpdate) {
        // TODO firebase > chain migration
        _deployedCore = await firebase.firestore()
          .collection(networkId.toString()).doc('deployedCore').get()
          .then( doc => doc.data());
        window.localStorage.removeItem('deployedCore');
        setCachedCore(_deployedCore);
        console.log('Core contract list updated');
      } else {_deployedCore = cachedCore;}

      if (!cachedExternal || forceUpdate) {
        // TODO firebase > chain migration
        _deployedExternal = await firebase.firestore()
          .collection(networkId.toString()).doc('deployedExternal').get()
          .then( doc => doc.data());
        window.localStorage.removeItem('deployedExternal');
        setCachedExternal(_deployedExternal);
        console.log('External contract list updated');
      } else {_deployedExternal = cachedExternal;}

      if (!cachedPeripheral || forceUpdate) {
        // TODO firebase > chain migration
        _deployedPeripheral = await firebase.firestore()
          .collection(networkId.toString()).doc('deployedPeripheral').get()
          .then( doc => doc.data());
        window.localStorage.removeItem('deployedPeripheral');
        setCachedPeripheral(_deployedPeripheral);
        console.log('Peripheral contract list updated');
      } else {_deployedPeripheral = cachedPeripheral;}

      if (!cachedSeries || forceUpdate) {
        // if cache empty or forced update > get series from blockchain (or firebase)
        // TODO firebase > chain migration
        await firebase.firestore().collection(networkId.toString()).doc('deployedSeries').collection('deployedSeries')
          .get()
          .then( (querySnapshot:any) => {
            querySnapshot.forEach((doc:any) => {
              _deployedSeries.push(doc.data());
            });
          });
        window.localStorage.removeItem('deployedSeries');
        setCachedSeries(_deployedSeries);
        console.log('Series contract list updated');
      } else {_deployedSeries.push(...cachedSeries);}

    } catch (e) {
      console.log(e);
      notifyDispatch({ type: 'fatal', payload:{ message: 'Error getting Yield system addresses - Try changing network.' } } );
    }
    return [ _deployedSeries, _deployedCore, _deployedExternal, _deployedPeripheral ];
  };

  // Add extra non-cached blockchain data for each series AND PARSE data.
  const _getSeriesData = async (seriesAddrs:IYieldSeries[]): Promise<IYieldSeries[]> => {
    const _seriesData:any[] = [];
    await Promise.all(
      seriesAddrs.map( async (x:any, i:number)=> {
        _seriesData.push(x);
        try {
          _seriesData[i].yDaiBalance = account? await callTx(x.yDai, 'YDai', 'balanceOf', [account]): '0';
          _seriesData[i].isMature = await callTx(x.yDai, 'YDai', 'isMature', []);
        } catch (e) {
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    
    // Parse and return data
    return _seriesData.map((x:any, i:number) => {
      return {
        ...x,
        yDaiBalance_: ethers.utils.formatEther(x.yDaiBalance.toString()),
        maturity_: new Date( (x.maturity) * 1000 ),
        seriesColor: seriesColors[i],
      };
    });
  };

  // Non-cached yield protocol general data
  const _getYieldData = async (deployedCore:any): Promise<any> => {
    const _yieldData:any = {};
    // parse data if required.
    return {
      ..._yieldData,
    };
  };

  // Yield data for the user address
  const _getUserData = async (deployedCore:any, deployedPeripheral:any): Promise<any> => {
    const _userData:any = {};
    _userData.ethBalance = await getEthBalance();
    _userData.ethPosted = await callTx(deployedCore.Dealer, 'Dealer', 'posted', [utils.WETH, account]);
    _userData.ethTotalDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtYDai', [utils.WETH, account]);
    _userData.collateralHistory = await getEventHistory(deployedCore.Dealer, 'Dealer', 'Proxy', [], 0 );
    // _yieldData.chaiPosted = await callTx(deployedCore.Dealer, 'Dealer', 'posted', [utils.CHAI, account]);
    // _yieldData.chaiTotalDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtYDai', [utils.CHAI, account]);
    console.log(_userData.collateralHistory);

    // parse and return user data
    return {
      ..._userData,
      ethBalance_: parseFloat(ethers.utils.formatEther(_userData.ethBalance.toString())),
      ethPosted_: parseFloat(ethers.utils.formatEther(_userData.ethPosted.toString())),
      ethTotalDebtYDai_: parseFloat(ethers.utils.formatEther(_userData.ethTotalDebtYDai.toString())),
      // chaiPosted_: parseFloat(ethers.utils.formatEther(_yieldData.chaiPosted.toString())),
      // chaiTotalDebtYDai_: parseFloat(ethers.utils.formatEther(_yieldData.chaiTotalDebtYDai.toString())),
    };
  };

  // Get maker data if reqd.
  const _getMakerData = async (deployedExternal:any): Promise<any> => {
    const _pot = await callTx(deployedExternal.Pot, 'Pot', 'chi', []);
    const _ilks = await callTx(deployedExternal.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);
    const _urns = await callTx(deployedExternal.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);
    // parse and return maker data
    return { 
      ilks: {
        ..._ilks,
        Art_: utils.rayToHuman(_ilks.Art),
        spot_: utils.rayToHuman(_ilks.spot),
        rate_: utils.rayToHuman(_ilks.rate),
        line_: utils.rayToHuman(_ilks.line),
        dust_: utils.rayToHuman(_ilks.dust),
      },
      urns: {
        ..._urns,
        art_: utils.rayToHuman(_urns.art),
        ink_: utils.rayToHuman(_urns.ink),
      },
      pot: {
        ..._pot,
        chi_: _pot.chi,
      }
    };
  };

  const initApp = async (networkId:number|string) => {

    dispatch({ type:'isLoading', payload: true });
    // #1 Fetch and update PUBLIC Yield protocol ADDRESSES from cache, chain, or db.
    const [ 
      deployedSeries,
      deployedCore,
      deployedExternal,
      deployedPeripheral
    ] = await _getYieldAddrs(networkId, false);
    dispatch({ type:'updateDeployedCore', payload: deployedCore });
    dispatch({ type:'updateDeployedExternal', payload: deployedExternal });
    dispatch({ type:'updateDeployedPeripheral', payload: deployedPeripheral });

    let yieldCoreData:any={};
    let extraSeriesData:any={};
    [ yieldCoreData, extraSeriesData ] = await Promise.all([
      // #2 fetch any PUBLIC Yield protocol system data from blockchain
      _getYieldData(deployedCore),
      // #3 fetch any extra PUBLIC non-cached info for each series and PARSE series data (maturity etc.)
      _getSeriesData(deployedSeries),
    ]);
    dispatch({ type:'updateYieldData', payload: yieldCoreData });
    dispatch({ type:'updateDeployedSeries', payload: extraSeriesData });

    // #4 Fetch any user account data based on address (if any), possibly cached.
    const userData = account ? await _getUserData(deployedCore, deployedPeripheral): { ethBalance_: 0 };
    dispatch({ type:'updateUserData', payload: userData });

    // #5 Get maker data
    // const makerData = await _getMakerData(deployedSeries);
    // dispatch({ type:'updateMakerData', payload: makerData });
    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && initApp(chainId))();
  }, [chainId, account]);

  const actions = {
    updateUserData: (x:any, y:any) => _getUserData(x, y).then((res:any)=> dispatch({ type:'updateUserData', payload: res })),
    updateSeriesData: (x:IYieldSeries[]) => _getSeriesData(x).then((res:any) => dispatch({ type:'updateDeployedSeries', payload: res })),
    updateYieldBalances: (x:any) => _getYieldData(x).then((res:any)=> dispatch({ type:'updateYieldData', payload: res })),
    // refreshYieldAddrs: () => _getYieldAddrs(chainId, true),
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
