import React, { useEffect, useReducer } from 'react';
import { useCachedState } from '../hooks/appHooks';
import { IReducerAction, ITxState, ITx } from '../types';
import { useSignerAccount } from '../hooks/connectionHooks';
import { useTxHelpers } from '../hooks/txHooks';

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
        requestedSigs: action.payload.map((x:any)=> { return { ...x, signed: false };} ),
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

  const [ pendingCache ] = useCachedState('txPending', []);
  const [ state, dispatch ] = useReducer(txReducer, initState );

  React.useEffect(() => {
    // /* bring in cached transactions if any */
    // fallbackProvider && pendingCache.map((x:any) => { 
    //   dispatch({ type:'txPending', payload:x });
    //   // handleCachedTx(x);
    //   // console.log state.pendingTxs);
    // });
  }, []);

  return (
    <TxContext.Provider value={{ state, dispatch }}>
      {children}
    </TxContext.Provider> 
  );
};

export { TxContext, TxProvider };