import React, { useEffect, useReducer } from 'react';
import { IReducerAction, ITx } from '../types';

const TxContext = React.createContext<any>({});

const initState = {
  pendingTxs: [],
  lastCompletedTx: null,
  requestedSigs: [],
};

function txReducer(state:ITx, action:IReducerAction) {
  switch (action.type) {
    case 'txPending':
      // console.log(state.pendingTxs);
      return {
        ...state,
        pendingTxs: [ ...state.pendingTxs, action.payload],
      };
    case 'txComplete':
      return {
        ...state,
        pendingTxs: state.pendingTxs.filter((x:any) => x.tx.hash !== ( action.payload.transactionHash || action.payload.hash)),
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

  const [state, dispatch] = useReducer(txReducer, initState); 

  useEffect( () => {
    // here is where to bring in cached info
  }, []);

  return (
    <TxContext.Provider value={{ state, dispatch }}>
      {children}
    </TxContext.Provider> 
  );
};

export { TxContext, TxProvider };