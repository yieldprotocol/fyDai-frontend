import React, { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Image, Text, Button, Box } from 'grommet';

import { useConnectorImage } from '../hooks/connectionHooks';

import { Web3Context } from '../contexts/Web3Context'; 

const ProfileButton = (props: any) => {
  // const { account } = React.useContext(Web3Context);
  const [ accLabel, setAccLabel ] = React.useState<string>('');
  // const [ connectorImage, setConnectorImage ] = React.useState<string>('');
  const { action, account } = props;

  React.useEffect(()=>{
    (async () => {
      setAccLabel(`${account?.substring(0, 4)}...${account?.substring(account.length - 4)}`);
    })(); 
  }, [account]);

  return (
    <>
      <Box 
        round='small'
        onClick={() => action && action()}
        hoverIndicator='brandTransparent'
        border='all'
        pad={{ vertical:'xsmall', horizontal:'small' }}
        direction='row'
        gap='small'
        align='center'
      >
        {/* <Box height="15px" width="15px">
          <Image src={connectorImage} fit="contain" />
        </Box> */}
        <Text> {accLabel}
        </Text>
      </Box>
    </>
  );
};

export default ProfileButton;
