import React from 'react';
import { ethers, BigNumber } from 'ethers';
import Moment from 'moment';
// import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';

import { IYieldSeries, IUser } from '../types';
import { NotifyContext } from './NotifyContext';
import { ConnectionContext } from './ConnectionContext';

import { useCallTx, useCachedState, useBalances, useEvents } from '../hooks';

const YieldContext = React.createContext<any>({});

const seriesColors = ['#726a95', '#709fb0', '#a0c1b8', '#f4ebc1', '#3f51b5', '#5677fc', '#03a9f4', '#00bcd4', '#009688', '#259b24', '#8bc34a', '#afb42b', '#ff9800', '#ff5722', '#795548', '#607d8b']; 

// reducer
function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updateDeployedSeries':
      return {
        ...state,
        deployedSeries: action.payload,
      };
    case 'updateDeployedContracts':
      return {
        ...state,
        deployedContracts: action.payload,
      };
    case 'updateFeedData':
      return {
        ...state,
        feedData: action.payload,
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
    case 'isLoading':
      return { 
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const initState = {
  isLoading: true,
  // cachable
  migrationsAddr: '0xAC172aca69D11D28DFaadbdEa57B01f697b34158', // testnets: '0x5632d2e2AEdf760F13d0531B18A39782ce9c814F'
  deployedSeries : [],
  deployedContracts: {},
  // transient
  feedData: {
    ilks:{
      EthA: {
        rate: null, // localStorage.getItem(feedData.ilks.EthA.rate)
        spot: null, // localStorage.getItem(feedData.ilks.EthA.spot)
      },
    },
    urns: {},
    // AMM rates mocked for now.
    amm:{
      rates: {
        1601510399: utils.toRay(0.98),
        1609459199: utils.toRay(0.96),
        1617235199: utils.toRay(0.93),
        1625097599: utils.toRay(0.89)
      },
    }
  },
  yieldData: {},
  // user centric
  userData: {},
  txHistory:{},
};

const YieldProvider = ({ children }:any) => {

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: { account, chainId, provider } } = React.useContext(ConnectionContext);
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);

  /* cache|localStorage declarations */
  const [ cachedContracts, setCachedContracts ] = useCachedState('deployedContracts', null);
  const [ cachedSeries, setCachedSeries ] = useCachedState('deployedSeries', null);
  const [ cachedFeed, setCachedFeed ] = useCachedState('lastFeed', null);

  const [ txHistory, setTxHistory] = useCachedState('txHistory', null);
  const [ userPreferences, setUserPreferences ] = useCachedState('userPreferences', null);

  /* hook declarations */
  const [ callTx ] = useCallTx();
  const { getEventHistory, addEventListener, parseEventList } = useEvents();
  const { getEthBalance, getTokenBalance }  = useBalances();

  /* internal fn: async get all public Yield addresses from localStorage (or chain if no cache) */
  const _getProtocolAddrs = async (networkId:number|string, forceUpdate:boolean): Promise<any[]> => {

    const _deployedSeries:any[] = [];
    let _deployedContracts:any;
    const contractGroups = {
      contractList: [
        'Controller',
        'Treasury',
        'Chai',
        'Dai',
        'WethJoin',
        'Vat',
        'Weth',
        'EthProxy',
        'Liquidations'
      ]
    };

    try {
      if (!cachedContracts || forceUpdate) {
        const contractAddrs = await Promise.all(
          contractGroups.contractList.map(async (x:string)=>{
            return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
          })
        );
        _deployedContracts = contractAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
        window.localStorage.removeItem('deployedContracts');
        setCachedContracts(_deployedContracts);
        console.log('Contract addresses updated:', _deployedContracts);
      } else {_deployedContracts = cachedContracts;}

      if (!cachedSeries || forceUpdate) {
        /* // Depreciated - Firebase connection example, here for posterity >>
        await firebase.firestore().collection(networkId.toString()).doc('deployedSeries').collection('deployedSeries')
          .get()
          .then( (querySnapshot:any) => {
            querySnapshot.forEach((doc:any) => {
              _deployedSeries.push(doc.data());
            });
          }); */

        // TODO: better implementation of iterating through series (possibly a list length from contracts function?)
        const _seriesList = await Promise.all(
          [0, 1, 2, 3].map(async (x:number)=>{
            return callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(`yDai${x}`)]);
          })
        );
        await Promise.all(
          _seriesList.map(async (x:string, i:number)=>{
            const market = await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(`Market-yDai${i+1}`)]);
            const name = await callTx(x, 'YDai', 'name', []);
            const maturity = (await callTx(x, 'YDai', 'maturity', [])).toNumber();
            return {
              yDai: x,
              name,
              maturity,
              market,
              // symbol: await callTx(x, 'YDai', 'symbol', []),
              maturity_: new Date( (maturity) * 1000 ),
              displayName: Moment(maturity*1000).format('MMMM YYYY'),
              seriesColor: seriesColors[i],
            };
          })
        ).then((res:any) => _deployedSeries.push(...res));

        window.localStorage.removeItem('deployedSeries');
        setCachedSeries(_deployedSeries);
        console.log('Series contract addresses updated');
      } else {_deployedSeries.push(...cachedSeries);}

    } catch (e) {
      console.log(e);
      notifyDispatch({ type: 'fatal', payload:{ message: 'Error finding Yield Protocol addresses' } } );
    }
    return [ _deployedSeries, _deployedContracts ];
  };

  /* Get feed data from cache first (for offline support) */
  const _getFeedData = async (deployedContracts:any): Promise<any> => {
    let _state:any={};
    /* For for initial loading and offline support */
    if (cachedFeed) {
      _state = cachedFeed;
    } else {
      _state = state.feedData;
    }
    const _ilks = await callTx(deployedContracts.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);

    /* parse and return feed data if reqd. */
    const _feedData = { 
      ..._state,
      ilks: {
        ..._ilks,
        // spot_: utils.rayToHuman(_ilks.spot),
        // rate_: utils.rayToHuman(_ilks.rate),
      },
    };
    setCachedFeed(_feedData);
    return _feedData;
  };

  /* Fetch non-cached. non-user specific yield protocol general data  (eg. market data . prices) */
  const _getYieldData = async (deployedContracts:any): Promise<any> => {
    const _yieldData:any = {
    };
    // parse data if required.
    return {
      ..._yieldData,
    };
  };

  // Yield Data for the User Address
  const _getUserData = async (deployedContracts:any, forceUpdate:boolean): Promise<any> => {
    const _userData:any = {};
    const _lastBlock = await provider.getBlockNumber();

    /* get balances and posted collateral */
    _userData.ethBalance = await getEthBalance();
    _userData.ethPosted = await callTx(deployedContracts.Controller, 'Controller', 'posted', [utils.ETH, account]);

    // _userData.ethTotalDebtYDai = await callTx(deployedContracts.Controller, 'Controller', 'totalDebtYDai', [utils.ETH-A, account]);
    _userData.urn = await callTx(deployedContracts.Vat, 'Vat', 'urns', [utils.ETH, account ]);

    /* get transaction history (from cache first or rebuild if update forced) */
    forceUpdate && window.localStorage.removeItem('txHistory') && console.log('Re-building txHistory...');
    const _postedHistory = await getEventHistory(deployedContracts.Controller, 'Controller', 'Posted', [null, account, null], !txHistory?0:txHistory.lastBlock+1 )
      .then((res:any) => parseEventList(res) );
    const _borrowedHistory = await getEventHistory(deployedContracts.Controller, 'Controller', 'Borrowed', [], !txHistory?0:txHistory.lastBlock+1 )
      .then((res:any) => parseEventList(res) );

    // TODO add in AMM history collection
    // TODO add in YDai information?
    const _adminHistory = await getEventHistory(deployedContracts.Controller, 'Controller', 'Delegate', [account, null], !txHistory?0:txHistory.lastBlock+1 )
      .then((res:any) => parseEventList(res) );

    // TODO : get blocknumber at initialisation of yDaiProtocol instead of using first block(0).
    console.log('txHistory updated from block:', txHistory?.lastBlock+1 || 0, 'to block:', _lastBlock);

    setTxHistory({
      lastBlock: _lastBlock,
      items: txHistory ?
        [ ...txHistory.items, ..._postedHistory, ..._borrowedHistory, ..._adminHistory ]
        : [ ..._postedHistory, ..._borrowedHistory, ..._adminHistory ]
    });

    /* parse and return user data */
    return {
      ..._userData,
      ethBalance_: parseFloat(ethers.utils.formatEther(_userData.ethBalance.toString())),
      ethPosted_: parseFloat(ethers.utils.formatEther(_userData.ethPosted.toString())),
      txHistory : {
        ...txHistory,
        items: txHistory?.items,
      },
      urn: {
        ..._userData.urn,
        // art_: utils.rayToHuman(_userData.urn.art),
        // ink_: utils.rayToHuman(_userData.urn.ink),
      },
      preferences: userPreferences,
    };
  };

  const initApp = async (networkId:number|string) => {

    dispatch({ type:'isLoading', payload: true });
    /* 1. Fetch PUBLIC Yield protocol ADDRESSES from cache or chain */
    const [ 
      deployedSeries,
      deployedContracts
    ] = await _getProtocolAddrs(networkId, false);
    dispatch({ type:'updateDeployedContracts', payload: deployedContracts });
    dispatch({ type:'updateDeployedSeries', payload: deployedSeries });

    /* 2. Fetch feed/stream data (from cache initially if available) and init event listeners */
    dispatch({ type:'updateFeedData', payload: await _getFeedData(deployedContracts) });
    // 2.1 Add listen to Maker rate/spot changes
    provider && addEventListener(
      deployedContracts.Vat,
      'Vat',
      'LogNote',
      [],
      (x:any, y:any, z:any)=> { 
        console.log(x, y, z); 
        // dispatch({ type:'updateFeedData', payload: {...feedData, feedData.ilks })
      }
    );
    // TODO: add event listener for AMM
    /* 3. Fetch auxilliary (PUBLIC non-cached, non-user specific) yield and series data */
    dispatch({ type:'updateYieldData', payload: await _getYieldData(deployedContracts) });

    /* 4. Fetch any user data based on address (if any), possibly cached. */
    const userData = account ? await _getUserData(deployedContracts, false): null;
    dispatch({ type:'updateUserData', payload: userData });
    dispatch({ type:'isLoading', payload: false });
  };

  /* Init app and re-init app on change of user and/or network  */
  React.useEffect( () => {
    ( async () => chainId && initApp(chainId))();
  }, [chainId, account]);



  const actions = {
    updateUserData: () => _getUserData(state.deployedContracts, false).then((res:any)=> dispatch({ type:'updateUserData', payload: res })),
    // updateSeriesData: (x:IYieldSeries[]) => _getSeriesData(x).then((res:any) => dispatch({ type:'updateDeployedSeries', payload: res })),
    // updateYieldBalances: (x:any) => _getYieldData(state.deployedContracts, state.feedData).then((res:any)=> dispatch({ type:'updateYieldData', payload: res })),
    // refreshYieldAddrs: () => _getYieldAddrs(chainId, true),
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
