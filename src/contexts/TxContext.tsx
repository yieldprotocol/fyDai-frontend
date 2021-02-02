import React, { useState, useContext, useEffect, useReducer } from 'react';
import { useWeb3React } from '@web3-react/core';

/* utils and support */
import { logEvent } from '../utils/analytics';

import { useCachedState } from '../hooks/appHooks';
import { IReducerAction, ITxState } from '../types';

import { YieldContext } from './YieldContext';

const TxContext = React.createContext<any>({});

const initState = {
  pendingTxs: [],
  requestedSigs: [],
  lastCompletedTx: null,
  txProcessActive: null,
  fallbackActive: false,
};

function txReducer(state:ITxState, action:IReducerAction) {
  switch (action.type) {
    case 'setTxProcessActive':
      return {
        ...state,
        /* set tthe current active process */
        txProcessActive: action.payload.txCode,
        /* set the list of sigs required for the current process */
        requestedSigs: action.payload.sigs.map((x:any)=> { return { ...x };} ),
      };
    case 'txPending':
      return {
        ...state,
        /* add the tx to the list of pending txs */
        pendingTxs: [ ...state.pendingTxs, action.payload],
      };
    case 'txComplete':
      return {
        ...state,
        /* remove the tx from the pending tx list */
        pendingTxs: state.pendingTxs?.filter((x:any) => x.tx.hash !== ( action.payload.receipt.transactionHash || action.payload.receipt.hash)),
        /* set the last completed tx to the one just finished */
        lastCompletedTx: { ...action.payload.receipt, transactionHash: action.payload.receipt.transactionHash || action.payload.receipt.hash },
        /* if the txCode is the same as the current activeProcces,. then reset that process */
        txProcessActive: (action.payload.txCode === state?.txProcessActive)? null : state?.txProcessActive,
      };
    case 'setFallbackActive':
      return {
        ...state,
        fallbackActive: action.payload,
      };
    case 'signed':
      return {
        ...state,
        /* mark the signature as signed */ 
        requestedSigs: state.requestedSigs.map( (x:any) => {           
          if ( x.id === action.payload.id) {
            return { ...x, signed:true };
          }  return x;  
        })
      };
    default:
      return state;
  }
}

const TxProvider = ({ children }:any) => {
  const [ state, dispatch ] = useReducer(txReducer, initState );
  const { state: { yieldLoading } } = useContext(YieldContext);
  const [ pendingCache, setPendingCache ] = useCachedState('txPending', []);
  const { library } = useWeb3React('fallback');
  const [ hasReadCache, setHasReadCache] = useState<boolean>(false);
  
  useEffect(() => {
    /* handle registering and monitoring the cached transaction if any */
    ( async () => {
      if (!yieldLoading && library && !hasReadCache) {
        await Promise.all( pendingCache.map(async (x:any) => {
          dispatch({ type:'txPending', payload: x });
          await library.waitForTransaction(x.tx.hash, 2)
            .then((receipt:any) => {

              logEvent(
                x.tx.type, 
                {
                  value: x.tx.value,
                  series: x.tx.series ? x.tx.series.displayName : null,
                  maturity: x.tx.series ? x.tx.series.maturity : null, 
                  time_to_maturity: x.tx.series ? (new Date().getTime()/1000) - x.tx.series?.maturity : null,    
                });

              dispatch({ type: 'txComplete', payload: { receipt, txCode: x.txCode } } );
              
            });
          setPendingCache([]);
        })
        );
        // eslint-disable-next-line no-console
        console.log('cache txs processed');
        // setPendingCache( state.pendingTxs );
        setHasReadCache(true);
      }
    })();
  }, [library, yieldLoading]);


  return (
    <TxContext.Provider value={{ state, dispatch }}>
      {children}
    </TxContext.Provider> 
  );
};

export { TxContext, TxProvider };