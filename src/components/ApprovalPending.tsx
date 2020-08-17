import React, { forwardRef } from 'react';
import { Box, Text, Layer, Select } from 'grommet';


const ApprovalPending = React.forwardRef( (props, ref) => {

  return (
    <Layer
      modal={true} 
      // position='top'
      // target={ref || undefined}
      // onClickOutside={onClose}
      // onEsc={onClose}
    >
      <Box 
        pad="medium"
        gap="small"
        width="medium"
        round
        background='background-front'
      >
        <Text weight='bold'>Transaction pending approval.</Text>

        <Text>Please check your wallet/provider to confirm the transaction.</Text>

        <Text>Please check your wallet/provider to confirm the transaction.</Text>
        
        {/* <Button
          label="Toggle gutter size"
          // onClick={() => setGutter(gutter === 'small' ? 'xsmall' : 'small')}
        />
        <Button label="Close" onClick={()=>console.log('clicked')} /> */}
      </Box>
    </Layer>

  );
});

export default ApprovalPending;
