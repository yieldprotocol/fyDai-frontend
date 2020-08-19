import React from 'react';

import { UnsupportedChainIdError } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector';

import {
  Anchor,
  Layer,
  Image,
  Header,
  Heading,
  Footer,
  Button,
  Box,
  Text,
  ResponsiveContext,
  Paragraph,
} from 'grommet';
import {
  useEagerConnect,
  useInactiveListener,
  useWeb3React,
  useConnection,
  useCachedState 
} from '../../hooks';

import { network, injected, trezor, walletlink, torus, ledger } from '../../connectors';

import metamaskImage from '../../assets/images/providers/metamask.png';
import trezorImage from '../../assets/images/providers/trezor.png';
import walletlinkImage from '../../assets/images/providers/walletlink.png';
import torusImage from '../../assets/images/providers/torus.png';
// import noConnectionImage from '../assets/images/noconnection.png';

import { NotifyContext } from '../../contexts/NotifyContext';

const ConnectLayer = ({ open, closeLayer }: any) => {
  const screenSize = React.useContext(ResponsiveContext);

  const { handleSelectConnector } = useConnection();

  const connectorList = [
    { name: 'Metamask', image: metamaskImage, connection: injected },
    { name: 'Tezor', image: trezorImage, connection: trezor },
    { name: 'Torus', image: torusImage, connection: torus },
    { name: 'Walletlink', image: walletlinkImage, connection: walletlink },
    { name: 'Ledger', image: walletlinkImage, connection: ledger },
  ];

  return (
    <>
      {open && (
        <Layer
          onClickOutside={() => closeLayer(true)}
          animation="slide"
          onEsc={() => closeLayer(true)}
        >
          <Box
            background="background-front"
            direction="column"
            fill="vertical"
            style={{
              borderRadius: '0.5rem',
              padding: '2rem',
            }}
          >
            <Header fill="horizontal" gap="medium">
              <Heading
                level="2"
                style={{
                  textAlign: 'center',
                  margin: 'auto',
                }}
              >
                Connect to a Wallet
              </Heading>
            </Header>
            <Box align="center" pad="medium" gap="small">
              <Paragraph>Try connecting with:</Paragraph>
              {connectorList.map((x) => (
                <Button
                  hoverIndicator="border"
                  onClick={() => { handleSelectConnector(x.connection); closeLayer();}}
                  label={x.name}
                  color="border"
                  fill="horizontal"
                  icon={
                    <Box
                      height="1rem"
                      width="1rem"
                      style={{
                        position: 'absolute',
                        left: '1rem',
                      }}
                    >
                      <Image src={x.image} fit="contain" />
                    </Box>
                  }
                  style={{
                    marginBottom: '1rem',
                    fontWeight: 500,
                    position: 'relative',
                    padding: '0.5rem',
                  }}
                  key={x.name}
                />
              ))}
            </Box>
            <Footer direction="column" pad="medium">
              <Box gap="xsmall" direction="row">
                <Anchor href="#" label="Help!" size="xsmall" color="brand" />
                <Text size="xsmall"> I'm not sure what this means.</Text>
              </Box>
              <Box direction="row">
                <Button
                  label="Close"
                  fill="horizontal"
                  color="border"
                  style={{
                    fontWeight: 600,
                    height: screenSize === 'small' ? '2.25rem' : 'auto',
                  }}
                  onClick={() => closeLayer()}
                />
              </Box>
            </Footer>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default ConnectLayer;
