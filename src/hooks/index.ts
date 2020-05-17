import {
  useGetWeiBalance,
  useEagerConnect,
  useConnectorImage,
  getNetworkName,
} from './connectionFns';

export const useConnectionFns = () => {
  return {
    useGetWeiBalance,
    useEagerConnect,
    useConnectorImage,
    getNetworkName,
  };
};

export const useYieldFns = () => {
  return {};
};
