import { Box, Text } from 'grommet';
import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import FlatButton from './FlatButton';

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
