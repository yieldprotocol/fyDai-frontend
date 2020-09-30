import React, { useEffect, useState, useContext } from 'react';
import { Box, Text, TextArea, ThemeContext } from 'grommet';

import {FiCopy as Copy} from 'react-icons/fi';
import { ScaleLoader } from 'react-spinners';

interface TransactionPendingProps {
  msg:string;
  tx: any;
}

const TxPending = ({ msg, tx }:TransactionPendingProps) => {

  const theme:any = useContext(ThemeContext); 
  const txRef = React.useRef<any>(null);

  const handleCopy = () => {
    console.log(txRef.current); 
    // txRef.current?.innerText;
    document.execCommand('copy');
  };

  return (

    <Box
      alignSelf="center"
      fill
      background="background-front"
      round='small'
      pad="large"
      align='center'
      gap='medium'
    >

      <Text size='xlarge' color='brand' weight='bold'>Transaction pending </Text>
      <Text>{msg}</Text>

      <ScaleLoader color={theme?.global?.colors?.brand.dark || 'grey'} height='25px' />

      <Box
        // direction='row-responsive'
        fill='horizontal'
        align='center'
      >  
        <Box 
          round='small'
          border='all'
          hoverIndicator='brand-transparent'
          onClick={()=>{ window.open( `https://kovan.etherscan.io/tx/${tx.tx.hash}`, '_blank');}} 
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
      <Box direction='row' gap='xsmall'>
        <Text size='xsmall' ref={txRef}> { tx.tx.hash } </Text>
        <Box
          onClick={()=>handleCopy()}
        >
          <Copy /> 
        </Box>
        
      </Box>
    </Box>
  );
};

export default TxPending;
