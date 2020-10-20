import React, { useEffect, useState, useContext } from 'react';
import { Box, Text } from 'grommet';
import { UserContext } from '../contexts/UserContext';
import { NotifyContext } from '../contexts/NotifyContext';
import FlatButton from './FlatButton';
import EtherscanButton from './EtherscanButton';
import Loading from './Loading';
import HashWrap from './HashWrap';
import { abbreviateHash } from '../utils';

const TxRecent = ({ setView }: any) => {

  const { state: { lastCompletedTx, pendingTxs } } = useContext(NotifyContext);
  const { state: { txHistory } } = useContext(UserContext);

  const [ lastTx, setLastTx] = useState<any>(null);
  
  useEffect(()=>{
    let newArr; 
    txHistory && ( newArr = txHistory.items.sort((a:any, b:any) => { return b.date-a.date;}));
    txHistory && setLastTx(newArr[0]);
  }, [txHistory]);

  return (
    <Box pad="small" gap="small">
      <Box direction='row' justify='between'>
        <Text alignSelf='start' size='large' color='brand' weight='bold'>Transactions</Text>   
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
        <Text weight='bold' size='xxsmall'>Last successful transaction: </Text>
        <HashWrap hash={lastTx?.transactionHash}> 
          <Text size='xxsmall'>{lastTx?.transactionHash} </Text>    
        </HashWrap> 
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
        <Text weight='bold' size='xxsmall'>Last transaction this session: </Text>
        <HashWrap hash={lastCompletedTx.transactionHash}> 
          <Text size='xxsmall'>{lastCompletedTx.transactionHash} </Text>   
        </HashWrap>
        <Box>
          <EtherscanButton txHash={lastCompletedTx?.transactionHash} /> 
        </Box>
      </Box>}

      { pendingTxs.length>0 && 
      <Box
        pad={{ vertical:'small' }}
        gap='small'
        align='start'
      >
        <Text size='xxsmall'>Last transaction this session: </Text>
        <Loading condition={lastCompletedTx?.transactionHash} size='small'>
          <HashWrap hash={lastCompletedTx?.transactionHash}>
            <Text size='xxsmall'>{lastCompletedTx?.transactionHash} </Text>
          </HashWrap>
        </Loading>
        <Box>
          <EtherscanButton txHash={lastCompletedTx?.transactionHash} /> 
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