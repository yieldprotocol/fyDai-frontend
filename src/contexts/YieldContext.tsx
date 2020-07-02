import React from 'react';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

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
    case 'updateTxHistory':
      return {
        ...state,
        txHistory: action.payload,
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
    migrationsAddr: '0xAC172aca69D11D28DFaadbdEa57B01f697b34158',
    deployedSeries : [],
    deployedCore: {},
    deployedExternal: {},
    deployedPeripheral: {},
    // transient
    yieldData: {},
    makerData: {},
    // user and tx
    userData: {},
    txHistory:{},
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const { state: { account, chainId, provider } } = React.useContext(ConnectionContext);
  // const { account, chainId } = useWeb3React();

  const [ cachedCore, setCachedCore ] = useCachedState('deployedCore', null);
  const [ cachedExternal, setCachedExternal ] = useCachedState('deployedExternal', null);
  const [ cachedPeripheral, setCachedPeripheral ] = useCachedState('deployedPeripheral', null);
  const [ cachedSeries, setCachedSeries ] = useCachedState('deployedSeries', null);

  // TODO: maybe move this to a separate AppContext?
  const [ userPreferences, setUserPreferences ] = useCachedState('userPreferences', null);
  const [ txHistory, setTxHistory] = useCachedState('txHistory', null);

  const [ callTx ] = useCallTx();
  const { getEventHistory } = useEvents(); 
  const { getEthBalance, getTokenBalance }  = useBalances();

  // async get all public yield addresses from localStorage/chain
  const _getYieldAddrs = async (networkId:number|string, forceUpdate:boolean): Promise<any[]> => {
    const _deployedSeries:any[] = [];
    let _deployedCore:any;
    let _deployedExternal:any;
    let _deployedPeripheral:any;

    // TODO: combine in to a single group? possibly
    const contractGroups = { 
      coreList: ['Dealer', 'Treasury', 'WethOracle', 'ChaiOracle'],
      externalList: ['Chai', 'Dai', 'WethJoin', 'Vat', 'Weth', 'Jug', 'Pot', 'GasToken', 'End', 'DaiJoin' ],
      peripheralList: ['EthProxy', 'Liquidations', 'Unwind'],
      // ContractList: ['Dealer', 'Treasury','Chai', 'Dai', 'WethJoin', 'Vat', 'Weth', 'EthProxy', 'Liquidations']
    };

    try {
      if (!cachedCore || forceUpdate) {
        /* // Depreciated - Firebase connection example for posterity >>
        _deployedCore_firebase = await firebase.firestore()
        .collection(networkId.toString()).doc('deployedCore').get()
        .then( doc => doc.data()); */
        const coreAddrs = await Promise.all(
          contractGroups.coreList.map(async (x:string)=>{
            return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
          })
        );
        _deployedCore = coreAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
        window.localStorage.removeItem('deployedCore');
        setCachedCore(_deployedCore);
        console.log('Core contract addresses updated:', _deployedCore);
      } else {_deployedCore = cachedCore;}

      if (!cachedExternal || forceUpdate) {
        const extAddrs = await Promise.all(
          contractGroups.externalList.map(async (x:string)=>{
            return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
          })
        );
        _deployedExternal = extAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
        window.localStorage.removeItem('deployedExternal');
        setCachedExternal(_deployedExternal);
        console.log('External contract addresses update:', _deployedExternal);
      } else {_deployedExternal = cachedExternal;}

      if (!cachedPeripheral || forceUpdate) {
        const peripheralAddrs = await Promise.all(
          contractGroups.peripheralList.map(async (x:string)=>{
            return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
          })
        );
        _deployedPeripheral = peripheralAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
        window.localStorage.removeItem('deployedPeripheral');
        setCachedPeripheral(_deployedPeripheral);
        console.log('Peripheral contract addresses updated:', _deployedPeripheral);
      } else {_deployedPeripheral = cachedPeripheral;}

      if (!cachedSeries || forceUpdate) {
        /* // Depreciated - Firebase connection example for posterity >>
        await firebase.firestore().collection(networkId.toString()).doc('deployedSeries').collection('deployedSeries')
          .get()
          .then( (querySnapshot:any) => {
            querySnapshot.forEach((doc:any) => {
              _deployedSeries.push(doc.data());
            });
          }); */
        const _seriesList = await Promise.all(
          [0, 1, 2, 3].map(async (x:number)=>{
            return callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(`yDai${x}`)]);
          })
        );
        await Promise.all(
          _seriesList.map(async (x:string)=>{
            return { 
              yDai: x,
              name: await callTx(x, 'YDai', 'name', []),
              maturity: (await callTx(x, 'YDai', 'maturity', [])).toNumber(),
              symbol: await callTx(x, 'YDai', 'symbol', []),
            };
          })
        ).then((res:any) => _deployedSeries.push(...res));

        window.localStorage.removeItem('deployedSeries');
        setCachedSeries(_deployedSeries);
        console.log('Series contract addrs updated');
      } else {_deployedSeries.push(...cachedSeries);}

    } catch (e) {
      console.log(e);
      notifyDispatch({ type: 'fatal', payload:{ message: 'Error Getting Yield data (addresses etc.) - Try changing network.' } } );
    }
    return [ _deployedSeries, _deployedCore, _deployedExternal, _deployedPeripheral ];
  };

  // Add extra non-cached blockchain data for each series AND PARSE data. (eg. )
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

  // Fetch non-cached yield protocol general data
  const _getYieldData = async (deployedCore:any): Promise<any> => {
    const _yieldData:any = {};

    // parse data if required.
    return {
      ..._yieldData,
    };
  };

  // Yield data for the user address
  const _getUserData = async (deployedCore:any, deployedPeripheral:any, forceUpdate:boolean): Promise<any> => {
    const _userData:any = {};
    const _lastBlock = await provider.getBlockNumber();

    /* get balances and posted collateral */
    _userData.ethBalance = await getEthBalance();
    _userData.ethPosted = await callTx(deployedCore.Dealer, 'Dealer', 'posted', [utils.WETH, account]);
    // _userData.ethTotalDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtYDai', [utils.WETH, account]);

    /* get transaction history (from cache first or rebuild if update forced) */
    forceUpdate && window.localStorage.removeItem('txHistory') && console.log('Re-building txHistory...');
    const _postedHistory = await getEventHistory(deployedCore.Dealer, 'Dealer', 'Posted', [null, account, null], !txHistory?0:txHistory.lastBlock+1 );
    const _borrowedHistory = await getEventHistory(deployedCore.Dealer, 'Dealer', 'Borrowed', [], !txHistory?0:txHistory.lastBlock+1 );
    // TODO add in AMM history information
    // TODO add in YDai information?

    // TODO : get blocknumber at initialisation of yDaiProtocol instead of using first block(0).
    console.log('txHistory updated from block:', txHistory?.lastBlock+1||0, 'to block:', _lastBlock);
    setTxHistory({
      lastBlock: _lastBlock, 
      items: txHistory ? [ ...txHistory.items, ..._postedHistory, ..._borrowedHistory ]
        : [ ..._postedHistory, ..._borrowedHistory ]
    });
    console.log('txHistory updated');

    /* parse and return user data */
    return {
      ..._userData,
      ethBalance_: parseFloat(ethers.utils.formatEther(_userData.ethBalance.toString())),
      ethPosted_: parseFloat(ethers.utils.formatEther(_userData.ethPosted.toString())),
      txHistory : { 
        ...txHistory,
        items: txHistory?.items,
        collateralTxs: txHistory?.items.filter((x:any)=> x.event === 'Posted'),
        seriesTxs: txHistory?.items.filter((x:any)=> x.event === 'Borrowed'),
        redeemTxs: txHistory?.items.filter((x:any)=> x.event === 'Redeemed'),
        adminTxs: txHistory?.items.map((x:any, i:number)=> i),
      },
      preferences: userPreferences,
      // ethTotalDebtYDai_: parseFloat(ethers.utils.formatEther(_userData.ethTotalDebtYDai.toString())),
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
    const userData = account ? await _getUserData(deployedCore, deployedPeripheral, false): { ethBalance_: 0 };
    dispatch({ type:'updateUserData', payload: userData });

    console.log(userData);

    // #5 Get maker data
    // const makerData = await _getMakerData(deployedSeries);
    // dispatch({ type:'updateMakerData', payload: makerData });
    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && initApp(chainId))();
  }, [chainId, account]);

  const actions = {
    updateUserData: (x:any, y:any) => _getUserData(x, y, true).then((res:any)=> dispatch({ type:'updateUserData', payload: res })),
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
