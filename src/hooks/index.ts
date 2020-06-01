import {
  useEagerConnect,
  useConnectorImage,
  getNetworkName,
} from './connectionFns';

// CURRENTLY DISCONNECTED - using indivudal hook group files!

// TODO: use this eventually as the hook repository. 
export const useConnectionFns = () => {
  return {
    useEagerConnect,
    useConnectorImage,
    getNetworkName,
  };
};

export const useYieldFns = () => {
  return {};
};
