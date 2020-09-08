import React, { forwardRef } from 'react';
import { Box, Text, Layer, ResponsiveContext } from 'grommet';

import { NotifyContext } from '../contexts/NotifyContext';
 
const ApprovalPending = React.forwardRef( (props, ref) => {
  const screenSize = React.useContext(ResponsiveContext);

  const { state: { requestedSigs } }  = React.useContext(NotifyContext);
  const [ sigsRequested, setSigsRequested ] = React.useState(false);

  React.useEffect(() =>{
    console.log(requestedSigs.length);
    requestedSigs.length ? setSigsRequested(true): setSigsRequested(false) ;

  }, [requestedSigs]);

  return (
    <Layer
      modal={true} 
      // position='top'
      // target={ref || undefined}
      // onClickOutside={onClose}
      // onEsc={onClose}
    >
      {  sigsRequested ? 
        <Box 
          width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
          pad="medium"
          gap="small"
          round
          background='background-front'
        >
          <Text weight='bold'>Signature required</Text>
          <Text>Please check your wallet/provider to sign the permission</Text>            
          {/* <Button
                    label="Toggle gutter size"
                    // onClick={() => setGutter(gutter === 'small' ? 'xsmall' : 'small')}
                  />
                  <Button label="Close" onClick={()=>console.log('clicked')} /> */}
        </Box> 
        :
        <Box 
          width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
          pad="medium"
          gap="small"
          round
          background='background-front'
        >
          <Text weight='bold'>Approval required</Text>
          <Text>Please check your wallet/provider to approve the transaction</Text>            
          {/* <Button
                  label="Toggle gutter size"
                  // onClick={() => setGutter(gutter === 'small' ? 'xsmall' : 'small')}
                />
                <Button label="Close" onClick={()=>console.log('clicked')} /> */}
        </Box>}
    </Layer>

  );
});

export default ApprovalPending;
