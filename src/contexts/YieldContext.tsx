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

const fyDaiList = ['20Oct9', '20Oct31', '20Dec31', '21Mar31', '21Jun30', '21Sep30', '21Dec31'];
const seriesColors = ['#ff86c8', '#82d4bb', '#6ab6f1', '#cb90c9', '#aed175', '#f0817f', '#ffbf81', '#95a4db', '#ffdc5c'];
const contractList = [
  'Controller',
  'Treasury',
  'Dai',
  'Vat',
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
    ethPrice: {},
  },
  yieldData: {},
  yieldLoading: true,
};

const YieldProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, initState);
  const { provider, fallbackProvider } = useSignerAccount();
  const { dispatch: notifyDispatch } = useContext(NotifyContext);

  /* cache|localStorage declarations */
  const [cachedContracts, setCachedContracts] = useCachedState('deployedContracts', null );
  const [cachedSeries, setCachedSeries] = useCachedState('deployedSeries', null);
  const [cachedFeed, setCachedFeed] = useCachedState('lastFeed', null);

  /* hook declarations */
  const [ callTx ] = useCallTx();
  const { addEventListener } = useEvents();
  const { getAddresses, getYieldVersion } = useMigrations();

  /**
   * @dev internal fn: Get all public Yield addresses from localStorage (or chain if no cache)
   * */
  const _getProtocolAddrs = async (
    forceUpdate: boolean
  ): Promise<any[]> => {
    const _deployedSeries: any[] = [];
    let _deployedContracts: any;

    /* Load yield core contract addresses */
    if ( !cachedContracts || forceUpdate) {
      const contractAddrs = await getAddresses(contractList);
      _deployedContracts = Object.fromEntries(contractAddrs);
      window.localStorage.removeItem('deployedContracts');
      setCachedContracts(_deployedContracts);
      // eslint-disable-next-line no-console
      console.log('Yield contract addresses updated:', _deployedContracts);
    } else {
      _deployedContracts = cachedContracts;
    }
    /* Load series specific contract addrs */
    if (!cachedSeries || (cachedSeries.length !== fyDaiList.length) || forceUpdate) {
      const _list = await getAddresses(fyDaiList.map((x:any)=> `fyDai${x}`));
      const _poolList = await getAddresses(fyDaiList.map((x:any)=> `fyDaiLP${x}`));        
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
            displayName: moment.utc(maturity * 1000).format('MMMM YYYY'),
            displayNameMobile: moment.utc(maturity * 1000).format('MMM YYYY'),
            seriesColor: seriesColors[i],
            seriesTextColor: '#333333',
            seriesLightColor: utils.modColor(seriesColors[i], 50),
            seriesDarkColor: utils.modColor(seriesColors[i], -50),
          };
        })
      ).then((res: any) => _deployedSeries.push(...res));
      window.localStorage.removeItem('deployedSeries');
      setCachedSeries(_deployedSeries);
      // eslint-disable-next-line no-console
      console.log('Series contract addresses updated', _deployedSeries);
    } else {
      _deployedSeries.push(...cachedSeries);
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
    const ethPrice = utils.mulRay(utils.toRay(1.5), (_ilks.spot));
    /* parse and return feed data if reqd. */
    const _feedData = {
      ..._state,
      ilks: {
        ..._ilks,
        spot_: utils.rayToHuman(_ilks.spot),
        rate_: utils.rayToHuman(_ilks.rate),
      },
      ethPrice,
      ethPrice_: ethers.utils.formatEther( utils.mulRay(ethers.utils.parseEther('1.5'), (_ilks.spot)).toString()),
    };
    setCachedFeed(_feedData);
    return _feedData;
  };

  /**
   * @dev get PUBLIC, non-cached, non-user specific yield protocol general data
   */
  const _getYieldData = async (_deployedContracts: any, _deployedSeries: IYieldSeries[]): Promise<any> => {
    const _yieldData: any = {};
    _yieldData.version = await getYieldVersion();
    // eslint-disable-next-line no-console
    console.log('Contract Version:', _yieldData.version);
    return {
      ..._yieldData,
    };
  };

  const _addListeners = async (_deployedContracts: any, _deployedSeries: IYieldSeries[] ) => {
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

    try {
    /* 1. Fetch PUBLIC Yield protocol ADDRESSES from cache or chain */
      const [deployedSeries, deployedContracts] = await _getProtocolAddrs(false);
      dispatch({ type: 'updateDeployedContracts', payload: deployedContracts });
      dispatch({ type: 'updateDeployedSeries', payload: deployedSeries });

      if (deployedSeries && deployedContracts) {
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
      }
    } catch (e) {
      notifyDispatch({
        type: 'notify',
        payload: { message: 'Error Accessing the Yield Protocol. Please check your network connection.' },
      });
      // eslint-disable-next-line no-console
      console.log(e);
      return;
    }
    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
  };

  /* Init app and re-init app on change of fallback provider network  */
  useEffect(() => {
    fallbackProvider && (async () => init())();
  }, [ fallbackProvider ]);

  return (
    <YieldContext.Provider value={{ state }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
