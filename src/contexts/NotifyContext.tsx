import React, { useEffect } from 'react';
import { INotification, IReducerAction } from '../types';

const NotifyContext = React.createContext<any>({});
const initState = {
  open: false,
  position: 'right',
  message: '',
  type: 'info',
  timerMs: 8000,
  callbackAction: null,
  callbackCancel: null,
  fatalOpen: false,
  fatalMsg: '',
  pendingTxs: [],
  lastCompletedTx: null,
  requestedSigs: [],
};

function notifyReducer(state:INotification, action:IReducerAction) {
  switch (action.type) {
    case 'notify':
      return { 
        ...state,
        open: true,
        message: action.payload.message,
        type: action.payload.type || initState.type,
        timerMs: action.payload.showFor || initState.timerMs,
        position: action.payload.position || initState.position,
        callbackAction: action.payload.callbackAction || null,
        callbackCancel: action.payload.callbackCancel || null,
      };
    case 'fatal':
      return { 
        ...state, 
        fatalOpen: true,
        fatalMsg: action.payload.message,
      };
    case 'txPending':
      return {
        ...state,
        pendingTxs: [ ...state.pendingTxs, action.payload],
      };
    case 'txComplete':
      return {
        ...state,
        pendingTxs: state.pendingTxs.filter( (x:any) => x.tx.hash !== ( action.payload.transactionHash || action.payload.hash)  ),
        lastCompletedTx: action.payload,
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
    case '_closeNotify':
      return { ...state, open: false, timerMs: initState.timerMs };
    case '_openNotify':
      return { ...state, open: true };
    default:
      return state;
  }
}

const NotifyProvider = ({ updateAvailable, children }:any) => {
  const [state, dispatch] = React.useReducer(notifyReducer, initState);
  useEffect( () => {
    state.open && ( () => {
      if (state.timerMs === 0) {
        dispatch({ type: '_openNotify' });
      } else {
        setTimeout(() => {
          dispatch({ type: '_closeNotify' });
        }, 3000);
      }
    })();
  }, [state.open]);

  useEffect(()=> dispatch({ type: 'Notify', payload:{ message: 'An app update is availble', timerMs:0 },  }), [updateAvailable]);

  return (
    <NotifyContext.Provider value={{ state, dispatch }}>
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider };
