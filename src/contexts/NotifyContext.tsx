import React, { useEffect } from 'react';
import { INotification, IReducerAction } from '../types';

const NotifyContext = React.createContext<any>({});
const initState = {
  notifyOpen: false,
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

  updateAvailable: false,
  updateAccept: ()=>console.log('No update available'),
};

function notifyReducer(state:INotification, action:IReducerAction) {
  switch (action.type) {
    case 'notify':
      return { 
        ...state,
        notifyOpen: true,
        message: action.payload.message,
        type: action.payload.type || initState.type,
        timerMs: action.payload.showFor || initState.timerMs,
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
      // console.log(state.pendingTxs);
      return {
        ...state,
        pendingTxs: [ ...state.pendingTxs, action.payload],
      };
    case 'txComplete':
      return {
        ...state,
        pendingTxs: state.pendingTxs.filter( (x:any) => x.tx.hash !== ( action.payload.transactionHash || action.payload.hash)  ),
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
    case 'updateAvailable':
      return {
        ...state,
        updateAvailable: action.payload.updateAvailable,
        updateAccept: action.payload.updateAccept || ( ()=>console.log('No update available') ),
      };

    /* internal - maybe find a better way to do these two */ 
    case '_closeNotify':
      return { ...state, notifyOpen: false, timerMs: initState.timerMs };
    case '_openNotify':
      return { ...state, notifyOpen: true };
    default:
      return state;
  }
}

const NotifyProvider = ({ children }:any) => {
  const [state, dispatch] = React.useReducer(notifyReducer, initState); 
  useEffect( () => {
    state.notifyOpen && ( () => {
      if (state.timerMs === 0) {
        dispatch({ type: '_openNotify' });
      } else {
        setTimeout(() => {
          dispatch({ type: '_closeNotify' });
        }, 3000);
      }
    })();
  }, [state.notifyOpen]);

  return (
    <NotifyContext.Provider value={{ state, dispatch }}>
      {children}
    </NotifyContext.Provider> 
  );
};

export { NotifyContext, NotifyProvider };
