import React, { useState, useContext, useEffect, useReducer } from 'react';
import { useWeb3React } from '@web3-react/core';

import { useCachedState } from '../hooks/appHooks';
import { IReducerAction, ITxState, ITx } from '../types';

import { SeriesContext } from './SeriesContext';
// import { useSignerAccount } from '../hooks';

const TxContext = React.createContext<any>({});

const initState = {
  pendingTxs: [],
  lastCompletedTx: null,
  requestedSigs: [],
};

function txReducer(state:ITxState, action:IReducerAction) {
  switch (action.type) {
    case 'txPending':
      return {
        ...state,
        pendingTxs: [ ...state.pendingTxs, action.payload],
      };
    case 'txComplete':
      return {
        ...state,
        pendingTxs: state.pendingTxs?.filter((x:any) => x.tx.hash !== ( action.payload.transactionHash || action.payload.hash)),
        lastCompletedTx: { ...action.payload, transactionHash: action.payload.transactionHash || action.payload.hash },
      };
    case 'requestSigs':
      return {
        ...state,
        requestedSigs: action.payload.map((x:any)=> { return { ...x };} ),
      };
    case 'signed':
      return {
        ...state,
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

  const { state: { seriesLoading } } = useContext(SeriesContext);
  const [ pendingCache, setPendingCache ] = useCachedState('txPending', []);
  const { library } = useWeb3React('fallback');
  const [ hasReadCache, setHasReadCache] = useState<boolean>(false);
  

  useEffect(() => {
    /* handle registering and monitoring the cached transactions if any */
    ( async () => {
      if (!seriesLoading && library && !hasReadCache) {
        await Promise.all( pendingCache.map(async (x:any) => {
          dispatch({ type:'txPending', payload: x });
          await library.waitForTransaction(x.tx.hash, 1)
            .then((receipt:any) => {
              dispatch({ type: 'txComplete', payload: receipt } );
            });
          console.log(x.tx.hash);
          setPendingCache( pendingCache.filter((t:any) => t.tx.hash !== x.tx.hash));
        })
        );
        console.log('cache txs processed');
        setPendingCache(state.pendingTxs);
        setHasReadCache(true);
      }
    })();

  }, [library, seriesLoading]);

  return (
    <TxContext.Provider value={{ state, dispatch }}>
      {children}
    </TxContext.Provider> 
  );
};

export { TxContext, TxProvider };