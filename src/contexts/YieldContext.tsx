import React from 'react';
import { ethers } from 'ethers';
import moment from 'moment';

import { useWeb3React } from '@web3-react/core';
import * as utils from '../utils';
import { NotifyContext } from './NotifyContext';

import { useCachedState, } from '../hooks/appHooks';
import { useCallTx } from '../hooks/chainHooks';
import { useEvents } from '../hooks/eventHooks';
import { useSignerAccount } from '../hooks/connectionHooks';

// TODO: fix these cyclic errors
import { useMigrations } from '../hooks/migrationHook';

const YieldContext = React.createContext<any>({});

const yDaiList = ['yDai0', 'yDai1', 'yDai2', 'yDai3'];
const seriesColors = ['#726a95', '#709fb0', '#a0c1b8', '#f4ebc1', '#3f51b5', '#5677fc', '#03a9f4'];
const contractList = [
  'Controller',
  'Treasury',
  'Chai',
  'Dai',
  'Vat',
  'Weth',
  'YieldProxy',
  'Liquidations',
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
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const initState = {
  isLoading: true,
  deployedSeries: [],
  deployedContracts: {},

  feedData: {
    ilks: {
      rate: null, // localStorage.getItem(feedData.ilks.EthA.rate)
      spot: null, // localStorage.getItem(feedData.ilks.EthA.spot)
    },
  },
  yieldData: {},
};

const YieldProvider = ({ children }: any) => {
  const [state, dispatch] = React.useReducer(reducer, initState);
  const { provider, fallbackProvider } = useSignerAccount();
  const { chainId } = useWeb3React('fallback');

  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);

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
   *
   * */
  const _getProtocolAddrs = async (
    forceUpdate: boolean
  ): Promise<any[]> => {
    const _deployedSeries: any[] = [];
    let _deployedContracts: any;
  
    try {
      if ( !cachedContracts || forceUpdate) {
        const contractAddrs = await getAddresses(contractList);
        _deployedContracts = Object.fromEntries(contractAddrs);
        window.localStorage.removeItem('deployedContracts');
        setCachedContracts(_deployedContracts);
        console.log('Contract addresses updated:', _deployedContracts);

      } else {
        _deployedContracts = cachedContracts;
      }

      if (!cachedSeries || (cachedSeries.length !== yDaiList.length) || forceUpdate) {
        // TODO: better implementation of iterating through series (possibly a list length from contracts function?)
        const _list = await getAddresses(yDaiList);
        const _seriesList = Array.from(_list.values());

        await Promise.all(
          _seriesList.map(async (x: string, i: number) => {
            const name = await callTx(x, 'YDai', 'name', []);
            const maturity = await callTx(x, 'YDai', 'maturity', []);
            const _peripheralAddrs = await getAddresses([ `${name}-Pool` ]);
            const poolAddress = _peripheralAddrs.get(`${name}-Pool`);
            return {
              yDaiAddress: x,
              name,
              maturity: maturity.toNumber(),
              poolAddress,
              maturity_: new Date(maturity * 1000),
              displayName: moment(maturity * 1000).format('MMMM YYYY'),
              seriesColor: seriesColors[i], 
            };
          })
        ).then((res: any) => _deployedSeries.push(...res));

        window.localStorage.removeItem('deployedSeries');
        setCachedSeries(_deployedSeries);
        console.log('Series contract addresses updated');
      } else {
        _deployedSeries.push(...cachedSeries);
      }
    } catch (e) {     
      // !loadRetried && _getProtocolAddrs(true);
      // loadRetried && 
      notifyDispatch({
        type: 'fatal',
        payload: { message: 'Error finding Yield Protocol addresses: Please check you are on a supported network.' },
      });
      console.log(e);
    }
    return [_deployedSeries, _deployedContracts];
  };

  /* Get feed data from cache first (for offline support) */
  const _getFeedData = async (
    deployedContracts: any,
    deployedSeries: any
  ): Promise<any> => {
    let _state: any = {};
    /* For for initial loading and offline support */
    if (cachedFeed) {
      _state = cachedFeed;
    } else {
      _state = state.feedData;
    }
    const _ilks = await callTx(deployedContracts.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A') ]);
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
  
  const _getYieldData = async (deployedContracts: any): Promise<any> => {
    const _yieldData: any = {};
    // _yieldData.ethPosted = await collateralPosted(deployedContracts.Controller, 'ETH-A');
    return {
      ..._yieldData,
    };
  };

  const _addListeners = async (_deployedContracts: any) => {
    // Add Maker rate/spot changes
    provider &&
      addEventListener(
        _deployedContracts.Vat,
        'Vat',
        'LogNote',
        [],
        (x: any) => {
          console.log('MAKER listener', x);
          // dispatch({ type:'updateFeedData', payload: {...feedData, feedData.ilks })
        }
      );
    // TODO: add event listener for AMM
  };

  const initContext = async () => {
    /* Init start */
    dispatch({ type: 'isLoading', payload: true });

    /* 1. Fetch PUBLIC Yield protocol ADDRESSES from cache or chain */
    const [deployedSeries, deployedContracts] = await _getProtocolAddrs(false);
    dispatch({ type: 'updateDeployedContracts', payload: deployedContracts });
    dispatch({ type: 'updateDeployedSeries', payload: deployedSeries });

    /* 2. Fetch feed/stream data (from cache initially if available) and init event listeners */
    dispatch({
      type: 'updateFeedData',
      payload: await _getFeedData(deployedContracts, deployedSeries),
    });

    // 2.1 Add event listeners
    _addListeners(deployedContracts);

    /* 3. Fetch auxilliary (PUBLIC non-cached, non-user specific) yield and series data */
    dispatch({
      type: 'updateYieldData',
      payload: await _getYieldData(deployedContracts),
    });

    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
  };

  /* Init app and re-init app on change of fallback provider network  */
  React.useEffect(() => {
    // provider && (async () => initContext() )();
    fallbackProvider && (async () => initContext() )();
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
