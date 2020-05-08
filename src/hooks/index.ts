import {
  useGetWeiBalance,
  useEagerConnect,
  getNetworkName, 
} from './connectionFns';

export const useConnectionFns = () => {
  return {
    useGetWeiBalance,
    useEagerConnect,
    getNetworkName,
  };
};

export const useYieldFns = () => {
  return {};
};
