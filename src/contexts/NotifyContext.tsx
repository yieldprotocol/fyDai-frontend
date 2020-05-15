import React from 'react';

import { INotification } from '../types';

const NotifyContext = React.createContext<any>({});

const NotifyProvider = (props:any) => {
  const { children } = props;
  const [open, setOpen] = React.useState<boolean>(false);
  const [position, setPosition] = React.useState<any>('bottom');
  const [msg, setMsg] = React.useState<string>('No message here!');
  const [type, setType] = React.useState<any>('info');
  const [timerMs, setTimerMs] = React.useState<number>(5000);
  const [callbackAction, setCallbackAction] = React.useState<any>();
  const [callbackCancel, setCallbackCancel] = React.useState<any>();

  const layerTimer = async () => {
    if (timerMs > 0) {
      setOpen(true);
      await setTimeout(() => {
        setOpen(false);
      }, timerMs);
    } else {
      setOpen(true);
    }
  };

  const emitNotification = (notification: INotification) => {
    notification.message && setMsg(notification.message);
    notification.type && setType(notification.type);
    notification.position && setPosition(notification.position);
    notification.showTime && setTimerMs(notification.showTime);
    notification.callbackAction && setCallbackAction(notification.callbackAction);
    notification.callbackCancel && setCallbackCancel(notification.callbackCancel);
    layerTimer();
  };

  return (
    <NotifyContext.Provider
      value={{
        msg,
        type,
        open,
        position,
        callbackAction,
        callbackCancel,
        closeNotify: ()=>setOpen(false),
        notify: emitNotification,
      }}
    >
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider } ;

