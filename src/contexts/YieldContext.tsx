import React, { useReducer, useEffect, useContext, createContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';

import { nameFromMaturity, modColor } from '../utils';
import * as fyMath from '../utils/yieldMath';
import { IYieldSeries } from '../types';

import { addresses, contractsList, colors } from './yieldEnv.json';

import { NotifyContext } from './NotifyContext';

import { useCachedState, } from '../hooks/appHooks';
import { useCallTx } from '../hooks/chainHooks';
import { useSignerAccount } from '../hooks/connectionHooks';
// import { useMigrations } from '../hooks/migrationHook';

const YieldContext = createContext<any>({});

/**
 * Gets the addresses from the provided contract names
 * @param {string[]} contractNameList list of contract names registered.
 * @returns {Promise<Map>} keyed with contract names
 */
const getAddresses = (
  contractNameList: string[],
  chainId: number,
): { [name: string]: string; } => {
  const addrs = (addresses as any)[ chainId === 42 ? 42 : 1 ];
  const res = Object.keys(addrs).reduce((filtered: any, key) => {
    if (contractNameList.indexOf(key) !== -1) {
      // eslint-disable-next-line no-param-reassign
      filtered[key] = addrs[key];
    }
    return filtered;
  }, {});
  return res;
};

const getFyDaiNames = (
  chainId: number
): string[] => {
  const addrs = (addresses as any)[ chainId === 42 ? 42 : 1 ];
  return Object.keys(addrs).filter((x) => x.startsWith('fyDai') && x.indexOf('LP') === -1);
};

// context reducer
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
  const { fallbackProvider } = useSignerAccount();
  const { dispatch: notifyDispatch } = useContext(NotifyContext);
  let { chainId } = useWeb3React();

  /* cache|localStorage declarations */
  const [cachedSeries, setCachedSeries] = useCachedState('deployedSeries', null);
  const [cachedFeed, setCachedFeed] = useCachedState('lastFeed', null);

  /* hook declarations */
  const [ callTx ] = useCallTx();
  // const { getYieldVersion } = useMigrations();

  /**
   * @dev internal fn: Get all public Yield addresses from localStorage (or chain if no cache)
   * */
  const _getProtocolAddrs = async (
    forceUpdate: boolean
  ): Promise<any[]> => {
    const _deployedSeries: any[] = [];

    if (chainId === undefined) {
      chainId = (await fallbackProvider.getNetwork()).chainId;
    }

    /* Load/Read yield core contract addresses */
    const _deployedContracts = getAddresses(contractsList, chainId!);
    // eslint-disable-next-line no-console
    console.log('Yield contract addresses:', _deployedContracts);

    /* Load series specific contract addrs */
    const fyDaiList = getFyDaiNames( chainId! );
    if (!cachedSeries || (cachedSeries.length !== fyDaiList.length) || forceUpdate) {
      const _list = getAddresses(fyDaiList, chainId!);
      const _poolList = getAddresses(fyDaiList.map((x:any)=> `fyDaiLP${x.slice(5)}`), chainId!);
      const _seriesList = Array.from(Object.values(_list));

      // eslint-disable-next-line no-console
      console.log('Updating Series information...');
      await Promise.all(
        _seriesList.map(async (x: any, i: number) => {
          const symbol = await callTx(x, 'FYDai', 'symbol', []);
          const maturity = await callTx(x, 'FYDai', 'maturity', []);
          const poolAddress = _poolList[`${symbol.slice(0, 5)}LP${symbol.slice(5)}`]; 
          return {
            fyDaiAddress: x,
            symbol,
            maturity: maturity.toNumber(),
            poolAddress,
            displayName: nameFromMaturity(maturity),
            displayNameMobile:  nameFromMaturity(maturity, 'MMM yyyy'), 
            seriesColor: colors.seriesColors[i],
            seriesTextColor: '#222222',
            seriesLightColor: modColor(colors.seriesColors[i], 50),
            seriesDarkColor: modColor(colors.seriesColors[i], -50),
            seriesFromColor: colors.fromColors[i] || colors.seriesColors[i],
            seriesToColor: colors.seriesColors[i]
          };
        })
      ).then((res: any) => _deployedSeries.push(...res));
      window.localStorage.removeItem('deployedSeries');
      setCachedSeries(_deployedSeries);

      // eslint-disable-next-line no-console
      console.log('Series information updated:', _deployedSeries);
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
    // Note: Ray precision is used for Maker ilks.spot and ilks.rate
    const ethPriceInRay = fyMath.mulDecimal('1.5', (_ilks.spot).toString()); 
    const ethPrice = fyMath.divDecimal(ethPriceInRay, '1e27');

    /* parse and return feed data if reqd. */
    const _feedData = {
      ..._state,
      ilks: _ilks,
      ethPrice,
    };

    setCachedFeed(_feedData);
    return _feedData;
  };

  /**
   * @dev get PUBLIC, non-cached, non-user specific yield protocol general data
   */
  const _getYieldData = async (_deployedContracts: any, _deployedSeries: IYieldSeries[]): Promise<any> => {
    const _yieldData: any = {};
    _yieldData.appVersion = process.env.REACT_APP_VERSION;
    // eslint-disable-next-line no-console
    console.log('App Version:', _yieldData.appVersion, );
    return {
      ..._yieldData,
    };
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
        /* 3. Fetch auxilliary (PUBLIC non-cached, non-user specific) yield and series data */
        dispatch({
          type: 'updateYieldData',
          payload: await _getYieldData(deployedContracts, deployedSeries),
        });
      }
    } catch (e) {
      notifyDispatch({
        type: 'notify',
        payload: { message: 'Error Accessing the Yield Protocol: Network issues' },
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

  useEffect(()=>{
    const timer = setTimeout(
      () => _getFeedData(state.deployedContracts, state.deployedSeries),
      300000
    );
    return () => clearTimeout(timer);
  });

  return (
    <YieldContext.Provider value={{ state }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
