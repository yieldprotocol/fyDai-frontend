import React from 'react';
import { ethers, BigNumber } from 'ethers';
import moment from 'moment';

import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';

import { NotifyContext } from './NotifyContext';
import { YieldContext } from './YieldContext';

import { useBalances, useCallTx } from '../hooks/chainHooks';
import { useMath } from '../hooks/mathHooks'; 
import { useCachedState, } from '../hooks/appHooks';
import { useController } from '../hooks/controllerHook';
import { useEvents } from '../hooks/eventHooks';
import { useSignerAccount } from '../hooks/connectionHooks';

const UserContext = React.createContext<any>({});

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

  const [ state, dispatch ] = React.useReducer(reducer, initState);

  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const { state: yieldState } = React.useContext(YieldContext);
  const { deployedContracts, deployedSeries } = yieldState;

  const { account, provider } = useSignerAccount();
  const { chainId } = useWeb3React();

  /* cache|localStorage declarations */
  const [txHistory, setTxHistory] = useCachedState('txHistory', null);
  const [preferences, setPreferences] = useCachedState('userPreferences', null );
  
  /* hook declarations */
  const [ callTx ] = useCallTx();
  const { getEventHistory, addEventListener, parseEventList } = useEvents();
  const { getBalance } = useBalances();
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
    estCollRatio: estimateRatio,
    minSafeColl,
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
      chaiPosted, 
    ]:any[] = await Promise.all([
      getBalance(), 
      getBalance(deployedContracts.Dai, 'Dai'), 
      collateralPosted(deployedContracts.Controller, 'ETH-A'),
      collateralPosted(deployedContracts.Controller, 'CHAI'),
    ]);

    const [
      ethLocked, 
      ethBorrowingPower, 
      ethTotalDebtDai
    ]:any[] = await Promise.all([
      collateralLocked(deployedContracts.Controller, 'ETH-A'),
      borrowingPower(deployedContracts.Controller, 'ETH-A'),
      totalDebtDai(deployedContracts.Controller, 'ETH-A'),
    ]);

    // const collateralAmount = collAmount();
    const debtValue = ethTotalDebtDai; 
    const collateralPrice = collPrice();
    const collateralValue = collValue(ethPosted);
    const collateralRatio = collRatio(collateralValue, ethTotalDebtDai);
    const collateralPercent = collPercent(collateralRatio);
    // const minSafeCollateral = minSafeColl( ethTotalDebtDai, 1.5, collateralPrice);
    const maxDaiAvailable = daiAvailable( collateralValue, ethTotalDebtDai, 2);

    const values = {
      ethBalance, 
      daiBalance, 
      ethPosted, 
      chaiPosted,
      ethLocked, 
      ethBorrowingPower, 
      ethTotalDebtDai,
      debtValue,
      collateralPrice,
      collateralValue,
      collateralRatio,
      collateralPercent,
      // minSafeCollateral,
      maxDaiAvailable,
      // collateralAmount
    };

    /* parse to human usable */
    const parsedValues = {  
      ethBalance_ : utils.wadToHuman(ethBalance),
      daiBalance_ : utils.wadToHuman(daiBalance),
      ethPosted_ : utils.wadToHuman(ethPosted),
      chaiPosted_ : utils.wadToHuman(chaiPosted),
      ethLocked_ : utils.wadToHuman(ethLocked),
      ethBorrowingPower_ : utils.wadToHuman(ethBorrowingPower),
      ethTotalDebtDai_ : utils.wadToHuman(ethTotalDebtDai),  
      debtValue_ : utils.wadToHuman(ethTotalDebtDai),
      collateralPrice_ : utils.wadToHuman(collateralPrice),
      collateralValue_ : utils.wadToHuman(collateralValue),
      collateralRatio_ : parseFloat(collateralRatio.toString()),
      collateralPercent_ : parseFloat(collateralPercent.toString()),
      // collateralAmount_ : utils.wadToHuman(collateralAmount),
      // minSafeCollateral_ : utils.wadToHuman(minSafeCollateral),
      maxDaiAvailable_ : utils.wadToHuman(maxDaiAvailable),
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
    _auths.hasDelegatedProxy = await checkControllerDelegate(deployedContracts.Controller, deployedContracts.YieldProxy);
    // _auths.hasPermittedDai = await checkControllerDelegate(deployedContracts.Controller, deployedContracts.YieldProxy);
    dispatch( { type: 'updateAuthorizations', payload: _auths });
    console.log(_auths);
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
    const urn = await callTx(deployedContracts.Vat, 'Vat', 'urns', [ utils.ETH, account ]);
    dispatch( { type: 'updateMakerData', payload: urn });
    return {};
  };

  /**
   * @dev Gets preferences from cache.
   */
  const _getPreferences = async () => {
    console.log('dont forget to add in the preferences' );
    // dispatch( { type: 'updatePreferences', payload: { slippage:0.005 } });
    return {};
  };

  const initUserContext = async () => {
    /* Init start */
    dispatch({ type: 'isLoading', payload: true });
    // TODO: look at splitting these up cleverly, in particular makerData.
    await Promise.all([
      _getPosition(),
      _getAuthorizations(),
      _getTxHistory(),
      _getPreferences(),
      _getMakerData(),
    ]);
    console.log('userContext initiated');
    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
  };

  React.useEffect(()=>{
    // init everytime or change
    account && !yieldState.isLoading && initUserContext();

    // if user has changed recache the history
    const hist = JSON.parse( (localStorage.getItem('txHistory') || '{}') );
    if ( !yieldState.isLoading && account && (hist?.account !== account) ) {
      localStorage.removeItem('txHistory');
      _getTxHistory(true);
      console.log('history updating cos of user change');
    }

  }, [ account, yieldState.isLoading ]);

  const actions = {
    updateHistory: () => _getTxHistory(),
    rebuildHistory: () => _getTxHistory(true),

    updatePosition: () => _getPosition(),
    updateAuthorizations: () => _getAuthorizations(),

    updateMakerData: () => console.log('makerData update'),
    updatePreferences: () => console.log('makerData update'),
    resetPreferences: () => console.log('preferences reset'),
  };

  return (
    <UserContext.Provider value={{ state, actions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };