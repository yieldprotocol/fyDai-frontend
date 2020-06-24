import React from 'react';
import { ethers } from 'ethers';

const Web3Context = React.createContext<any>({});

const initState = {
  account: '',
  provider: {},
};

function web3Reducer(state:any, action:any) {
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

const Web3Provider = ({ children }:any) => {

  const [state, dispatch] = React.useReducer(web3Reducer, initState);
  const updateProvider = async ()=>{
    dispatch({ type:'toggleLoading', payload: true });
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    // const provider = new ethers.getDefaultProvider();
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    console.log(account);
    const { chainId } = await provider.getNetwork();
    console.log(chainId);
    dispatch({ 
      type:'update', 
      payload:{ 
        provider,
        signer,
        account,
        chainId, 
      } 
    });
    dispatch({ type:'toggleLoading', payload: false });
  };

  React.useEffect( () => {
    updateProvider();
    ( async () => {
      // @ts-ignore
      window.ethereum.on('accountsChanged', async () => {
        updateProvider();
      });
      // @ts-ignore
      window.ethereum.on('networkChanged', async () => {
        updateProvider();
      });
    })();
  }, []);

  return (
    <Web3Context.Provider value={{ state, dispatch }}>
      {children}
    </Web3Context.Provider>
  );
};

export { Web3Context, Web3Provider };