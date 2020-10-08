import { Box, Text } from 'grommet';
import React from 'react';
import RaisedButton from './RaisedButton';

const EtherscanButton = ({ txHash }: any) => {
  return (
    <RaisedButton 
      onClick={()=>{ window.open( `https://kovan.etherscan.io/tx/${txHash}`, '_blank');}}
      label={<Box pad='xsmall'><Text size='xsmall'> View on Etherscan </Text></Box>}
    />
  );
};

export default EtherscanButton;
