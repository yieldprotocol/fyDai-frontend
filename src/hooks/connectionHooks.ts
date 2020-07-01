import React from 'react';

import { useWeb3React } from '@web3-react/core';
import { injected, trezor, walletlink, torus } from '../connectors';

import injectedImage from '../assets/images/providers/metamask.png';
import trezorImage from '../assets/images/providers/trezor.png';
import walletlinkImage from '../assets/images/providers/walletlink.png';
import torusImage from '../assets/images/providers/torus.png';
import noConnectionImage from '../assets/images/providers/noconnection.png';

import { ConnectionContext } from '../contexts/ConnectionContext';

// Eager connect is an attempt to 'auto connect' to injected connection eg. Metamask.
export function useEagerConnect() {
  console.log('eager connect fired');
  const { activate, active } = useWeb3React();
  const [tried, setTried] = React.useState(false);
  React.useEffect(() => {
    injected.isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true);
        });
      } else {
        setTried(true);
      }
    });
  }, [activate]);
  // if the connection worked, wait until we get confirmation of that to flip the flag
  React.useEffect(() => {
    if (!tried && active) {
      setTried(true);
    }
  }, [tried, active]);
  return [ tried ] as const;
}

export function useConnectorImage() {
  const { connector } = useWeb3React();
  const { state:{ provider } } = React.useContext(ConnectionContext);
  const [ image, setImage ] = React.useState<any>();
  React.useEffect(() => {
    switch (connector) {
      case injected:
        setImage(injectedImage);
        break;
      case trezor:
        setImage(trezorImage);
        break;
      case walletlink:
        setImage(walletlinkImage);
        break;
      case torus:
        setImage(torusImage);
        break;
      default:
        setImage(noConnectionImage);
    }
  }, [connector]);
  return image;
}

// TODO: not a hook... but here for the time-being. 
export function getNetworkName(networkId: Number) {
  switch (networkId) {
    case 1: {
      return 'Main Ethereum Network';
    }
    case 3: {
      return 'Ropsten Test Network';
    }
    case 4: {
      return 'Rinkeby Test Network';
    }
    case 5: {
      return 'Görli Test Network';
    }
    case 42: {
      return 'Kovan Test Network';
    }
    case 1337: {
      return 'Ganache Localhost';
    }
    default: {
      return '..ummm...';
    }
  }
}

export function useInactiveListener(suppress: boolean = false) {
  const { active, error, activate } = useWeb3React();

  // eslint-disable-next-line consistent-return
  React.useEffect((): any => {
    const { ethereum } = window as any;
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        console.log("Handling 'connect' event");
        activate(injected);
      };
      const handleChainChanged = (chainId: string | number) => {
        console.log("Handling 'chainChanged' event with payload", chainId);
        activate(injected);
      };
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("Handling 'accountsChanged' event with payload", accounts);
        if (accounts.length > 0) {
          activate(injected);
        }
      };
      const handleNetworkChanged = (networkId: string | number) => {
        console.log("Handling 'networkChanged' event with payload", networkId);
        activate(injected);
      };

      ethereum.on('connect', handleConnect);
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('networkChanged', handleNetworkChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('connect', handleConnect);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('networkChanged', handleNetworkChanged);
        }
      };
    }
  }, [active, error, suppress, activate]);
}

