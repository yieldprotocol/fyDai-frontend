import React, { useContext, useEffect, useState } from 'react';
import { Box, Text, Layer, ResponsiveContext } from 'grommet';

import { NotifyContext } from '../contexts/NotifyContext';
 
const ApprovalPending = React.forwardRef( (props, ref) => {
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const { state: { requestedSigs } }  = useContext(NotifyContext);
  const [ sigsRequested, setSigsRequested ] = useState(false);

  useEffect(() =>{
    requestedSigs.length ? setSigsRequested(true): setSigsRequested(false) ;
  }, [requestedSigs]);

  return (
    <Layer
      modal={true}
      responsive={mobile?false: undefined}
      full={mobile?true: undefined}
    >
      {  sigsRequested ? 
        <Box 
          width={!mobile?{ min:'620px', max:'620px' }: undefined}
          pad="medium"
          gap="small"
          round={mobile?undefined:'small'}
          background='background-front'
        >
          <Text weight='bold'>A Signature is required</Text>
          <Text> {requestedSigs.length>0 && requestedSigs[0].desc}</Text>
          <Text>Please check your wallet or provider to sign the permission</Text>          
        </Box>
        :
        <Box
          width={!mobile?{ min:'620px', max:'620px' }: undefined}
          pad="medium"
          gap="small"
          round='small'
          background='background-front'
        >
          <Text weight='bold'>Confirmation required</Text>
          <Text>Please check your wallet or provider to approve the transaction</Text>            
        </Box>}
    </Layer>

  );
});

export default ApprovalPending;
