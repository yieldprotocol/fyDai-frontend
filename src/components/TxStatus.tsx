import React, { useState, useContext } from 'react';
import { Box, Text, Drop, ThemeContext } from 'grommet';

import { FiCopy as Copy } from 'react-icons/fi';

import { ScaleLoader } from 'react-spinners';
import { NotifyContext } from '../contexts/NotifyContext';
import EtherscanButton from './EtherscanButton';
import { abbreviateHash } from '../utils';

interface TxStatusProps {
  msg:string;
  tx: any;
}

const TxStatus= ({ msg, tx }:TxStatusProps) => {

  const {
    state: { pendingTxs, lastCompletedTx },
  } = useContext(NotifyContext);

  const theme:any = useContext(ThemeContext); 
  const txRef = React.useRef<any>(null);

  const handleCopy = () => {
    console.log(txRef.current); 
    // txRef.current?.innerText;
    document.execCommand('copy');
  };

  return (
    <>
      { pendingTxs && pendingTxs.length > 0 &&
        <Box
          alignSelf="center"
          fill
          background="background-front"
          round='small'
          pad="large"
          align='center'
          gap='medium'
        >
          <Text size='xlarge' color='brand' weight='bold'>Transaction pending...</Text>
          <Text>{msg}</Text>
          <ScaleLoader color={theme?.global?.colors?.brand.dark || 'grey'} height='25px' />
          <Box direction='row' gap='xsmall'>
            <Text size='xsmall' ref={txRef}> { abbreviateHash(tx.tx.hash) } </Text>
            <Box
              onClick={()=>handleCopy()}
            >
              <Copy /> 
            </Box>    
          </Box>
          <EtherscanButton txHash={tx.tx.hash} />
        </Box>}

      { pendingTxs.length === 0 && lastCompletedTx &&
      <Box
        alignSelf="center"
        fill
        background="background-front"
        round='small'
        pad="large"
        align='center'
        gap='medium'
      >
        <Text size='xlarge' color='brand' weight='bold'>Transaction Complete. </Text>
        <Text>{lastCompletedTx.status}</Text>
        <Box direction='row' gap='xsmall'>
          <Text size='xsmall' ref={txRef}> { abbreviateHash(lastCompletedTx.transactionHash) } </Text>
          <Box
            onClick={()=>handleCopy()}
          >
            <Copy /> 
          </Box>
        </Box>
        <EtherscanButton txHash={lastCompletedTx.transactionHash} />
      </Box>}
    </>
  );
};

export default TxStatus;