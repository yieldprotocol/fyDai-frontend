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

  updateAvailable: false,
  // eslint-disable-next-line no-console
  updateAccept: ()=> console.log('No app update available'),
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
      
    case 'updateAvailable':
      return {
        ...state,
        updateAvailable: action.payload.updateAvailable,
        // eslint-disable-next-line no-console
        updateAccept: action.payload.updateAccept,
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
