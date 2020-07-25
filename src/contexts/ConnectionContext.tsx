/* eslint-disable new-cap */
import React from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

// import Web3 from 'web3';

// const ethEnabled = () => {
//   if (window.ethereum) {
//     window.web3 = new Web3(window.ethereum);
//     window.ethereum.enable();
//     return true;
//   }
//   return false;
// }

import { IConnection } from '../types';

const ConnectionContext = React.createContext<any>({});

const initState:IConnection = {
  provider: null,
  altProvider: null,
  chainId: null,
  networkName: null,
  signer:null,
  voidSigner:null,
  account: null,
};

function connectionReducer(state:IConnection, action:any) {
  switch (action.type) {
    case 'updateConnection':
      return { 
        ...state,
        ...action.payload,
        // account: action.payload.account,
        // provider: action.payload.provider,
        // altProvider: action.payload.altProvider,
        // signer: action.payload.signer,
        // voidSigner: action.payload.voidSigner,
        // chainId: action.payload.chainId,
        // network: action.payload.network,
      };
    case 'setIsLoading':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const ConnectionProvider = ({ children }:any) => {

  const [state, dispatch] = React.useReducer(connectionReducer, initState);
  const [provider, setProvider] = React.useState<any>(null);
  const [altProvider, setAltProvider] = React.useState<any>(null);
  const [signer, setSigner] = React.useState<any>(null);
  // const [voidSigner, setVoidSigner] = React.useState<any>(null);
  // const [account, setAccount] = React.useState<any>(null);

  // const [networkName, setNetworkName] = React.useState<any>(null);
  // const [chainId, setChainId] = React.useState<any>(null);

  const updateConnection = async ()=>{

    let account;
    let voidSigner;
    let chainId;
    let networkName;

    dispatch({ type:'setIsLoading', payload: true });

    if (provider) {
      // signer = await provider.getSigner();
      // @ts-ignore
      // account = signer.getAddress();
      // @ts-ignore
      chainId = await provider.chainId();
      networkName = await provider.getNetwork();
    } else {
      console.log('No metamask installed - attempting  a connections');
      // setProvider(new ethers.providers.JsonRpcProvider('http://localhost:8545')); // setProvider(new ethers.providers.InfuraProvider(5, '9dbb21faf34448c9af1f3047c45b15df'));
      // setSigner(null);
      // setAccount(null);
    }

    dispatch({
      type:'updateConnection',
      payload:{
        provider,
        altProvider,
        signer,
        voidSigner,
        account,
        networkName,
        chainId,
      }
    });
    dispatch({ type:'setIsLoading', payload: false });
  };

  // React.useEffect(()=>{

  //   (async () => {
  //     provider && console.log( signer );
  //   })();
  //   // provider && updateConnection();
  //   // provider && ( async () => {
  //   //   try {
  //   //   // @ts-ignore
  //   //     window.ethereum.on('accountsChanged', async () => {
  //   //       updateConnection();
  //   //     });
  //   //     // @ts-ignore
  //   //     window.ethereum.on('chainChanged', async () => {
  //   //       updateConnection();
  //   //     });
  //   //     // @ts-ignore
  //   //     window.ethereum.on('connect', () => console.log('network connected') );
  //   //     // @ts-ignore
  //   //     window.ethereum.on('disconnect', () => console.log('network disconnected') );
  //   //   } catch (e) {console.log(e);}
  //   // })();
  // }, [provider]);

  // React.useEffect( () => {
  //   (async ()=> {
  //     const browserProvider = await detectEthereumProvider();
  //     // @ts-ignore
  //     if (browserProvider || window.ethereum ) {
  //       let _provider;
  //       browserProvider? ( _provider = new ethers.providers.Web3Provider(browserProvider) )
  //       // @ts-ignore
  //         : ( _provider = new ethers.providers.Web3Provider(window.ethereum) );
  //       setSigner( _provider.getSigner() );
  //       setProvider( _provider );
  //     } else {
  //       console.log('No applicable web3 browser client found - fallback to rpc providers' );
  //       // provider = new ethers.getDefaultProvider();
  //       // await ethers.getDefaultProvider( 'homestead', 
  //       //     { 
  //       //       infura:'9dbb21faf34448c9af1f3047c45b15df',
  //       //       // some other provider
  //       //     });
  //       //     rpcProvider.getSigner() && setSigner(_provider.getSigner())
  //       // } catch (e) {
  //       //   setProvider( new ethers.providers.JsonRpcProvider('http://localhost:8545') );
  //       // }
  //     }
  //     // const rpcProvider = await ethers.getDefaultProvider( 'homestead', 
  //     //   { 
  //     //     infura:'9dbb21faf34448c9af1f3047c45b15df',
  //     //     // some other provider
  //     //   });
  //   }
  //   )();

  // }, []);

  return (
    <ConnectionContext.Provider value={{ state, dispatch }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export { ConnectionContext, ConnectionProvider };