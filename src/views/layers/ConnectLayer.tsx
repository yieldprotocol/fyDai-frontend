import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Anchor, Grommet, grommet, Grid, Layer, Main, Image, Header, Heading, Footer, Button, Box, Avatar, Text, CheckBox, ThemeContext, Paragraph } from 'grommet';
import { 
  FaTimes as Close,
} from 'react-icons/fa';

import { injected, trezor, walletlink, torus, ledger } from '../../connectors';
// import { useGetWeiBalance, useEagerConnect, useConnectorImage, getNetworkName }  from './hooks/connectionFns';


import metamaskImage from '../../assets/images/metamask.png';
import trezorImage from '../../assets/images/trezor.png';
import walletlinkImage from '../../assets/images/walletlink.png';
import torusImage from '../../assets/images/torus.png';
// import noConnectionImage from '../assets/images/noconnection.png';

const ConnectLayer = (props:any) => {
  const { activate } = useWeb3React();
  const { closeLayer } = props;
  React.useEffect(() => {
    // (async () => activate(injected, console.log))();
  }, []);

  const handleSelectConnector = async (_connection:any) => {
    await activate(_connection, console.log);
    console.log('connected');
    closeLayer();
  };

  const connectorList = [
    { name:'Metamask', image:metamaskImage, connection:injected },
    { name:'Tezor', image:trezorImage, connection:trezor },
    { name:'Torus', image:torusImage, connection:torus },
    { name:'Walletlink', image:walletlinkImage, connection:walletlink }
  ];

  return (
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
          background='background-frontheader'
          pad={{ horizontal: 'medium', vertical:'large' }}
        >
          {/* <Heading level='4' >Connect to a Wallet</Heading> */}
          <Box 
            round='xlarge' 
            // background='brand'
            border={{ color: 'brand' }}
            pad={{ horizontal: 'medium', vertical:'xsmall' }}
          >
            <Text>Connect to a Wallet</Text>
          </Box>
          <Anchor color='brand' onClick={()=>closeLayer()} size='xsmall' label='Cancel'/>
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
    </Layer>
  );
};

export default ConnectLayer;