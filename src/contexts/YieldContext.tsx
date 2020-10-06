import React, { useReducer, useEffect, useContext, createContext } from 'react';
import { ethers } from 'ethers';
import moment from 'moment';
import * as utils from '../utils';
import { NotifyContext } from './NotifyContext';

import { useCachedState, } from '../hooks/appHooks';
import { useCallTx } from '../hooks/chainHooks';
import { useEvents } from '../hooks/eventHooks';
import { useSignerAccount } from '../hooks/connectionHooks';
import { useMigrations } from '../hooks/migrationHook';

import { IYieldSeries } from '../types';

const YieldContext = createContext<any>({});

const fyDaiList = ['20Oct5', '20Oct6', '20Oct9', '20Oct31', '20Dec31', '21Mar31', '21Jun30', '21Sep30', '21Dec31'];
// const fyDaiLPList = ['fyDaiLP20Oct5', 'fyDaiLP20Oct6', 'fyDaiLP20Oct9', 'fyDaiLP20Oct31', 'fyDaiLP20Dec31', 'fyDaiLP21Mar31', 'fyDaiLP21Jun30', 'fyDaiLP21Sep30', 'fyDaiLP21Dec31'];
const seriesColors = ['#ff86c8', '#82d4bb', '#6ab6f1', '#cb90c9', '#aed175', '#f0817f', '#ffbf81', '#95a4db', '#ffdc5c']; // ['#82d4bb', '#ff86c8', '#ffa3a5', '#ffbf81', '#ffdc5e', '#a2c5ac'];
const contractList = [
  'Controller',
  'Treasury',
  'Chai',
  'Dai',
  'Vat',
  'Weth',
  'YieldProxy',
];

// reducer
function reducer(state: any, action: any) {
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
    case 'isLoading':
      return {
        ...state,
        yieldLoading: action.payload,
      };
    default:
      return state;
  }
}

const initState = {
  deployedSeries: [],
  deployedContracts: {},
  feedData: {
    ilks: {
      rate: null, // localStorage.getItem(feedData.ilks.EthA.rate)
      spot: null, // localStorage.getItem(feedData.ilks.EthA.spot)
    },
  },
  yieldData: {},
  yieldLoading: true,
};

const YieldProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, initState);
  const { account, provider, fallbackProvider } = useSignerAccount();
  const { dispatch: notifyDispatch } = useContext(NotifyContext);

  /* cache|localStorage declarations */
  const [cachedContracts, setCachedContracts] = useCachedState('deployedContracts', null );
  const [cachedSeries, setCachedSeries] = useCachedState('deployedSeries', null);
  const [cachedFeed, setCachedFeed] = useCachedState('lastFeed', null);

  /* hook declarations */
  const [ callTx ] = useCallTx();
  const { addEventListener } = useEvents();
  const { getAddresses } = useMigrations();

  /**
   * @dev internal fn: Get all public Yield addresses from localStorage (or chain if no cache)
   * */
  const _getProtocolAddrs = async (
    forceUpdate: boolean
  ): Promise<any[]> => {
    const _deployedSeries: any[] = [];
    let _deployedContracts: any;
  
    try {

      /* Load yield core contract addresses */
      if ( !cachedContracts || forceUpdate) {
        const contractAddrs = await getAddresses(contractList);
        _deployedContracts = Object.fromEntries(contractAddrs);
        window.localStorage.removeItem('deployedContracts');
        setCachedContracts(_deployedContracts);
        console.log('Contract addresses updated:', _deployedContracts);
      } else {
        _deployedContracts = cachedContracts;
      }

      /* Load series specific contract addrs */
      if (!cachedSeries || (cachedSeries.length !== fyDaiList.length) || forceUpdate) {

        const _list = await getAddresses(fyDaiList.map((x:any)=> `fyDai${x}`));
        const _poolList = await getAddresses(fyDaiList.map((x:any)=> `fyDaiLP${x}`));
        // const _list = await getAddresses(fyDaiList);
        // const _poolList = await getAddresses(fyDaiLPList);

        console.log(_list);
        console.log(_poolList);
        
        const _seriesList = Array.from(_list.values());

        await Promise.all(
          _seriesList.map(async (x: string, i: number) => {

            const symbol = await callTx(x, 'FYDai', 'symbol', []);
            const maturity = await callTx(x, 'FYDai', 'maturity', []);
            const poolAddress = _poolList.get(`${symbol.slice(0, 5)}LP${symbol.slice(5)}`); 

            return {
              fyDaiAddress: x,
              symbol,
              maturity: maturity.toNumber(),
              poolAddress,
              maturity_: new Date(maturity * 1000),
              displayName: moment(maturity * 1000).format('MMMM YYYY'),
              seriesColor: seriesColors[i],
              seriesTextColor: '#333333',
              // seriesTextColor: utils.modColor(seriesColors[i], -120),
            };
          })
        ).then((res: any) => _deployedSeries.push(...res));
        window.localStorage.removeItem('deployedSeries');
        setCachedSeries(_deployedSeries);
        console.log('Series addresses updated');
      } else {
        _deployedSeries.push(...cachedSeries);
      }
    } catch (e) {     
      // !loadRetried && _getProtocolAddrs(true);
      // loadRetried && 
      notifyDispatch({
        type: 'fatal',
        payload: { message: 'Error loading Yield Protocol addresses: Please check you are on a supported network.' },
      });
      console.log(e);
    }
    return [_deployedSeries, _deployedContracts];
  };

  /* Get feed data from cache first (for offline support) */
  const _getFeedData = async (
    _deployedContracts: any,
    _deployedSeries: IYieldSeries[]
  ): Promise<any> => {
    let _state: any = {};
    /* For for initial loading and offline support */
    if (cachedFeed) {
      _state = cachedFeed;
    } else {
      _state = state.feedData;
    }
    const _ilks = await callTx(_deployedContracts.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A') ]);
    /* parse and return feed data if reqd. */
    const _feedData = {
      ..._state,
      ilks: {
        ..._ilks,
        spot_: utils.rayToHuman(_ilks.spot),
        rate_: utils.rayToHuman(_ilks.rate),
      },
    };
    setCachedFeed(_feedData);
    return _feedData;
  };

  /**
   * @dev get PUBLIC, non-cached, non-user specific yield protocol general data
   */
  const _getYieldData = async (_deployedContracts: any, _deployedSeries: IYieldSeries[]): Promise<any> => {
    const _yieldData: any = {};
    // _yieldData.ethPosted = await collateralPosted(deployedContracts.Controller, 'ETH-A');
    return {
      ..._yieldData,
    };
  };

  const _addListeners = async (_deployedContracts: any, _deployedSeries: IYieldSeries[] ) => {
    // Add Maker rate/spot changes
    provider &&
      addEventListener(
        _deployedContracts.Vat,
        'Vat',
        'LogNote',
        [],
        (x: any) => {
          console.log('MAKER listener', x);
          // dispatch({ type:'updateFeedData', payload: {...feedData, x.ilks })
        }
      );
  };

  const init = async () => {
    
    /* Init start */
    dispatch({ type: 'isLoading', payload: true });

    /* 1. Fetch PUBLIC Yield protocol ADDRESSES from cache or chain */
    const [deployedSeries, deployedContracts] = await _getProtocolAddrs(false);
    dispatch({ type: 'updateDeployedContracts', payload: deployedContracts });
    dispatch({ type: 'updateDeployedSeries', payload: deployedSeries });

    /* 2. Fetch feed/stream data (from cache initially if available) and init event listeners */
    dispatch({
      type: 'updateFeedData',
      payload: await _getFeedData(deployedContracts, deployedSeries ),
    });

    // 2.1 Add event listeners
    _addListeners(deployedContracts, deployedSeries);

    /* 3. Fetch auxilliary (PUBLIC non-cached, non-user specific) yield and series data */
    dispatch({
      type: 'updateYieldData',
      payload: await _getYieldData(deployedContracts, deployedSeries),
    });

    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
  };

  /* Init app and re-init app on change of fallback provider network  */
  useEffect(() => {
    fallbackProvider && (async () => init())();
  }, [ fallbackProvider ]);

  const actions = {
    // updateUserData: () =>
    //   _getUserData(
    //     state.deployedContracts,
    //     state.deployedSeries,
    //     true,
    //   ).then((res: any) => dispatch({ type: 'updateUserData', payload: res })),
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
