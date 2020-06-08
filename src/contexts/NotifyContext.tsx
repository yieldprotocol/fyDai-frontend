import React from 'react';
import { INotification } from '../types';

const NotifyContext = React.createContext<any>({});

const initState = {
  open: false,
  position: 'top-right',
  message: '',
  type: 'info',
  timerMs: 2000,
  callbackAction: null,
  callbackCancel: null,
  fatalOpen: false,
  fatalMsg: '', 
};

function notifyReducer(state:any, action:any) {
  switch (action.type) {
    case 'notify':
      return { 
        ...state,
        open: true,
        message: action.payload.message,
        type: action.payload.type? action.payload.type: initState.type,
        timerMs: action.payload.showFor? action.payload.showFor: initState.timerMs,
        position: action.payload.position? action.payload.position : initState.position,
        callbackAction: action.payload.callbackAction? action.payload.callbackAction: null,
        callbackCancel: action.payload.callbackCancel? action.payload.callbackCancel: null,
      };
    case 'fatal':
      return { 
        ...state, 
        fatalOpen: true,
        fatalMsg: action.payload.message,
      };
    case '_closeNotify':
      return { ...state, open: false, timerMs: initState.timerMs };
    case '_openNotify':
      return { ...state, open: true };
    default:
      return state;
  }
}

const NotifyProvider = ({ children }:any) => {
  const [state, dispatch] = React.useReducer(notifyReducer, initState);

  React.useEffect( () => {
    state.open && ( async () => {
      if (state.timerMs === 0) {
        dispatch({ type: '_openNotify' });
      } else {
        await setTimeout(() => {
          dispatch({ type: '_closeNotify' });
        }, state.timerMs);
      }
    })();
  }, [state.open]);

  return (
    <NotifyContext.Provider value={{ state, dispatch }}>
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider };
