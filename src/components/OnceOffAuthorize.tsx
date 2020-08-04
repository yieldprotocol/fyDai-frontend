import React from 'react';
import { Box, Text, Layer } from 'grommet';


interface OnceOffAuthorizeProps {
  authProcedure: any;
  authMsg: string;
  txPending: boolean;
}

const OnceOffAuthorize = ({ authProcedure, authMsg, txPending }:OnceOffAuthorizeProps) => {
  return (
  // <Layer>
    <Box 
      round 
      pad='small'
      gap='small'
      background='background'
      // border='all'
      // elevation='small'
      align='center'
      justify='between'
      fill
      direction='row-responsive'
    >
      <Text weight='bold' size='medium' color='brand'>Once-off Action required: </Text>
      {txPending && 'pending'}
      <Box
        round
        onClick={()=>authProcedure()}
        hoverIndicator='brand-transparent'
        border='all'
        pad={{ horizontal:'small', vertical:'small' }}
        align='center'
      >
        <Text
          weight='bold'
          color='text'
        >
          {authMsg}
        </Text>
      </Box>
    </Box>
  // </Layer>
  );
};

export default OnceOffAuthorize;
