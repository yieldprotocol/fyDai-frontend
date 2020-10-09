import { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';

import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';

import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import { NetworkConnector } from '@web3-react/network-connector';

import { injected, walletconnect, torus } from '../connectors';

import injectedImage from '../assets/images/providers/metamask.png';
import torusImage from '../assets/images/providers/torus.png';
import noConnectionImage from '../assets/images/providers/noconnection.png';
import walletconnectImage from '../assets/images/providers/walletconnect.png';

import { NotifyContext } from '../contexts/NotifyContext';

import { useCachedState } from './appHooks';

const defaultChainId = 42;
const urls = { 
  1: process.env.REACT_APP_RPC_URL_1 as string, 
  4: process.env.REACT_APP_RPC_URL_4 as string,
  5: process.env.REACT_APP_RPC_URL_5 as string,
  42: process.env.REACT_APP_RPC_URL_42 as string,
  1337: process.env.REACT_APP_RPC_URL_31337 as string,
  31337: process.env.REACT_APP_RPC_URL_31337 as string, 
};

const useEagerConnect = () => {
  const { activate, active, chainId } = useWeb3React();
  const { activate: activateFallback } = useWeb3React('fallback');
  const [ cachedChainId, setCachedChainId ] = useCachedState('cache_chainId', null);
  const [ tried, setTried ] = useState(false);
  const { handleErrorMessage } = useWeb3Errors();

  useEffect(() => {
    injected.isAuthorized().then((isAuthorized: boolean) => {
      if (isAuthorized) {
        activate(injected, undefined, true).catch(() => {
          setTried(true);
        });
      } else {
        setTried(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!tried && active) {
      setTried(true);
      ( cachedChainId !== chainId ) && localStorage.clear();
      // eslint-disable-next-line no-console
      console.log('Web3 connected (eagerly ). Now, connecting fallback provider with same chainId');
      activateFallback( new NetworkConnector({ urls, defaultChainId: chainId }), (e) => handleErrorMessage(e));
      setCachedChainId(chainId);
    }
  }, [tried, active]);
  return tried;
};

const useInactiveListener = (suppress: boolean = false) => {
  const { active, error, activate, account: _account, chainId: _chainId } = useWeb3React();
  const { handleErrorMessage } = useWeb3Errors();

  const [ cachedChainId ] = useCachedState('cache_chainId', null);

  // eslint-disable-next-line consistent-return
  useEffect((): any => {
    const { ethereum } = window as any;
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        console.log("Handling 'connect' event");
        // activate(injected);
        if ((cachedChainId !== _chainId) && active) {
          console.log('chainId changed');
          // localStorage.clear();
          // // eslint-disable-next-line no-restricted-globals
          // location.reload();
        }
      };

      const handleAccountsChanged = (accounts: string[]) => {
        console.log("Handling 'accountsChanged' event with payload", accounts);
        if (accounts.length > 0) {
          // activate(injected);
          // if ( cachedAddress !== accounts[0] ){
          //   console.log('ACCOUNT cahnge actions')
          //   localStorage.clear();
          //   // eslint-disable-next-line no-restricted-globals
          //   location.reload();
          // }
        }
      };

      const handleNetworkChanged = (networkId: string | number) => {
        console.log("Handling 'network!Changed' event with payload", networkId);
        // activate(injected);
        if ((cachedChainId !== networkId) && active){
          console.log('NETWORK change actions');
          // localStorage.clear();
          // // eslint-disable-next-line no-restricted-globals
          // location.reload();
        }
      };

      const handleChainChanged = (chainId: string | number) => {
        // (cachedChainId !== chainId) && localStorage.clear();
        console.log("Handling 'chain!Changed' event with payload", chainId);
        // activate(injected);
        if ((cachedChainId !== chainId) && active){
          console.log('CHAIN cahnge actions');
          // localStorage.clear();
          // // eslint-disable-next-line no-restricted-globals
          // location.reload();
        }
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
};

const useFallbackConnect = (triedEager: boolean = false) => {
  const { active } = useWeb3React();
  const [ cachedChainId, setCachedChainId ] = useCachedState('cache_chainId', null);
  const { activate: activateFallback, active: fallbackActive } = useWeb3React('fallback');
  const { handleErrorMessage } = useWeb3Errors();

  useEffect(()=>{
    if ( triedEager && !active && !fallbackActive ) {        
      ( cachedChainId !== defaultChainId ) && localStorage.clear();
      activateFallback( new NetworkConnector({ urls, defaultChainId }), (e) => handleErrorMessage(e));
      setCachedChainId(defaultChainId);
    }
  }, [active, fallbackActive, triedEager ]);
};

/* useConnection ig the GAteway into the web3 connections */
export function useConnection() {
  const { dispatch: notifyDispatch } = useContext(NotifyContext);
  const [ cachedChainId, setCachedChainId ] = useCachedState('cache_chainId', null);
  const { 
    connector,
    activate,
    chainId,
  } = useWeb3React();
  const { handleErrorMessage } = useWeb3Errors();

  /* Try web3 initiate automatically irrespective of state */
  const [activatingConnector, setActivatingConnector] = useState<any>();
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  /* 'Eager' connect checks to see if there is an active web3 browser connection */
  const triedEager = useEagerConnect();
  /* Start the fallback provider ( using triedEager as a flag ). NB! This can ONLY connect to the default network before connecting metamask */
  useFallbackConnect(triedEager || activatingConnector);
  /* Fire the inactive event listner gets started if eager connect has been tried unsuccessfully - this waits for a web3 browser connection changes */
  useInactiveListener(!triedEager || !!activatingConnector);

  /* Watch the chain id. If it changes, and if it is different from the previously loaded chainId (stored in the cache), 
  clear EVERYTHING from cache and reset the app - it will be different info */
  useEffect(()=>{
    if (chainId && cachedChainId && (cachedChainId !== chainId) ) { 
      localStorage.clear();
      // eslint-disable-next-line no-restricted-globals
      location.reload();
    };
  }, [ chainId ]);

  /* handle changing connector */
  const handleSelectConnector = async (_connection: any) => {
    await activate(    
      _connection, 
      (x) => handleErrorMessage(x)
    );
  };

  return { handleSelectConnector };
}

const useWeb3Errors = ()=> {
  const { dispatch: notifyDispatch } = useContext(NotifyContext);
  const NO_BROWSER_EXT = 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  const UNSUPPORTED_NETWORK = 'Your Wallet or Browser is connected to an unsupported network.';
  const UNAUTHORISED_SITE = 'Please authorize this website to access your Ethereum account.';
  const UNKNOWN_ERROR = 'An unknown error occurred. Check the console for more details.';

  const handleErrorMessage = (error: Error) => {
    if (error instanceof NoEthereumProviderError) {
      // eslint-disable-next-line no-console
      console.log(NO_BROWSER_EXT);
      notifyDispatch( { type:'notify', payload:{ message: NO_BROWSER_EXT, type: 'info' } });
      return NO_BROWSER_EXT;
    }
    if (error instanceof UnsupportedChainIdError) {
      // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error(error);
    notifyDispatch( { type:'notify', payload:{ message: UNKNOWN_ERROR, type: 'info' } });
    return  UNKNOWN_ERROR;
  };
  return { handleErrorMessage };
};

export function useSignerAccount() {
  const { library: provider, account } = useWeb3React();
  const { library: altProvider } = useWeb3React('fallback');
  const [ signer, setSigner ] = useState<any>();
  const [ voidSigner, setVoidSigner ] = useState<any>();
  const [ fallbackProvider, setFallbackProvider ] = useState<any>();
  useEffect(()=>{
    provider && (async () => {
      setSigner( await provider.getSigner() );
      account && setVoidSigner( new ethers.VoidSigner( account ));
    })();
  }, [account, provider]);

  useEffect(()=>{
    altProvider && (async () => {
      setFallbackProvider( altProvider );
    })();
  }, [account, altProvider]);
  return { signer, provider, account, voidSigner, fallbackProvider };
}