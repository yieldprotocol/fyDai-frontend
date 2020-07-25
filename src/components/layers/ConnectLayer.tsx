import React from 'react';

import { UnsupportedChainIdError } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector';

import { Anchor, Grommet, grommet, Grid, Layer, Main, Image, Header, Heading, Footer, Button, Box, Avatar, Text, CheckBox, ThemeContext, Paragraph } from 'grommet';
import { useEagerConnect, useInactiveListener, useWeb3React } from '../../hooks';


import { injected, trezor, walletlink, torus, ledger } from '../../connectors';

import metamaskImage from '../../assets/images/providers/metamask.png';
import trezorImage from '../../assets/images/providers/trezor.png';
import walletlinkImage from '../../assets/images/providers/walletlink.png';
import torusImage from '../../assets/images/providers/torus.png';
// import noConnectionImage from '../assets/images/noconnection.png';

function getErrorMessage(error: Error) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.';
  } if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network.";
  } if (
    error instanceof UserRejectedRequestErrorInjected // ||
    // error instanceof UserRejectedRequestErrorWalletConnect ||
    // error instanceof UserRejectedRequestErrorFrame
  ) {
    return 'Please authorize this website to access your Ethereum account.';
  }
  console.error(error);
  return 'An unknown error occurred. Check the console for more details.';
}

const ConnectLayer = (props:any) => {
  const { connector, activate } = useWeb3React();
  const { open, closeLayer } = props;

  /* web3 initiate */
  const [activatingConnector, setActivatingConnector] = React.useState<any>();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);
  const triedEager = useEagerConnect();
  useInactiveListener(!triedEager || !!activatingConnector);
  const handleSelectConnector = async (_connection:any) => {
    await activate(_connection, console.log );
    closeLayer();
  };

  const connectorList = [
    { name:'Metamask', image:metamaskImage, connection:injected },
    { name:'Tezor', image:trezorImage, connection:trezor },
    { name:'Torus', image:torusImage, connection:torus },
    { name:'Walletlink', image:walletlinkImage, connection:walletlink },
    { name:'ledger', image:walletlinkImage, connection:ledger }
  ];

  return (
    <>
      { open && 
      <Layer animation='slide' position='right' full="vertical">
        <Box 
          direction='column'
          fill='vertical'
          background='background-front'
         // alignContent='center'
          style={{ minWidth: '240px' }}
        >
          <Header 
            round={{ corner:'bottom', size:'medium' }}
            fill='horizontal'
            background='background-mid'
            pad={{ horizontal: 'medium', vertical:'large' }}
          >
            {/* <Heading level='4' >Connect to a Wallet</Heading> */}
            <Box 
              round='xlarge'
              border={{ color: 'brand' }}
              pad={{ horizontal: 'medium', vertical:'xsmall' }}
            >
              <Text>Connect to a Wallet</Text>
            </Box>
            <Anchor color='brand' onClick={()=>closeLayer()} size='xsmall' label='Cancel' />
          </Header>
          <Box 
            align='center'
            pad='medium'
            gap='small'
          >
            <Paragraph>Try connecting with:</Paragraph>
            {connectorList.map((x) => (
              <Button 
                fill='horizontal'
                color="border"
                hoverIndicator="border"
                key={x.name}
                icon={<Box height="15px" width="15px"><Image src={x.image} fit='contain' /></Box>}
                label={x.name}
                onClick={() => handleSelectConnector(x.connection)}
              />
            ))}
          </Box>
          <Footer
            pad='medium'
          >
            <Box gap='xsmall' direction='row'>
              <Anchor href="#" label="help!" size='xsmall' color='brand' />
              <Text size='xsmall'> I'm not sure what this means.</Text>
            </Box>
          </Footer>
        </Box>
      </Layer>}
    </>
  );
};

export default ConnectLayer;