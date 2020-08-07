import React from 'react';
import { ethers } from 'ethers';
import moment from 'moment';

import * as utils from '../utils';

import { NotifyContext } from './NotifyContext';
import { YieldContext } from './YieldContext';

import {
  useCallTx,
  useCachedState,
  useBalances,
  useEvents,
  useSignerAccount,
  useWeb3React,
  useMath,
  useController,
  useMigrations,
} from '../hooks';

const UserContext = React.createContext<any>({});

// reducer
function reducer(state: any, action: any) {
  switch (action.type) {

    case 'updatePreferences':
      return {
        ...state,
        preferences: action.payload,
      };
    case 'updateBalances':
      return {
        ...state,
        balances: action.payload,
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

const initState = {
  isLoading: true,
  balances: {},
  txHistory: {
    lastBlock: 0, 
    items:{}
  },
  preferences:{},
  makerData:{},
};

const UserProvider = ({ children }: any) => {

  const [ state, dispatch ] = React.useReducer(reducer, initState);

  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const { state: yieldState } = React.useContext(YieldContext);
  const { deployedContracts, deployedSeries } = yieldState;

  const { account, provider } = useSignerAccount();
  const { chainId } = useWeb3React();

  /* cache|localStorage declarations */
  const [txHistory, setTxHistory] = useCachedState('txHistory-new', null);
  const [preferences, setPreferences] = useCachedState('userPreferences', null );
  
  /* hook declarations */
  const [ callTx ] = useCallTx();
  const { getEventHistory, addEventListener, parseEventList } = useEvents();
  const { getBalance } = useBalances();
  const { collateralPosted } = useController();
  const { yieldAPR } = useMath();

  /**
   * @dev gets user balances from required tokens,and ETH native.
   */
  const _getBalances = async () => {

    const _balances: any = {};

    /* Get balances and posted collateral */
    _balances.ethBalance = await getBalance();
    _balances.daiBalance = await getBalance(deployedContracts.Dai, 'Dai');
    _balances.ethPosted = await collateralPosted(deployedContracts.Controller, 'ETH-A');   
    // _user.ethPosted = await callTx(
    //   deployedContracts.Controller,
    //   'Controller',
    //   'posted',
    //   [utils.ETH, account]
    // );

    // TODO test the promises below.
    await Promise.all([
      (_balances.ethBalance = await getBalance()), 
      (_balances.daiBalance = await getBalance(deployedContracts.Dai, 'Dai')), 
      (_balances.ethPosted = await collateralPosted(deployedContracts.Controller, 'ETH-A')),
    ]);
    
    /* parse to human usable */
    _balances.ethBalance_ = parseFloat(
      ethers.utils.formatEther(_balances.ethBalance.toString())
    );
    _balances.daiBalance_ = parseFloat(
      ethers.utils.formatEther(_balances.daiBalance.toString())
    );
    _balances.ethPosted_ = parseFloat(
      ethers.utils.formatEther(_balances.ethPosted.toString())
    );

    dispatch({ type: 'updateBalances', payload: _balances });
  };


  /**
   * @dev gets user balances from required tokens,and ETH native.
   */
  const _getTxHistory = async ( forceUpdate:boolean=false ) => {

    const _lastBlock = await provider.getBlockNumber();

    /* Get transaction history (from cache first or rebuild if an update is forced) */
    forceUpdate && window.localStorage.removeItem('txHistory') && console.log('Re-building txHistory...');

    const postedHistory = await getEventHistory(
      deployedContracts.Controller,
      'Controller',
      'Posted',
      [null, account, null],
      !txHistory ? 0 : txHistory.lastBlock + 1
    )
      .then((res: any) => parseEventList(res))       /* then parse returned values */
      .then((parsedList: any) => {                   /* then add extra info and calculated values */
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
      deployedContracts.Controller,
      'Controller',
      'Borrowed',
      [],
      !txHistory ? 0 : txHistory.lastBlock + 1
    )
      .then((res: any) => parseEventList(res))        /* then parse returned values */
      .then((parsedList: any) => {                    /* then add extra info and calculated values */
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
    
    const poolHistory = await deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Trade',
        [null, null, account, null, null],
        !txHistory?0:txHistory.lastBlock+1 
      )
        .then((res:any) => parseEventList(res))     /* then parse returned values */
        .then((parsedList: any) => {                /* then add extra info and calculated values */
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
    ];

    const _payload = {
      lastBlock: _lastBlock,
      items: txHistory ? [...txHistory.items, ...updatedHistory] : [...updatedHistory]
    };

    setTxHistory(_payload);
    dispatch({ type: 'updateTxHistory', payload: _payload });
    
  };

  /**
   * @dev gets user balances from required tokens,and ETH native.
   */
  const _getMakerData = async () => {
    const urn = await callTx(deployedContracts.Vat, 'Vat', 'urns', [ utils.ETH, account ]);
  };

  /**
   * @dev gets user balances from required tokens,and ETH native.
   */
  const _getPreferences = async () => {
    console.log('dont forget to add in the preferences' );
    // TODO: use controller hook for this
    const isEthProxyApproved = await callTx( deployedContracts.Controller, 'Controller', 'delegated', [account, deployedContracts.EthProxy]);
  };

  // /**
  //  * @dev gets user balances from required tokens,and ETH native.
  //  */
  // const _getUserData = async (
  //   _deployedContracts: any,
  //   _deployedSeries: any,
  //   forceUpdate: boolean
  // ): Promise<any> => {
  //   const _userData: any = {};

  //   /* parse and return user data */
  //   return {
  //     ..._userData,
  //     ethBalance_: parseFloat(
  //       ethers.utils.formatEther(_userData.ethBalance.toString())
  //     ),
  //     daiBalance_: parseFloat(
  //       ethers.utils.formatEther(_userData.daiBalance.toString())
  //     ),
  //     ethPosted_: parseFloat(
  //       ethers.utils.formatEther(_userData.ethPosted.toString())
  //     ),
  //     txHistory: {
  //       ...txHistory,
  //       items: txHistory?.items,
  //     },
  //     urn: {
  //       ..._userData.urn,
  //       // art_: utils.rayToHuman(_userData.urn.art),
  //       // ink_: utils.rayToHuman(_userData.urn.ink),
  //     },
  //     preferences,
  //   };
  // };

  // const _addListeners = async (_deployedContracts: any) => {
  //   // Add Maker rate/spot changes
  //   provider &&
  //     addEventListener(
  //       _deployedContracts.Vat,
  //       'Vat',
  //       'LogNote',
  //       [],
  //       (x: any) => {
  //         console.log('MAKER listener', x);
  //         // dispatch({ type:'updateFeedData', payload: {...feedData, feedData.ilks })
  //       }
  //     );
  //   // TODO: add event listener for AMM
  // };

  const initUserContext = async () => {
    /* Init start */
    dispatch({ type: 'isLoading', payload: true });

    // TODO: look at splitting these up cleverly, in particular makerData.
    /* get all the bits */
    await Promise.all([
      _getBalances(),
      _getTxHistory(),
      _getPreferences(),
      _getMakerData(),
    ]);
    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
  };

  /* Init app and re-init app on any user and/or network change */
  React.useEffect(() => {
    chainId && deployedSeries.length && (async () => initUserContext())();
  }, [ deployedSeries, chainId ]);

  const actions = {

    refreshHistory: () => _getTxHistory(),
    rebuildHistory: () => _getTxHistory(true),

    refreshBalances: () => console.log('blaances update'),
    refreshMakerData: () => console.log('makerData update'),

    refreshPreferences: () => console.log('makerData update'),
    resetPreferences: () => console.log('preferences reset'),
  };

  return (
    <UserContext.Provider value={{ state, actions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };