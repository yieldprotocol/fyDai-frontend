import React from 'react';
import { Box, Text, Layer } from 'grommet';
import Loading from './Loading';


interface OnceOffAuthorizeProps {
  authProcedure: any;
  authMsg: string;
  awaitingApproval: boolean;
  txPending: boolean;
}

const OnceOffAuthorize = ({ awaitingApproval, authProcedure, authMsg, txPending }:OnceOffAuthorizeProps) => {
  return (
    <Box 
      round 
      pad='small'
      gap='small'
      background='background'
      align='center'
      justify='between'
      fill='horizontal'
      direction='row-responsive'
    >
      <Text weight='bold' size='medium' color='brand'>Once-off Action required: </Text>

      {awaitingApproval && 'Waiting for approval...'}   
      <Loading condition={txPending && !awaitingApproval} size='small'>
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
      </Loading>
    </Box>
  );
};

export default OnceOffAuthorize;
