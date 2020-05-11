import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Grommet, grommet, Grid, Layer, Main, Image, Header, Heading, Footer, Button, Box, Avatar, Text, CheckBox, ThemeContext } from 'grommet';
import { 
  FaTimes as Close,
} from 'react-icons/fa';

import { injected, trezor, walletlink, torus, ledger } from '../connectors';
// import { useGetWeiBalance, useEagerConnect, useConnectorImage, getNetworkName }  from './hooks/connectionFns';


import metamaskImage from '../assets/images/metamask.png';
import trezorImage from '../assets/images/trezor.png';
import walletlinkImage from '../assets/images/walletlink.png';
import torusImage from '../assets/images/torus.png';
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
    <Layer animation='slide'>
      <Box 
        align="center"
        direction="row"
        gap="small"
        justify="between"
        round="medium"
        elevation="medium"
        // pad='none'
        background='background-front'
      >
        <Box fill='horizontal' pad='none'>
          <Header round="medium" pad='medium' fill='horizontal' background='background-frontheader'>
            <Heading level='3'>Connect to a Wallet</Heading>
            <Close onClick={()=>closeLayer()} />
          </Header>
          <Box 
            wrap
            align="center"
            justify="center"
            pad="medium"
            gap='small'
          >
            <p>Try connect with:</p>
            {connectorList.map((x) => (
              <Button 
                fill
              // color="border"
              // hoverIndicator="background"
                key={x.name}
                icon={<Box height="15px" width="15px"><Image src={x.image} fit='contain' /></Box>}
                label={x.name}
                onClick={() => handleSelectConnector(x.connection)}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Layer>
  );
};

export default ConnectLayer;