import { Box, Text } from 'grommet';
import React from 'react';

const EtherscanButton = ({ txHash }: any) => {
  return (
    <Box
    // direction='row-responsive'
      fill='horizontal'
      align='center'
    >  
      <Box 
        round='small'
        border='all'
        hoverIndicator='brand-transparent'
        onClick={()=>{ window.open( `https://kovan.etherscan.io/tx/${txHash}`, '_blank');}} 
        align='center'
        pad={{ horizontal:'large' }}
      >
        <Text
          size='xsmall'
          weight='bold'
        >
          View on Etherscan
        </Text>
      </Box>
    </Box>
  );
};

export default EtherscanButton;
