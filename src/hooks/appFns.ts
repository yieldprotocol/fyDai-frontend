import React from 'react';

import { NotifyContext } from '../contexts/NotifyContext';
import { INotification } from '../types';

export const useNotify = (_msg: INotification) => {
  const { dispatch } = React.useContext(NotifyContext);
  dispatch({ type:'notify', payload:_msg });
  return null;
};

// export { useNotify };
