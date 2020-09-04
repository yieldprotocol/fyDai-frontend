import React from 'react';
import { Box, Text, ThemeContext } from 'grommet';
import { PulseLoader, RingLoader } from 'react-spinners';



interface TransactionPendingProps {
  msg:string;
  tx: any;
}

const TransactionPending = ({ msg, tx }:TransactionPendingProps) => {

  const theme:any = React.useContext(ThemeContext); 

  return (
    <Box align='center' flex='grow' justify='between' gap='large'>
      <Box gap='medium' align='center' fill='horizontal'>
        <Text size='xlarge' color='brand' weight='bold'>Good One!</Text>
        <Box
        // direction='row-responsive'
          fill='horizontal'
          gap='large'
          align='center'
        >
          <Text>{msg}</Text>
          <Text>Your transaction is pending: </Text>

          <RingLoader color={theme?.global?.colors?.brand.dark || 'grey'} />


          <Text size='xsmall'> { tx.tx.hash } </Text>
          <Box 
            round='small'
            border='all'
            hoverIndicator='brand-transparent'
            onClick={()=>{ window.open( `https://rinkeby.etherscan.io/tx/${tx.tx.hash}`, '_blank');}} 
            align='center'
            pad={{horizontal:'large'}}
          >
            <Text
              size='xsmall'
              weight='bold'
            >
              View on Etherscan
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TransactionPending;
