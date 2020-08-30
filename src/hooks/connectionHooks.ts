import React from 'react';
import { ethers } from 'ethers';

import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';

import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import { injected, trezor, walletlink, torus, network, ledger } from '../connectors';

import injectedImage from '../assets/images/providers/metamask.png';
import trezorImage from '../assets/images/providers/trezor.png';
import walletlinkImage from '../assets/images/providers/walletlink.png';
import torusImage from '../assets/images/providers/torus.png';
import noConnectionImage from '../assets/images/providers/noconnection.png';
import { NotifyContext } from '../contexts/NotifyContext';


export function useEagerConnect() {
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
  }, []); // intentionally only running on mount (make sure it's only mounted once :))
  // if the connection worked, wait until we get confirmation of that to flip the flag
  React.useEffect(() => {
    if (!tried && active) {
      setTried(true);
    }
  }, [tried, active]);
  return tried;
}


export function useInactiveListener(suppress: boolean = false) {
  const { active, error, activate } = useWeb3React();
  const { chainId: fallbackChainId } = useWeb3React('fallback');

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


// TODO: get rid of this
export function useConnectorImage() {
  const { connector } = useWeb3React();
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


export function useConnection() {
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const { 
    chainId,
    connector,
    activate 
  } = useWeb3React();
  
  const { 
    chainId: fallbackChainId, 
    connector: fallbackConnector,
    activate: fallbackActivate,
  } = useWeb3React('fallback');

  /* try web3 initiate automatically irrespective of state */
  const [activatingConnector, setActivatingConnector] = React.useState<any>();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);
  const triedEager = useEagerConnect();
  useInactiveListener(!triedEager || !!activatingConnector);
  
  /* Always connect ot Fallback provider */
  React.useEffect(() => {
    (async () => { 
      await fallbackActivate(network, (x) => handleErrorMessage(x));
      fallbackConnector && console.log('fallback connected via RPC to chain:', fallbackChainId);
    })();
  }, [fallbackConnector]);

  /* Watch the injected chain and match the fallbackProvider accordingly */
  React.useEffect(() => {
    if ( chainId && chainId !== fallbackChainId ) {
      localStorage.clear();
      console.log('Network Changed to ', chainId, ' changing fallback provider, accordlingly.');
      // @ts-ignore
      fallbackConnector.changeChainId(chainId);
    }
  }, [ chainId ]);

  /* handle changing connector */
  const handleSelectConnector = async (_connection: any) => {
    await activate(    
      _connection, 
      (x) => handleErrorMessage(x)
    );
  };

  const handleErrorMessage = (error: Error) => {
    const NO_BROWSER_EXT = 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
    const UNSUPPORTED_NETWORK = 'Your Wallet or Browser is connected to an unsupported network.';
    const UNAUTHORISED_SITE = 'Please authorize this website to access your Ethereum account.';
    const UNKNOWN_ERROR = 'An unknown error occurred. Check the console for more details.';

    if (error instanceof NoEthereumProviderError) {
      console.log(NO_BROWSER_EXT);
      notifyDispatch( { type:'notify', payload:{ message: NO_BROWSER_EXT, type: 'info' } });
      return NO_BROWSER_EXT;
    }
    if (error instanceof UnsupportedChainIdError) {
      console.log(UNSUPPORTED_NETWORK);
      notifyDispatch( { type:'notify', payload:{ message: UNSUPPORTED_NETWORK, type: 'error' } });
      return UNSUPPORTED_NETWORK;
    }
    if (
      error instanceof UserRejectedRequestErrorInjected // || error instanceof UserRejectedRequestErrorWalletConnect || error instanceof UserRejectedRequestErrorFrame
    ) {
      notifyDispatch( { type:'notify', payload:{ message: UNAUTHORISED_SITE, type: 'info' } });
      return UNAUTHORISED_SITE;
    }
    console.error(error);
    notifyDispatch( { type:'notify', payload:{ message: UNKNOWN_ERROR, type: 'info' } });
    return  UNKNOWN_ERROR;
  };

  return { handleSelectConnector, handleErrorMessage };
}


export function useSignerAccount() {
  const { library: provider, account } = useWeb3React();
  const { library: altProvider } = useWeb3React('fallback');
  const [ signer, setSigner ] = React.useState<any>();
  const [ voidSigner, setVoidSigner ] = React.useState<any>();
  const [ fallbackProvider, setFallbackProvider ] = React.useState<any>();
  React.useEffect(()=>{
    provider && (async () => {
      setSigner( await provider.getSigner() );
      account && setVoidSigner( new ethers.VoidSigner( account ));
    })();
  }, [account, provider]);

  React.useEffect(()=>{
    altProvider && (async () => {
      setFallbackProvider( altProvider );
    })();
  }, [account, altProvider]);

  return { signer, provider, account, voidSigner, fallbackProvider };
}
