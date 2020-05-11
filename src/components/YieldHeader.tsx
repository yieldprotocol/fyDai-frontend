import React, { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Grid, grommet, Image, Header, Heading, Button, Box, Text, ThemeContext } from 'grommet';

import { useConnectorImage } from '../hooks/connectionFns';

import logoDark from '../assets/images/yield.svg';
import logoLight from '../assets/images/yield_light.svg';

const ProfileButton = () => {
  const { account } = useWeb3React();
  const connectorImage = useConnectorImage();
  return (<Button
    icon={<Box height="15px" width="15px"><Image src={connectorImage} fit='contain' /></Box>}
    label={`${account?.substring(0, 6)}...${account?.substring(account.length-4)}`}
    onClick={()=>console.log('clicked')}
  />);
};

const YieldHeader = (props:any) =>  {
  const { openConnectLayer } = props;
  const { account } = useWeb3React();
  const theme = React.useContext<any>(ThemeContext);

  React.useEffect(() => {
    // Do something else now
    // (async () => activate(injected, console.log))();
  }, []);

  return (
    <Header
      elevation="xsmall"
      gap="xlarge"
      fill="horizontal"
      pad={{ horizontal: 'large', vertical:'xsmall' }}
    >
      <Box height='xsmall' align='start'><Box width='xsmall'><Image src={theme.dark?logoLight:logoDark} fit='contain' /></Box></Box>
      {account ? <ProfileButton /> : <Button label='Connect to a wallet' onClick={()=>openConnectLayer()} />}
    </Header>
  );
};

export default YieldHeader;
