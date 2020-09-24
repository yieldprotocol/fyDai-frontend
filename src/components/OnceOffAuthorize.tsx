import React, { useEffect, useState, useContext } from 'react';
import { Box, Text, ResponsiveContext, Button } from 'grommet';
import { FiInfo as Info } from 'react-icons/fi';
import Loading from './Loading';



interface OnceOffAuthorizeProps {
  authProcedure: any;
  authMsg: string;
  awaitingApproval: boolean;
  txPending: boolean;
}

const OnceOffAuthorize = ({ awaitingApproval, authProcedure, authMsg, txPending }:OnceOffAuthorizeProps) => {

  const screenSize = useContext(ResponsiveContext);
  return (
    <Box 
      round 
      pad='small'
      gap='small'
      background='background'
      align='center'
      justify='between'
      fill='horizontal'
      // direction='row-responsive'
    >
      <Box direction='row' gap='small' align='center'>
        <Info />
        <Text weight='bold' size='small' color='brand'>{txPending && !awaitingApproval? 'Transaction Pending' : 'Action required'}</Text>
      </Box>

      {awaitingApproval? 
        <Text> Waiting for wallet approval...</Text>
        :
        <Loading condition={txPending && !awaitingApproval} size='small'>
          <Button  
            primary
            label={authMsg}
            // hoverIndicator='brand-transparent'
            onClick={()=>authProcedure()}
          />
        </Loading>}
    </Box>
  );
};

export default OnceOffAuthorize;
