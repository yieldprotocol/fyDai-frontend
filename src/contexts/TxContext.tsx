import React, { useContext, useEffect, useReducer } from 'react';
import { useCachedState } from '../hooks/appHooks';
import { IReducerAction, ITxState, ITx } from '../types';
// import { useTxHelpers } from '../hooks/txHooks';
// import { SeriesContext } from './SeriesContext';

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
  // const { state: { seriesLoading } } = useContext(SeriesContext);
  // const { handleCachedTx } = useTxHelpers();

  // React.useEffect(() => {
  //   // /* bring in cached transactions if any */
  //   !seriesLoading && pendingCache.map((x:any) => { 
  //     dispatch({ type:'txPending', payload:x });
  //     handleCachedTx(x);
  //     // console.log state.pendingTxs);
  //   });
  // }, [seriesLoading]);

  return (
    <TxContext.Provider value={{ state, dispatch }}>
      {children}
    </TxContext.Provider> 
  );
};

export { TxContext, TxProvider };