import React from 'react';
import { INotification } from '../types';

const NotifyContext = React.createContext<any>({});

const initState = {
  open: false,
  position: 'bottom',
  message: '',
  type: 'info',
  timerMs: 3000,
  callbackAction: null,
  callbackCancel: null,
};

function notifyReducer(state:any, action:any) {
  switch (action.type) {
    case 'notify':
      return { 
        ...state,
        timerMs: action.payload.showFor? action.payload.showFor: initState.timerMs,
        open: true,
        message: action.payload.message,
        type: action.payload.type? action.payload.type: initState.type,
        position: action.payload.position? action.payload.position : initState.position,
        callbackAction: action.payload.callbackAction? action.payload.callbackAction: null,
        callbackCancel: action.payload.callbackCancel? action.payload.callbackCancel: null,
      };
    case 'closeNotify':
      return { ...state, open: false, timerMs: initState.timerMs };
    case 'openNotify':
      return { ...state, open: true };
    default:
      return state;
  }
}

const NotifyProvider = ({ children }:any) => {
  const [state, dispatch] = React.useReducer(notifyReducer, initState);
  React.useEffect( () => {
    state.open && ( async () => {
      if (state.timerMs > 0) {
        await setTimeout(() => {
          dispatch({ type: 'closeNotify' });
        }, state.timerMs);
      } else {
        dispatch({ type: 'openNotify' });
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
