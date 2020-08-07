import React from 'react';
import { ethers } from 'ethers';
import moment from 'moment';

import * as utils from '../utils';

import { IYieldSeries, IUser } from '../types';
import { NotifyContext } from './NotifyContext';
import {
  useCallTx,
  useCachedState,
  useBalances,
  useEvents,
  useSignerAccount,
  useWeb3React,
  useMath,
  useMigrations,
} from '../hooks';

const YieldContext = React.createContext<any>({});

const seriesColors = [
  '#726a95',
  '#709fb0',
  '#a0c1b8',
  '#f4ebc1',
  '#3f51b5',
  '#5677fc',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#259b24',
  '#8bc34a',
  '#afb42b',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#607d8b',
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
  deployedSeries: [],
  deployedContracts: {},
  // transient
  feedData: {
    ilks: {
      EthA: {
        rate: null, // localStorage.getItem(feedData.ilks.EthA.rate)
        spot: null, // localStorage.getItem(feedData.ilks.EthA.spot)
      },
    },
    urns: {},
  },

  yieldData: {},
  // user centric
  userData: {},
  txHistory: {},
};

const YieldProvider = ({ children }: any) => {
  const [state, dispatch] = React.useReducer(reducer, initState);
  // const { state: { account, chainId, provider } } = React.useContext(ConnectionContext);
  const { account, provider } = useSignerAccount();
  const { chainId } = useWeb3React();

  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);

  /* cache|localStorage declarations */
  const [cachedContracts, setCachedContracts] = useCachedState('deployedContracts', null );
  const [cachedSeries, setCachedSeries] = useCachedState('deployedSeries', null);
  const [cachedFeed, setCachedFeed] = useCachedState('lastFeed', null);
  
  const [txHistory, setTxHistory] = useCachedState('txHistory', null);
  const [userPreferences, setUserPreferences] = useCachedState('userPreferences', null );

  /* hook declarations */
  const [ callTx ] = useCallTx();
  const { getEventHistory, addEventListener, parseEventList } = useEvents();
  const { getBalance } = useBalances();
  const { getAddresses } = useMigrations();
  const { yieldAPR } = useMath();

  /**
   * @dev internal fn: Get all public Yield addresses from localStorage (or chain if no cache)
   *
   * */
  const _getProtocolAddrs = async (
    networkId: number | string,
    forceUpdate: boolean
  ): Promise<any[]> => {
    const _deployedSeries: any[] = [];
    let _deployedContracts: any;
    
    const contractList = [
      'Controller',
      'Treasury',
      'Chai',
      'Dai',
      'WethJoin',
      'Vat',
      'Weth',
      'EthProxy',
      'Liquidations',
    ];

    try {
      if (!cachedContracts || forceUpdate) {

        const contractAddrs = await getAddresses(contractList);
        _deployedContracts = Object.fromEntries(contractAddrs);

        window.localStorage.removeItem('deployedContracts');
        setCachedContracts(_deployedContracts);
        console.log('Contract addresses updated:', _deployedContracts);
      } else {
        _deployedContracts = cachedContracts;
      }

      if (!cachedSeries || forceUpdate) {
        // TODO: better implementation of iterating through series (possibly a list length from contracts function?)
        const _list = await getAddresses(['yDai0', 'yDai1', 'yDai2', 'yDai3']);
        const _seriesList = Array.from(_list.values());

        await Promise.all(
          _seriesList.map(async (x: string, i: number) => {

            const name = await callTx(x, 'YDai', 'name', []);
            const maturity = (await callTx(x, 'YDai', 'maturity', [])).toNumber();

            const _peripheralAddrs = await getAddresses([ `${name}-Pool`, `${name}-DaiProxy`] );     
            const poolAddress = _peripheralAddrs.get(`${name}-Pool`);
            const daiProxyAddress = _peripheralAddrs.get(`${name}-DaiProxy`);
            
            return {
              yDaiAddress: x,
              name,
              maturity,
              poolAddress,
              daiProxyAddress,
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
      console.log(e);
      notifyDispatch({
        type: 'fatal',
        payload: { message: 'Error finding Yield Protocol addresses: Please check you are on a supported network.' },
      });
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
    // parse data if required.
    return {
      ..._yieldData,
    };
  };

  /**
   * @dev gets private, user specific Yield data
   */
  const _getUserData = async (
    _deployedContracts: any,
    _deployedSeries: any,
    forceUpdate: boolean
  ): Promise<any> => {
    const _userData: any = {};
    const _lastBlock = await provider.getBlockNumber();

    /* Get balances, posted collateral */
    _userData.ethBalance = await getBalance();
    _userData.daiBalance = await getBalance(_deployedContracts.Dai, 'Dai');
    // TODO :use controller hook
    _userData.ethPosted = await callTx(
      _deployedContracts.Controller,
      'Controller',
      'posted',
      [utils.ETH, account]
    );
    _userData.urn = await callTx(_deployedContracts.Vat, 'Vat', 'urns', [ utils.ETH, account ]);

    /* get previous approvals and settings */
    // TODO: use controller hook for this
    _userData.isEthProxyApproved = await callTx( _deployedContracts.Controller, 'Controller', 'delegated', [account, _deployedContracts.EthProxy]);

    /* Get transaction history (from cache first or rebuild if an update is forced) */
    forceUpdate && window.localStorage.removeItem('txHistory') && console.log('Re-building txHistory...');

    const postedHistory = await getEventHistory(
      _deployedContracts.Controller,
      'Controller',
      'Posted',
      [null, account, null],
      !txHistory ? 0 : txHistory.lastBlock + 1
    )
      .then((res: any) => parseEventList(res))
      .then((parsedList: any) => {     
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: x.args_[2]>0 ? 'Deposited' : 'Withdrew',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturity: null,
            amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[2] )) ),
            dai: x.args_[2],
            dai_: ethers.utils.formatEther( x.args_[2] ),
          };
        });     
      });
    
    const borrowedHistory = await getEventHistory(
      _deployedContracts.Controller,
      'Controller',
      'Borrowed',
      [],
      !txHistory ? 0 : txHistory.lastBlock + 1
    )
      .then((res: any) => parseEventList(res))
      .then((parsedList: any) => {     
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: x.args_[3]>0 ? 'Borrowed' : 'Repaid',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturity: parseInt(x.args_[1], 10),
            amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[3] )) ),
            dai: x.args_[3],
            dai_: ethers.utils.formatEther( x.args_[3] ),
          };
        });     
      });

    const poolHistory = await _deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Trade',
        [null, null, account, null, null],
        !txHistory?0:txHistory.lastBlock+1 
      )
        .then((res:any) => parseEventList(res))
        .then((parsedList: any) => {     
          return parsedList.map((x:any) => {
            return {
              ...x,
              event: x.args_[3]>0 ? 'Bought' : 'Sold',
              from: x.args[1],
              to:  x.args[2],
              autoTraded: x.args[1] !== x.args[2],
              maturity: parseInt(x.args_[0], 10),
              amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[3] )) ),
              dai: x.args[3].abs(),
              yDai: x.args[4].abs(),
              APR: yieldAPR( x.args[3].abs(),  x.args[4].abs(), parseInt(x.args_[0], 10), x.date), 
              dai_: ethers.utils.formatEther( x.args_[3] ),
              yDai_: ethers.utils.formatEther( x.args_[4] ),
            };
          }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );

    // TODO: consider if its worth adding in the admin history
    /* Admin history of secondary importance , maybe add back in later */
    // const adminHistory = await getEventHistory(
    //   _deployedContracts.Controller,
    //   'Controller',
    //   'Delegate',
    //   [account, null],
    //   !txHistory ? 0 : txHistory.lastBlock + 1
    // ).then((res: any) => parseEventList(res));

    // TODO : get blocknumber at initialisation of yDaiProtocol instead of using first block(0).
    console.log(
      'txHistory updated from block:',
      txHistory?.lastBlock + 1 || 0,
      'to block:',
      _lastBlock
    );

    const updatedHistory = [
      ...postedHistory,
      ...borrowedHistory,
      ...poolHistory,
      // ...adminHistory,
    ];

    setTxHistory({
      lastBlock: _lastBlock,
      items: txHistory
        ? [...txHistory.items, ...updatedHistory]
        : [...updatedHistory],
    });

    /* parse and return user data */
    return {
      ..._userData,
      ethBalance_: parseFloat(
        ethers.utils.formatEther(_userData.ethBalance.toString())
      ),
      daiBalance_: parseFloat(
        ethers.utils.formatEther(_userData.daiBalance.toString())
      ),
      ethPosted_: parseFloat(
        ethers.utils.formatEther(_userData.ethPosted.toString())
      ),
      txHistory: {
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

  const initContext = async (networkId: number | string) => {
    /* Init start */
    dispatch({ type: 'isLoading', payload: true });

    /* 1. Fetch PUBLIC Yield protocol ADDRESSES from cache or chain */
    const [deployedSeries, deployedContracts] = await _getProtocolAddrs(
      networkId,
      false
    );
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

    /* 4. Fetch any user data based on address (if any), possibly cached. */
    const userData = account
      ? await _getUserData(deployedContracts, deployedSeries, false)
      : null;
    dispatch({ type: 'updateUserData', payload: userData });

    // TODO: maybe split history from _getUserData
    /* 5. Fetch user history */

    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
  };

  /* Init app and re-init app on change of user and/or network  */
  React.useEffect(() => {
    chainId && (async () => initContext(chainId))();
  }, [ chainId, account ]);

  const actions = {
    updateUserData: () =>
      _getUserData(
        state.deployedContracts,
        state.deployedSeries,
        true,
      ).then((res: any) => dispatch({ type: 'updateUserData', payload: res })),
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
