import { Box, Text } from 'grommet';
import React, { useState, useEffect } from 'react';
import RaisedButton from './RaisedButton';

import { useWeb3React } from '../hooks';

const networkMap = new Map([
  [1, ''],
  [42, 'kovan.'],
]);

const EtherscanButton = ({ txHash }: any) => {
  const { chainId } = useWeb3React();
  const [network, setNetwork] = useState<string>();
  useEffect(()=>{
    chainId && setNetwork(networkMap.get(chainId));
  }, [chainId]);

  return (
    <RaisedButton 
      onClick={()=>{ window.open( `https://${network}etherscan.io/tx/${txHash}`, '_blank');}}
      label={<Box pad='xsmall'><Text size='xsmall'> View on Etherscan </Text></Box>}
    />
  );
};

export default EtherscanButton;
