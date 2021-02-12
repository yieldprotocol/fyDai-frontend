import React, { useEffect, useContext, createContext, useReducer } from 'react';
import { ethers } from 'ethers';

import { cleanValue } from '../utils';

import { calculateAPR } from '../utils/yieldMath';

import { YieldContext } from './YieldContext';
import { UserContext } from './UserContext';

import { useCachedState, } from '../hooks/appHooks';
import { useEvents } from '../hooks/eventHooks';
import { useSignerAccount } from '../hooks/connectionHooks';

const HistoryContext = createContext<any>({});

// reducer
function reducer(state: any, action: any) {
  switch (action.type) {
    case 'updateTxHistory':
      return {
        ...state,
        txHistory: action.payload,
      };
    case 'isLoading':
      return {
        ...state,
        historyLoading: action.payload,
      };
    default:
      return state;
  }
}

const initState = {
  historyLoading: true,
  txHistory: {
    lastBlock: 11066942, 
    items:[],
  }
};

const HistoryProvider = ({ children }: any) => {

  const [ state, dispatch ] = useReducer(reducer, initState);

  /* context state */
  const { state: yieldState } = useContext(YieldContext);
  const { deployedContracts, deployedSeries } = yieldState;

  const { state: userState } = useContext(UserContext);

  /* cache | localStorage declarations */
  const [txHistory, setTxHistory] = useCachedState('txHistory', null);
  
  /* hook declarations */
  const { getEventHistory, parseEventList } = useEvents();
  const { account, provider } = useSignerAccount();

  /**
   * @dev gets user transaction history.
   */
  const _getTxHistory = async ( forceUpdate:boolean ) => {
    /* Get transaction history (from cache first or rebuild if an update is forced) */
    // eslint-disable-next-line no-console
    forceUpdate && console.log('Re-building transaction History...');
    const _lastBlock = await provider.getBlockNumber();
    const lastCheckedBlock = (txHistory && forceUpdate)? 11066942: txHistory?.lastBlock || 11066942;

    /* get the collateral transaction history */
    const collateralHistory = await getEventHistory(
      deployedContracts.Controller,
      'Controller',
      'Posted',
      [ethers.utils.formatBytes32String('ETH-A'), account, null],
      lastCheckedBlock+1
    )
      .then((res: any) => parseEventList(res))       /* then parse returned values */
      .then((parsedList: any) => {                   /* then add extra info and calculated values */
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: x.args_[2]>0 ? 'Deposited' : 'Withdrew',
            type: 'controller_posted',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturity: null,
            amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[2] )) ),
            dai: x.args_[2],
            dai_: ethers.utils.formatEther( x.args_[2] ),
          };
        });
      });
    
    /* get the repayment hisotry from the controller */
    const repayHistory = await getEventHistory(
      deployedContracts.Controller,
      'Controller',
      'Borrowed',
      [ ethers.utils.formatBytes32String('ETH-A'), null, account, null],
      lastCheckedBlock+1
    )
      .then((res: any) => parseEventList(res))        /* then parse returned values */
      .then((parsedList: any) => {                    /* then add extra info and calculated values */
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: x.args_[3]<0? 'Repaid' : 'Borrowed_direct',
            type: 'controller_borrowed',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturity: parseInt(x.args_[1], 10),
            amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[3] )) ),
            dai: x.args_[3],
            dai_: ethers.utils.formatEther( x.args_[3] ),
          };
        });     
      });
    
    /* get the trades history from the pool */
    const tradeHistory = await deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Trade',
        [null, null, account, null, null],
        lastCheckedBlock+1
      )
        .then((res:any) => parseEventList(res))     /* then parse returned values */
        .then((parsedList: any) => {                /* then add extra info and calculated values */
          return parsedList.map((x:any) => {
            let evnt;
            const proxyTrade = (x.args[1] !== x.args[2]); 
            if (x.args_[3]>0) {
              proxyTrade ? evnt='Borrowed' : evnt='Closed';
            } else { 
              evnt = 'Lent';
            }
            return {
              ...x,
              event: evnt,
              type: 'pool_trade',
              from: x.args[1],
              to:  x.args[2],
              proxyTraded: proxyTrade,
              maturity: parseInt(x.args_[0], 10),
              amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[3] )) ),
              dai: x.args[3].abs(),
              fyDai: x.args[4].abs(),
              APR: calculateAPR( x.args[3].abs(),  x.args[4].abs(), parseInt(x.args_[0], 10), x.date), 
              dai_: ethers.utils.formatEther( x.args_[3] ),
              fyDai_: ethers.utils.formatEther( x.args_[4] ),
            };
          }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );

    /* get the add liquidity history */ 
    const addLiquidityHistory = await deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Liquidity',
        [null, null, account, null, null, null],
        lastCheckedBlock+1
      )
        .then((res:any) => parseEventList(res))     /* then parse returned values */
        .then((parsedList: any) => {                /* then add extra info and calculated values */
          return parsedList
            .filter((x:any) => x.args[5]>0)
            .map((x:any) => {
              return {
                ...x,
                event: 'Added',
                type: 'pool_liquidity',
                from: x.args[1],
                to:  x.args[2],
                proxyTraded: x.args[1] !== x.args[2],
                maturity: parseInt(x.args_[0], 10),
                amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[5] )) ),
                dai: x.args[3].abs(),
                fyDai: x.args[4].abs(),
                poolTokens: x.args[5].abs(),
                dai_: ethers.utils.formatEther( x.args_[3] ),
                fyDai_: ethers.utils.formatEther( x.args_[4] ),
                poolTokens_: ethers.utils.formatEther( x.args_[5] ),
              };
            }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );

    // /* get the remove liquidity histrory  - I know!! i will combine the two. but filterign is problmeatic */ 
    const removeLiquidityHistory = await deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Liquidity',
        [null, account, null, null, null, null],
        lastCheckedBlock+1
      )
        .then((res:any) => parseEventList(res))     /* then parse returned values */
        .then((parsedList: any) => {                /* then add extra info and calculated values */
          return parsedList
            .filter((x:any) => x.args[5]<0)
            .map((x:any) => {
              return {
                ...x,
                event: 'Removed',
                type: 'pool_liquidity',
                from: x.args[1],
                to:  x.args[2],
                proxyTraded: x.args[1] !== x.args[2],
                maturity: parseInt(x.args_[0], 10),
                amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[5] )) ),
                dai: x.args[3].abs(),
                fyDai: x.args[4].abs(),
                poolTokens: x.args[5].abs(),
                dai_: ethers.utils.formatEther( x.args_[3] ),
                fyDai_: ethers.utils.formatEther( x.args_[4] ),
                poolTokens_: ethers.utils.formatEther( x.args_[5] ),
              };
            }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );
 
    /* get the migration hisotry from the controller */
    const [ cdpMigrationHistory, migrationHistory]  = await Promise.all([  
      /* migration events from cdps in vat */  
      getEventHistory(
        deployedContracts.ImportCdpProxy,
        'ImportCdpProxy',
        'ImportedFromMaker',
        [ null, null, account, null, null],
        lastCheckedBlock+1
      )
        .then((res: any) => parseEventList(res))        /* then parse returned values */
        .then((parsedList: any) => {                    /* then add extra info and calculated values */
          return parsedList.map((x:any) => {
            return {
              ...x,
              event: 'Imported',
              type: 'imported_maker',
              maturity: parseInt(x.args_[0], 10),
              cdpAddr: x.args_[1],
              collateral: x.args[3],
              collateral_: ethers.utils.formatEther(x.args_[3]),
              daiDebt: x.args[4],
              daiDebt_: ethers.utils.formatEther(x.args_[4]),
              amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[4] )) ),
            };
          });     
        }),

      /* migration events from cdps held in maker cdpManager */
      getEventHistory(
        deployedContracts.ImportProxy,
        'ImportProxy',
        'ImportedFromMaker',
        [ null, null, account, null, null],
        lastCheckedBlock+1
      )
        .then((res: any) => parseEventList(res))        /* then parse returned values */
        .then((parsedList: any) => {                    /* then add extra info and calculated values */
          return parsedList.map((x:any) => {
            return {
              ...x,
              event: 'Imported',
              type: 'imported_maker',
              maturity: parseInt(x.args_[0], 10),
              cdpAddr: x.args_[1],
              collateral: x.args[3],
              collateral_: ethers.utils.formatEther(x.args_[3]),
              daiDebt: x.args[4],
              daiDebt_: ethers.utils.formatEther(x.args_[4]),
              amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[4] )) ),
            };
          });     
        }),
    ]);

    /* get the repayment hisotry from the controller */
    const rolledHistory = await getEventHistory(
      deployedContracts.RollProxy,
      'RollProxy',
      'Rolled',
      [ ethers.utils.formatBytes32String('ETH-A'), null, null, account, null],
      lastCheckedBlock+1
    )
      .then((res: any) => parseEventList(res))        /* then parse returned values */
      .then((parsedList: any) => {                    /* then add extra info and calculated values */
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: 'Rolled',
            type: 'debt_rolled',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturityFrom: yieldState.deployedSeries.find((y:any)=> y.poolAddress === x.args_[1]).maturity,
            maturity: yieldState.deployedSeries.find((y:any)=> y.poolAddress === x.args_[2]).maturity,
            amount: parseFloat(ethers.utils.formatEther(x.args_[4])), 
          };
        });     
      });
     
    const updatedHistory = [
      ...collateralHistory,
      ...repayHistory,
      ...tradeHistory,
      ...addLiquidityHistory,
      ...removeLiquidityHistory,
      ...cdpMigrationHistory,
      ...migrationHistory,
      ...rolledHistory
    ];

    const _payload = {
      account,
      lastBlock: _lastBlock,
      items: (!forceUpdate && txHistory) ? [...txHistory.items, ...updatedHistory] : [...updatedHistory]
    };

    setTxHistory(_payload);
    
    dispatch( { type: 'updateTxHistory', payload: _payload });

    // eslint-disable-next-line no-console
    console.log(
      'Transaction history updated from block:',
      lastCheckedBlock,
      'to block:',
      _lastBlock
    );

    return _payload;
  };


  /* initiate the user */
  const initHistory = async () => {
    
    /* Init start */
    dispatch({ type: 'isLoading', payload: true });
    try {
      await _getTxHistory(false); 
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
    /* Init end */
    dispatch({ type: 'isLoading', payload: false });
    
  };

  useEffect(()=>{
    // Init everytime it starts or change of user
    !yieldState?.yieldLoading && 
    account && 
    !userState?.userLoading && initHistory();
    
    // If user has changed, rebuild and re-cache the history
    !yieldState?.yieldLoading && 
    account && 
    !userState?.userLoading && 
    !(txHistory?.account === account) && 
    _getTxHistory(true);

  }, [ account, yieldState.yieldLoading, userState.userLoading ]);

  /* Exposed actions */
  const actions = {
    updateHistory: () => _getTxHistory(false),
    rebuildHistory: async () => {
      dispatch({ type: 'isLoading', payload: true });
      await _getTxHistory(true);
      dispatch({ type: 'isLoading', payload: false });
    }
  };

  return (
    <HistoryContext.Provider value={{ state, actions }}>
      {children}
    </HistoryContext.Provider>
  );
};

export { HistoryContext, HistoryProvider };