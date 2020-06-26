/* eslint-disable new-cap */
import React from 'react';
import { ethers } from 'ethers';

const ConnectionContext = React.createContext<any>({});

const initState = {
  account: null,
  provider: null,
  signer:null,
  chainId: null,
  network: null,
};

function connectionReducer(state:any, action:any) {
  switch (action.type) {
    case 'update':
      return { 
        ...state,
        account: action.payload.account,
        provider: action.payload.provider,
        signer: action.payload.signer,
        chainId: action.payload.chainId,
      };
    case 'toggleLoading':
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

  const updateConnection = async ()=>{

    dispatch({ type:'toggleLoading', payload: true });
    // @ts-ignore
    const signerProvider = new ethers.providers.Web3Provider(window.ethereum);
    
    // @ts-ignore
    const provider = new ethers.getDefaultProvider(5);
    const signer = signerProvider.getSigner();
    const account = await signer.getAddress();
    const network = await provider.getNetwork();

    // console.log( localStorage.provider );
    console.log(signerProvider);

    dispatch({ 
      type:'update',
      payload:{
        provider,
        signer,
        account,
        network,
        chainId: network.chainId,
      }
    });
    dispatch({ type:'toggleLoading', payload: false });
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
      } catch (e) {console.log(e);}
    })();
  }, []);

  return (
    <ConnectionContext.Provider value={{ state, dispatch }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export { ConnectionContext, ConnectionProvider };