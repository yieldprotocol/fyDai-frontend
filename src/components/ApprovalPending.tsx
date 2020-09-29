import React, { useContext, useEffect, useState } from 'react';
import { Box, Text, Layer, ResponsiveContext } from 'grommet';

import { NotifyContext } from '../contexts/NotifyContext';
 
const ApprovalPending = React.forwardRef( (props, ref) => {
  const screenSize = useContext(ResponsiveContext);

  const { state: { requestedSigs } }  = useContext(NotifyContext);
  const [ sigsRequested, setSigsRequested ] = useState(false);

  useEffect(() =>{
    requestedSigs.length ? setSigsRequested(true): setSigsRequested(false) ;
  }, [requestedSigs]);

  return (
    <Layer
      modal={true}
    >
      {  sigsRequested ? 
        <Box 
          width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
          pad="medium"
          gap="small"
          round
          background='background-front'
        >
          <Text weight='bold'>A Signature is required</Text>
          <Text> {requestedSigs[0].desc}</Text>
          <Text>Please check your wallet/provider to sign the permission</Text>          
        </Box> 
        :
        <Box 
          width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
          pad="medium"
          gap="small"
          round
          background='background-front'
        >
          <Text weight='bold'>Transaction approval required</Text>
          <Text>Please check your wallet/provider to approve the transaction</Text>            
        </Box>}
    </Layer>

  );
});

export default ApprovalPending;
