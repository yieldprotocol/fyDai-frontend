import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers'; 

import Maker from '@makerdao/dai';
import { McdPlugin } from '@makerdao/dai-plugin-mcd';

import ProviderBridge from 'ethers-web3-bridge';

import { injected, trezor, walletlink, torus } from '../connectors';

import injectedImage from '../assets/images/metamask.png';
import trezorImage from '../assets/images/trezor.png';
import walletlinkImage from '../assets/images/walletlink.png';
import torusImage from '../assets/images/torus.png';
import noConnectionImage from '../assets/images/noconnection.png';

export async function useGetWeiBalance() {
  const web3React = useWeb3React();
  const { library, account } = web3React;
  if (!!library && !!account) {
    const bal = await library.getBalance(account);
    return bal.toString();
  }
  return '-';
}

// Eager connect is an attempt to 'auto connect' to injected connection eg. Metamask.
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
  }, [activate]);

  // if the connection worked, wait until we get confirmation of that to flip the flag
  React.useEffect(() => {
    if (!tried && active) {
      setTried(true);
    }
  }, [tried, active]);
  return tried;
}

export function useConnectorImage() {
  const { connector } = useWeb3React();
  const [image, setImage] = React.useState<any>();
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


export const useSendTx = () => {

  const { library } = useWeb3React();
  const signer = library && library.getSigner(); 
  const transaction = {
    nonce: 0,
    gasLimit: 21000,
    gasPrice: ethers.utils.bigNumberify('20000000000'),
    to: '0xcd16CA1398DA7b8f072eCF0028A3f4677B19fcd0',
    // ... or supports ENS names
    // to: "ricmoo.firefly.eth",
    value: ethers.utils.parseEther('1.0'),
    data: '0x',
    // This ensures the transaction cannot be replayed on different networks
    chainId: ethers.utils.getNetwork('homestead').chainId
  };
  const sendTx = () => {
    signer && signer.sendTransaction(transaction);
  };
  return sendTx;

};

export const useMakerVault = () => {

  const { library, connector } = useWeb3React();
  const [maker, setMaker] = React.useState();
  const web3Provider = library && new ProviderBridge(library.provider, library.getSigner());
  // React.useEffect(()=>{
  //   ( async () => {
  //     const newMaker = await Maker.create('browser', { web3 : { inject : library.provider } } );
  //     await newMaker.authenticate();
  //     console.log('authed - check');
  //     setMaker(newMaker);
  //   }
  //   )();
  // }, []);

  const makerVault = async () => {

    // console.log( await connector?.getProvider() );
    // const newMaker = connector &&  await Maker.create('http', { web3 : { inject : await connector.getProvider()}, autoAuthenticate:false } );
    // const newMaker = web3Provider &&  await Maker.create('http', {} );
    // await newMaker.authenticate();
    // console.log('authed - check');
    // setMaker(newMaker);

    if (maker) {
      console.log( maker );
    }
  };

  return makerVault;

};