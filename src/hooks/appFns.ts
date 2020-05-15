import React from "react";

import { NotifyContext } from "../contexts/NotifyContext";
import { INotification } from "../types";

export async function useNotify(_msg: INotification) {
  const { notify } = React.useContext(NotifyContext);
  return notify(_msg);
}
