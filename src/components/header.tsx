import React, { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Grid, grommet, Image, Header as GromHeader, Heading, Button, Box, Text, ThemeContext } from 'grommet';
import { 
  FaUser as User,
  FaSeedling as Seedling,
  FaTimes as Connection,
} from 'react-icons/fa';
import { useConnectorImage } from '../hooks/connectionFns';
// import { injected } from '../connectors';

import logoDark from '../assets/images/yield.svg';
import logoLight from '../assets/images/yield_light.svg';

const ProfileButton = (props:any) => {
  const { account } = useWeb3React();
  const connectorImage = useConnectorImage();
  
  return ( account?
    <Button 
    //  icon={<User size='16' />}
      icon={<Box height="15px" width="15px"><Image src={connectorImage} fit='contain' /></Box>}
      label={`${account.substring(0, 6)}...${account.substring(account.length-4)}`}
      onClick={()=>console.log('clicked')}
    /> :
    <Box direction='row' gap='xsmall'>
      <Connection /> 
      <Text size='xsmall'>
        No Connected Wallet
      </Text>
    </Box>
  );
};

function Header() {

  const theme = React.useContext<any>(ThemeContext);

  console.log(theme);

  React.useEffect(() => {
    // Do something else now
    // (async () => activate(injected, console.log))();
  }, []);

  return (
    <GromHeader 
      elevation="xsmall"
      // align="center"
      // direction="row"
      // justify="between"
      gap="xlarge"
      fill="horizontal"
      pad={{ horizontal: 'large', vertical:'xsmall' }}
      
    >
      <Box height='xsmall' align='start'><Box width='xsmall'><Image src={theme.dark?logoLight:logoDark} fit='contain' /></Box></Box>
      <ProfileButton />
    </GromHeader>
  );
}

export default Header;
