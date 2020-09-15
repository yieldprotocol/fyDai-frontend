import React, { useEffect, useState } from 'react';

import { Text, Box } from 'grommet';
// import { useConnectorImage } from '../hooks/connectionHooks';
// import { NotifyContext } from '../contexts/NotifyContext';
import { useWeb3React } from '../hooks';

const ProfileButton = ({ action }: any) => {

  const [ accLabel, setAccLabel ] = useState<string>('');
  // const [ connectorImage, setConnectorImage ] = useState<string>('');
  const { account } = useWeb3React();

  useEffect(()=>{
    (async () => {
      setAccLabel(`${account?.substring(0, 4)}...${account?.substring(account.length - 4)}`);
      // setConnectorImage(()=>useConnectorImage);
    })(); 
  }, [account]);

  return (
    <>
      <Box 
        round='small'
        onClick={() => action && action()}
        hoverIndicator='brand-transparent'
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
