import { Box, Text } from 'grommet';
import React, { useState, useEffect } from 'react';
import RaisedButton from './RaisedButton';

import FlatButton from './FlatButton';

import { useWeb3React } from '../hooks';

const networkMap = new Map([
  [1, ''],
  [42, 'kovan.'],
]);

const EtherscanButton = ({ txHash, background }: any) => {
  const { chainId } = useWeb3React();
  const [network, setNetwork] = useState<string>();
  useEffect(()=>{
    chainId && setNetwork(networkMap.get(chainId));
  }, [chainId]);

  return (
    <FlatButton
      background={background}
      onClick={(e:any)=>{ e.stopPropagation(); window.open( `https://${network}etherscan.io/tx/${txHash}`, '_blank');}}
      label={<Box pad={{ horizontal:'xxsmall', vertical:'none' }}><Text size='xxsmall'> View on Etherscan </Text></Box>}
    />
  );
};

export default EtherscanButton;
