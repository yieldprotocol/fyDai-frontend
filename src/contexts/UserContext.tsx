import React from 'react';
import { ethers, BigNumber } from 'ethers';
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
    case 'updatePosition':
      return {
        ...state,
        position: action.payload,
      };
    case 'updateDelegations':
      return {
        ...state,
        delegations: action.payload,
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
  delegations:{},
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
    const maxDaiAvailable = daiAvailable( collateralValue, ethTotalDebtDai, 1.5);

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
  const _getDelegations = async () => {
    const _delegations:any={};
    _delegations.ethProxy = await callTx( deployedContracts.Controller, 'Controller', 'delegated', [account, deployedContracts.EthProxy]);
    dispatch( { type: 'updateDelegations', payload: _delegations });
    return _delegations;
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
    dispatch( { type: 'updateTxHistory', payload: _payload });
    return _payload;    
  };

  /**
   * @dev gets user Maker data if available.
   */
  const _getMakerData = async () => {
    const urn = await callTx(deployedContracts.Vat, 'Vat', 'urns', [ utils.ETH, account ]);
    dispatch( { type: 'updateMakerData', payload: urn });
    return {};
  };


  /**
   * @dev gets preferences.
   */
  const _getPreferences = async () => {
    console.log('dont forget to add in the preferences' );

    dispatch( { type: 'updatePreferences', payload: {} });
    return {};
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
    await Promise.all([
      _getPosition(),
      _getDelegations(),
      _getTxHistory(),
      _getPreferences(),
      _getMakerData(),
    ]);
    console.log('userContext initiated');
    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
  };

  // React.useEffect(()=>{  
  // },[])

  /* Init user context and re-init on any user and/or network change */
  React.useEffect(() => {
    account && !yieldState.isLoading && (async () => initUserContext())();
  }, [ chainId, account, yieldState.isLoading ]);

  const actions = {
    updateHistory: () => _getTxHistory(),
    rebuildHistory: () => _getTxHistory(true),

    updatePosition: () => _getPosition(),

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