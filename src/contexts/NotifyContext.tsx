import React from "react";

import { INotification } from "../types";

const NotifyContext = React.createContext<any>({});

const NotifyProvider = (props: any) => {
  const { children } = props;
  const [open, setOpen] = React.useState<boolean>(false);
  const [position, setPosition] = React.useState<any>("bottom");
  const [msg, setMsg] = React.useState<string>("No message here!");
  const [type, setType] = React.useState<any>("info");
  const [timerMs, setTimerMs] = React.useState<number>(3000);
  const [callbackAction, setCallbackAction] = React.useState<any>();
  const [callbackCancel, setCallbackCancel] = React.useState<any>();

  const layerTimer = async () => {
    if (timerMs >= 0) {
      setOpen(true);
      await setTimeout(() => {
        setOpen(false);
      }, timerMs);
      setTimerMs(2000);
    } else {
      setOpen(true);
    }
  };

  const emitNotification = (n: INotification) => {
    n.message && setMsg(n.message);
    n.type && setType(n.type);
    n.position && setPosition(n.position);
    n.showFor && setTimerMs(n.showFor);
    n.callbackAction && setCallbackAction(n.callbackAction);
    n.callbackCancel && setCallbackCancel(n.callbackCancel);
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
        closeNotify: () => setOpen(false),
        notify: emitNotification,
      }}
    >
      {children}
    </NotifyContext.Provider>
  );
};

export { NotifyContext, NotifyProvider };
