import React, { useEffect, useState, useContext } from 'react';
import {
  Box,
  Text,
  ResponsiveContext,
} from 'grommet';
import { UserContext } from '../contexts/UserContext';
import { NotifyContext } from '../contexts/NotifyContext';
import FlatButton from './FlatButton';
import EtherscanButton from './EtherscanButton';

const TxRecent = ({ setView }: any) => {

  const { state: { lastCompletedTx, pendingTxs } } = useContext(NotifyContext);
  const { state: { txHistory } } = useContext(UserContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const [ lastTx, setLastTx] = useState<any>(null);
  
  useEffect(()=>{
    let newArr; 
    txHistory && ( newArr = txHistory.items.sort((a:any, b:any) => { return b.date-a.date;}));
    txHistory && setLastTx(newArr[0]);
  }, [txHistory]);

  return (
    <Box pad="small" gap="small">
      <Box direction='row' justify='between'>
        <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Transactions</Text>   
        <Box round>
          <FlatButton
            onClick={()=>setView()}
            label={<Text size='xsmall'>View full history</Text>}
          /> 
        </Box>
      </Box> 

      {lastTx &&
      <Box
        pad={{ vertical:'small' }}
        gap='small'
        align='start'
      >
        <Text size='xsmall'>Last successful transaction: </Text>
        <Text size='xxsmall'>{lastTx?.transactionHash} </Text>
        <Box>
          <EtherscanButton txHash={lastTx?.transactionHash} /> 
        </Box>
      </Box>}

      { lastCompletedTx && 
      <Box
        pad={{ vertical:'small' }}
        gap='small'
        align='start'
      >
        <Text size='xsmall'>Last transaction this session: </Text>
        <Text size='xxsmall'>{lastCompletedTx.transactionHash} </Text>
        <Box>
          <EtherscanButton txHash={lastCompletedTx.transactionHash} /> 
        </Box>
      </Box>}

      { pendingTxs.length>0 && 
      <Box
        pad={{ vertical:'small' }}
        gap='small'
        align='start'
      >
        <Text size='xsmall'>Last transaction this session: </Text>
        <Text size='xxsmall'>{lastCompletedTx.transactionHash} </Text>
        <Box>
          <EtherscanButton txHash={lastCompletedTx.transactionHash} /> 
        </Box>
      </Box>}

      { !lastTx && !lastCompletedTx && !pendingTxs &&
      <Box
        pad={{ vertical:'small' }}
        gap='small'
        align='start'
      >
        <Text size='xsmall'>There are transactions to show. </Text>
      </Box>}
    </Box>
  );
};

export default TxRecent;