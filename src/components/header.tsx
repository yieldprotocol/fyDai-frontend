import React from 'react';
import { useWeb3React } from '@web3-react/core';

import { Grommet, Collapsible, Grid, Main, Header as GromHeader, Heading, Footer, Button, Box, Avatar, Text, CheckBox } from 'grommet';
import { 
  FaUser as User,
  FaSeedling as Seedling,
  FaTimes as Connection,
} from 'react-icons/fa';

const ProfileButton = (props:any) => {
  const { account } = props;
  return ( account?
    <Button 
      icon={<User size='16' />}
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
  const { active, account } = useWeb3React();

  React.useEffect(() => {
    // Do something
    // (async () => activate(injected, console.log))();
  }, []);

  return (
    <GromHeader 
      elevation="xsmall"
      align="center"
      direction="row"
      justify="between"
      gap="medium"
      fill="horizontal"
      pad={{ horizontal: 'large', vertical:'xsmall' }}
    >
      <Seedling />
      <Heading> Yield </Heading>
      <ProfileButton account={account} />
    </GromHeader>
  );
}

export default Header;
