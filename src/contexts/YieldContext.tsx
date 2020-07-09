import React from 'react';
// import * as firebase from 'firebase/app';
// import 'firebase/firestore';

import { ethers, BigNumber } from 'ethers';
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
      // AMM prices mocked for now.
      amm:{
        rates: {
          1601510399: utils.toRay(0.99),
          1609459199: utils.toRay(0.98),
          1617235199: utils.toRay(0.96),
          1625097599: utils.toRay(0.93)
        },
      }
    },
    yieldData: {},

    // user and tx
    userData: {},
    txHistory:{},
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const { state: { account, chainId, provider } } = React.useContext(ConnectionContext);
  // const { account, chainId } = useWeb3React();

  /* cache|localStorage declarations */
  const [ cachedContracts, setCachedContracts ] = useCachedState('deployedContracts', null);
  const [ cachedSeries, setCachedSeries ] = useCachedState('deployedSeries', null);
  const [ cachedFeed, setCachedFeed ] = useCachedState('lastFeed', null);
  // TODO: maybe move this to a separate AppContext?
  const [ userPreferences, setUserPreferences ] = useCachedState('userPreferences', null);
  const [ txHistory, setTxHistory] = useCachedState('txHistory', null);

  const [ callTx ] = useCallTx();
  const { getEventHistory, addEventListener, parseEventList } = useEvents();
  const { getEthBalance, getTokenBalance }  = useBalances();

  // async get all public yield addresses from localStorage/chain
  const _getYieldAddrs = async (networkId:number|string, forceUpdate:boolean): Promise<any[]> => {
    const _deployedSeries:any[] = [];
    let _deployedContracts:any;

    const contractGroups = { 
      // coreList: ['Dealer', 'Treasury'],
      // externalList: ['Chai', 'Dai', 'WethJoin', 'Vat', 'Weth', 'Jug', 'Pot', 'GasToken', 'End', 'DaiJoin' ],
      // peripheralList: ['EthProxy', 'Liquidations', 'Unwind'],
      contractList: ['Dealer', 'Treasury', 'Chai', 'Dai', 'WethJoin', 'Vat', 'Weth', 'EthProxy', 'Liquidations']
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
        console.log('Series contract addresses updated');
      } else {_deployedSeries.push(...cachedSeries);}

    } catch (e) {
      console.log(e);
      notifyDispatch({ type: 'fatal', payload:{ message: 'Error Getting Yield data (addresses etc.) - Try changing network.' } } );
    }
    return [ _deployedSeries, _deployedContracts ];
  };

  // Get feed data
  const _getFeedData = async (deployedContracts:any): Promise<any> => {
    let _state:any={};
    /* For for initial loading and offline support */
    if (cachedFeed) {
      _state = cachedFeed;
    } else {
      _state = state.feedData;
    }
    const _ilks = await callTx(deployedContracts.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);

    // parse and return feed data
    const _feedData = { 
      ..._state,
      ilks: {
        ..._ilks,
        // Art_: utils.rayToHuman(_ilks.Art),
        spot_: utils.rayToHuman(_ilks.spot),
        rate_: utils.rayToHuman(_ilks.rate),
        // line_: utils.rayToHuman(_ilks.line),
        // dust_: utils.rayToHuman(_ilks.dust),
      },
    };

    setCachedFeed(_feedData);
    return _feedData;
  };

  // Fetch extra non-cached blockchain data for each series AND PARSE data.
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

  // Fetch non-cached. non-user specific yield protocol general data  (eg. market data . prices)
  const _getYieldData = async (deployedContracts:any, feedData:any): Promise<any> => {
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
    _userData.ethPosted = await callTx(deployedContracts.Dealer, 'Dealer', 'posted', [utils.WETH, account]);

    // _userData.ethTotalDebtYDai = await callTx(deployedContracts.Dealer, 'Dealer', 'totalDebtYDai', [utils.WETH, account]);
    _userData.urn = await callTx(deployedContracts.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);

    /* get transaction history (from cache first or rebuild if update forced) */
    forceUpdate && window.localStorage.removeItem('txHistory') && console.log('Re-building txHistory...');
    const _postedHistory = await getEventHistory(deployedContracts.Dealer, 'Dealer', 'Posted', [null, account, null], !txHistory?0:txHistory.lastBlock+1 )
      .then((res:any) => parseEventList(res) );
    const _borrowedHistory = await getEventHistory(deployedContracts.Dealer, 'Dealer', 'Borrowed', [], !txHistory?0:txHistory.lastBlock+1 )
      .then((res:any) => parseEventList(res) );
    // TODO add in AMM history information
    // TODO add in YDai information?

    // TODO : get blocknumber at initialisation of yDaiProtocol instead of using first block(0).
    console.log('txHistory updated from block:', txHistory?.lastBlock+1||0, 'to block:', _lastBlock);
    setTxHistory({
      lastBlock: _lastBlock,
      items: txHistory ?
        [ ...txHistory.items, ..._postedHistory, ..._borrowedHistory ]
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
        // collateralTxs: txHistory?.items.filter((x:any)=> x.event === 'Posted'),
        // seriesTxs: txHistory?.items.filter((x:any)=> x.event === 'Borrowed'),
        // redeemTxs: txHistory?.items.filter((x:any)=> x.event === 'Redeemed'),
        // adminTxs: txHistory?.items.map((x:any, i:number)=> i),
      },
      urn: {
        ..._userData.urn,
        art_: utils.rayToHuman(_userData.urn.art),
        ink_: utils.rayToHuman(_userData.urn.ink),
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
    ] = await _getYieldAddrs(networkId, false);
    dispatch({ type:'updateDeployedContracts', payload: deployedContracts });

    /* 2. Fetch feed/stream data (from cache initially if available) and init event listeners */
    const feedData = await _getFeedData(deployedContracts);
    dispatch({ type:'updateFeedData', payload: feedData });

    // 2.2 Add listen to Maker rate/spot changes
    addEventListener(
      deployedContracts.Vat,
      'Vat',
      'LogNote',
      [],
      (x:any, y:any, z:any)=> { 
        console.log(x, y, z); 
        // dispatch({ type:'updateFeedData', payload: {...feedData, feedData.ilks })
      }
    );
    // // TODO: add event listener for AMM
    // // 2.3 Add listen for AMM changes
    // addEventListener(
    //   deployedContracts.Amm,
    //   'Amm',
    //   'RateChange',
    //   [],
    //   (x:any, y:any, z:any)=> {
    // dispatch({ type:'updateFeedData', payload: {...feedData, feedData.amm })
    //   }
    // );

    /* 3. Fetch auxilliary (PUBLIC non-cached, non-user specific) yield and series data */
    let yieldData:any={};
    let extraSeriesData:any={};
    [ yieldData, extraSeriesData ] = await Promise.all([
      /* 3.1 Fetch any PUBLIC Yield protocol system data from blockchain */
      _getYieldData(deployedContracts, feedData),
      /* 3.2 Fetch any extra PUBLIC non-cached info for each series and PARSE series data
      (mostly for pre-load display...maturity etc.) */
      _getSeriesData(deployedSeries),
    ]);
    dispatch({ type:'updateYieldData', payload: yieldData });
    dispatch({ type:'updateDeployedSeries', payload: extraSeriesData });

    /* 4. Fetch any user account data based on address (if any), possibly cached. */
    const userData = account ? await _getUserData(deployedContracts, false): { ethBalance_: 0 };
    dispatch({ type:'updateUserData', payload: userData });

    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && initApp(chainId))();
  }, [chainId, account]);

  const actions = {
    updateUserData: (x:any) => _getUserData(x, true).then((res:any)=> dispatch({ type:'updateUserData', payload: res })),
    updateSeriesData: (x:IYieldSeries[]) => _getSeriesData(x).then((res:any) => dispatch({ type:'updateDeployedSeries', payload: res })),
    updateYieldBalances: (x:any) => _getYieldData(state.deployedContracts, state.feedData).then((res:any)=> dispatch({ type:'updateYieldData', payload: res })),
    // refreshYieldAddrs: () => _getYieldAddrs(chainId, true),
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
