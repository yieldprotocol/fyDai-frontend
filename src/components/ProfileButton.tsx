import React, { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Image, Text, Button, Box } from 'grommet';

import { useConnectorImage } from '../hooks/connectionHooks';

const ProfileButton = (props: any) => {
  const { account } = useWeb3React();
  const { action } = props;
  const connectorImage = useConnectorImage();
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
        <Box height="15px" width="15px">
          <Image src={connectorImage} fit="contain" />
        </Box>
        <Text> {account?.substring(0, 4)}...{account?.substring(
        account.length - 4) }
        </Text>
      </Box>
      {/*     
      <Button
        color='border'
        icon={
          <Box height="15px" width="15px">
            <Image src={connectorImage} fit="contain" />
          </Box>
      }
        label={`${account?.substring(0, 4)}...${account?.substring(
        account.length - 4
      )}`}
        onClick={() => action && action()}
        focusIndicator={false}
      // style={{ minWidth:'150px' }}
        hoverIndicator='background-frontheader'
      /> */}
    </>
  );
};

export default ProfileButton;
