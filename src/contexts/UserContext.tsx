import React, { useEffect, useContext, createContext, useReducer } from 'react';
import { ethers } from 'ethers';

import * as utils from '../utils';

import { YieldContext } from './YieldContext';

import { useMath } from '../hooks/mathHooks'; 
import { useToken } from '../hooks/tokenHook';
import { useCachedState, } from '../hooks/appHooks';
import { useController } from '../hooks/controllerHook';
import { useEvents } from '../hooks/eventHooks';
import { useSignerAccount } from '../hooks/connectionHooks';

const UserContext = createContext<any>({});

// reducer
function reducer(state: any, action: any) {
  switch (action.type) {

    case 'updatePreferences':
      return {
        ...state,
        preferences: action.payload,
      };
    case 'updatePosition':
      return {
        ...state,
        position: action.payload,
      };
    case 'updateAuthorizations':
      return {
        ...state,
        authorizations: action.payload,
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
    case 'userLoading':
      return {
        ...state,
        userLoading: action.payload,
      };
    default:
      return state;
  }
}

const initState = {
  userLoading: true,
  position: {},
  txHistory: {
    lastBlock: 0, 
    items:[],
  },
  authorizations:{},
  preferences:{
    slippage: 0.005 // default === 0.5%
  },
  makerData:{},
};

const UserProvider = ({ children }: any) => {

  const [ state, dispatch ] = useReducer(reducer, initState);
  const { state: yieldState } = useContext(YieldContext);
  const { deployedContracts, deployedSeries } = yieldState;

  const { account, provider } = useSignerAccount();

  /* cache | localStorage declarations */
  const [txHistory, setTxHistory] = useCachedState('txHistory', null);
  const [preferences, setPreferences] = useCachedState('userPreferences', null );
  
  /* hook declarations */
  const { getEventHistory, parseEventList } = useEvents();
  const { getBalance } = useToken();
  const { 
    collateralPosted, 
    collateralLocked,
    totalDebtDai,
    borrowingPower,
    checkControllerDelegate,
  } = useController();

  const {
    collValue,
    collPrice,
    collRatio,
    collPercent,
    yieldAPR,
    daiAvailable,
  } = useMath();

  /**
   * @dev gets and updates yield positions {}
   */
  const _getPosition = async () => {

    /* Get balances and posted collateral */
    const [ 
      ethBalance, 
      daiBalance, 
      ethPosted,  
    ]:any[] = await Promise.all([
      getBalance(), 
      getBalance(deployedContracts.Dai, 'Dai'), 
      collateralPosted('ETH-A'),
    ]);

    const [
      ethLocked, 
      ethBorrowingPower, 
      ethTotalDebtDai
    ]:any[] = await Promise.all([
      collateralLocked('ETH-A'),
      borrowingPower('ETH-A'),
      totalDebtDai('ETH-A'),
    ]);

    const debtValue = ethTotalDebtDai; 
    const collateralValue = collValue(ethPosted);
    const collateralRatio = collRatio(collateralValue, ethTotalDebtDai);
    const collateralPercent = collPercent(collateralRatio); 
    const maxDaiAvailable = daiAvailable( collateralValue, ethTotalDebtDai, 2);

    // const collateralPrice = collPrice();
    // const minSafeCollateral = minSafeColl( ethTotalDebtDai, 1.5, collateralPrice);

    const values = {
      ethBalance, 
      daiBalance, 
      ethPosted,
      ethLocked, 
      ethBorrowingPower, 
      ethTotalDebtDai,
      debtValue,
      collateralValue,
      collateralRatio,
      collateralPercent,
      maxDaiAvailable,
      // collateralPrice,
      // minSafeCollateral,
    };

    /* parse to human usable */
    const parsedValues = {  
      ethBalance_ : utils.humanize(ethBalance),
      daiBalance_ : utils.humanize(daiBalance),
      ethPosted_ : utils.humanize(ethPosted),
      ethLocked_ : utils.humanize(ethLocked),
      ethBorrowingPower_ : utils.humanize(ethBorrowingPower),
      ethTotalDebtDai_ : utils.humanize(ethTotalDebtDai),  
      debtValue_ : utils.humanize(ethTotalDebtDai),
      collateralValue_ : utils.humanize(collateralValue),
      collateralRatio_ : parseFloat(collateralRatio.toString()),
      collateralPercent_ : parseFloat(collateralPercent.toString()),
      maxDaiAvailable_ : utils.humanize(maxDaiAvailable),
      // collateralPrice_ : utils.humanize(collateralPrice),
      // minSafeCollateral_ : utils.humanize(minSafeCollateral),
    };
    console.log('User updated:');
    console.log({ ...values, ...parsedValues } );
    dispatch( { type: 'updatePosition', payload: { ...values, ...parsedValues } } );
    return { ...values, ...parsedValues };
  };

  /**
   * @dev gets confirmation of contracts that the user has delegated to operate on thier behalf.
   */
  const _getAuthorizations = async () => {
    const _auths:any={};
    _auths.hasDelegatedProxy = await checkControllerDelegate(deployedContracts.YieldProxy);
    dispatch( { type: 'updateAuthorizations', payload: _auths });
    return _auths;
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
      [ethers.utils.formatBytes32String('ETH-A'), account, null],
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
      [null, null, account, null],
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
              eDai: x.args[4].abs(),
              APR: yieldAPR( x.args[3].abs(),  x.args[4].abs(), parseInt(x.args_[0], 10), x.date), 
              dai_: ethers.utils.formatEther( x.args_[3] ),
              eDai_: ethers.utils.formatEther( x.args_[4] ),
            };
          }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );
    
    // TODO : get blocknumber at initialisation of eDaiProtocol instead of using first block(0).
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
      account,
      lastBlock: _lastBlock,
      items: txHistory ? [...txHistory.items, ...updatedHistory] : [...updatedHistory]
    };

    setTxHistory(_payload);
    dispatch( { type: 'updateTxHistory', payload: _payload });
    return _payload;    
  };

  /**
   * @dev Gets user Maker data if available.
   */
  const _getMakerData = async () => {
    // const urn = await callTx(deployedContracts.Vat, 'Vat', 'urns', [ utils.ETH, account ]);
    // dispatch( { type: 'updateMakerData', payload: urn });
    return {};
  };

  /**
   * @dev Gets preferences from cache.
   */
  const _getPreferences = async () => {
    console.log('Dont forget to add in the preferences' );
    // dispatch( { type: 'updatePreferences', payload: { slippage:0.005 } });
    return {};
  };

  const initUser = async () => {
    /* Init start */
    dispatch({ type: 'userLoading', payload: true });
    // TODO: look at splitting these up cleverly, in particular makerData.
    await Promise.all([
      _getPosition(),
      _getAuthorizations(),
      _getTxHistory(),
      _getPreferences(),
      _getMakerData(),
    ]);
    console.log('User initialised.');
    /* Init end */
    dispatch({ type: 'userLoading', payload: false });
  };

  useEffect(()=>{
    // Init everytime it starts or change of user
    account && !yieldState.isLoading && initUser();

    // If user has changed, rebuild and re-cache the history
    const hist = JSON.parse( (localStorage.getItem('txHistory') || '{}') );
    if ( !yieldState.isLoading && account && (hist?.account !== account) ) {
      localStorage.removeItem('txHistory');
      _getTxHistory(true);
      console.log('History updating due to user change');
    }
  }, [ account, yieldState.isLoading ]);

  const actions = {
    updatePosition: () => _getPosition(),
    updateAuthorizations: () => _getAuthorizations(),

    updateHistory: () => _getTxHistory(),
    rebuildHistory: () => _getTxHistory(true),

    updateMakerData: () => console.log('makerData update fn'),
    updatePreferences: () => console.log('preference update fn'),
    resetPreferences: () => console.log('preferences reset fn'),
  };

  return (
    <UserContext.Provider value={{ state, actions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };