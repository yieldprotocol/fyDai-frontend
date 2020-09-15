import React, { useEffect, useState, useContext } from 'react';

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
  useWeb3React,
  useConnection,
  useCachedState 
} from '../../hooks';

import { injected, trezor, walletlink, torus, ledger } from '../../connectors';

import metamaskImage from '../../assets/images/providers/metamask.png';
import trezorImage from '../../assets/images/providers/trezor.png';
import walletlinkImage from '../../assets/images/providers/walletlink.png';
import torusImage from '../../assets/images/providers/torus.png';
// import noConnectionImage from '../assets/images/noconnection.png';

import { NotifyContext } from '../../contexts/NotifyContext';


const AuthsLayer = ({ open, closeLayer }: any) => {
  const screenSize = useContext(ResponsiveContext);
  const { state: { requestedSigs }, dispatch } = useContext(NotifyContext);

  const { handleSelectConnector } = useConnection();

  return (
    <>
      {open && (
        <Layer
          onClickOutside={() => closeLayer(true)}
          animation="slide"
          onEsc={() => closeLayer(true)}
        >
          <Box
            width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
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
                Requested Signatures: 
              </Heading>
            </Header>
            <Box align="center" pad="medium" gap="small">
              <Paragraph>The following authorisations are required: </Paragraph>
              {requestedSigs.map((x:any) => (
                <Box key={x.id} direction='row' gap='large'> 
                  {x.desc}
                  {x.id}
                  {x.signed}               
                </Box> 
              ))}
            </Box>
            <Footer direction="column" pad="medium">
              some footer if required
            </Footer>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default AuthsLayer;
