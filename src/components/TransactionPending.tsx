import React from 'react';
import { Box, Text, ThemeContext } from 'grommet';
import { PulseLoader, RingLoader, ScaleLoader } from 'react-spinners';



interface TransactionPendingProps {
  msg:string;
  tx: any;
}

const TransactionPending = ({ msg, tx }:TransactionPendingProps) => {

  const theme:any = React.useContext(ThemeContext); 

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
        <Text size='xsmall'> { tx.tx.hash } </Text>
        <Box 
          round='small'
          border='all'
          hoverIndicator='brand-transparent'
          onClick={()=>{ window.open( `https://rinkeby.etherscan.io/tx/${tx.tx.hash}`, '_blank');}} 
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
    </Box>
  );
};

export default TransactionPending;
