/* eslint-disable new-cap */
import React from 'react';
import { ethers } from 'ethers';

const ConnectionContext = React.createContext<any>({});

const initState = {
  account: null,
  provider: null,
  txProvider: null,
  signer:null,
  chainId: null,
  network: null,
};

function connectionReducer(state:any, action:any) {
  switch (action.type) {
    case 'init':
      return { 
        ...state,
        account: action.payload.account,
        provider: action.payload.provider,
        txProvider: action.payload.txProvider,
        signer: action.payload.signer,
        chainId: action.payload.chainId,
        network: action.payload.network,
      };
    case 'setIsLoading':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'closeNotify':
      return { ...state, open: false };
    case 'openNotify':
      return { ...state, open: true };
    default:
      return state;
  }
}

const ConnectionProvider = ({ children }:any) => {

  const [state, dispatch] = React.useReducer(connectionReducer, initState);
  // const [provider, setProvider] = React.useState<any>();
  // const [account, setAccount] = React.useState<any>();
  // const [signer, setSigner] = React.useState<any>();
  // const [network, setNetwork] = React.useState<any>();
  
  const updateConnection = async ()=>{

    let signer;
    let provider;
    let network;
    let account;
    let altProvider;

    dispatch({ type:'setIsLoading', payload: true });
    // @ts-ignore
    if (window.ethereum) {
      // @ts-ignore
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner(); 
      account = await signer.getAddress();
      network = provider? ( await provider.getNetwork()) : null;
    } else {
      console.log('No metamask installed');
      // setProvider(new ethers.providers.InfuraProvider(5, '9dbb21faf34448c9af1f3047c45b15df'));
      provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
      signer = null;
      account= null;
      network={ chainId:1337 };
      // @ts-ignore
      // altProvider = new ethers.getDefaultProvider(5);
      // @ts-ignore
      // altProvider = new ethers.providers.InfuraProvider('9dbb21faf34448c9af1f3047c45b15df');
      // altProvider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
      // console.log(await altProvider.getSigner());
    }

    dispatch({
      type:'init',
      payload:{
        provider,
        altProvider,
        signer,
        account,
        network,
        chainId: network?.chainId,
      }
    });
    dispatch({ type:'setIsLoading', payload: false });
  };

  React.useEffect( () => {
    updateConnection();
    ( async () => {
      try {
      // @ts-ignore
        window.ethereum.on('accountsChanged', async () => {
          updateConnection();
        });
        // @ts-ignore
        window.ethereum.on('networkChanged', async () => {
          updateConnection();

        });
      } catch (e) { console.log(e); }
    })();
  }, []);

  return (
    <ConnectionContext.Provider value={{ state, dispatch }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export { ConnectionContext, ConnectionProvider };