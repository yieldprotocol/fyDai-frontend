import React, { useEffect, useState, useContext } from 'react';
import { Box, Text } from 'grommet';
import { HistoryContext } from '../contexts/HistoryContext';
import { TxContext } from '../contexts/TxContext';
import RaisedButton from './RaisedButton';
import EtherscanButton from './EtherscanButton';
import HashWrap from './HashWrap';
import { abbreviateHash } from '../utils';
import FlatButton from './FlatButton';

const TxRecent = ({ setView }: any) => {

  const { state: { lastCompletedTx, pendingTxs }, dispatch } = useContext(TxContext);
  const { state: { txHistory } } = useContext(HistoryContext);
  const [ lastTx, setLastTx] = useState<any>(null);
  
  useEffect(()=>{
    let newArr; 
    txHistory && ( newArr = txHistory.items.sort((a:any, b:any) => { return b.date-a.date;}));
    txHistory && setLastTx(newArr[0]);
  }, [txHistory]);

  return (
    <Box gap="medium" pad='small'>

      <Box direction='row' gap='medium' align='center' justify='between'>
        <Text alignSelf='start' size='large' weight='bold'>Transactions</Text>   
        <RaisedButton
          onClick={()=>setView()}
          label={<Box pad={{ vertical:'xsmall', horizontal:'xsmall' }}><Text size='xxsmall'>Full history</Text></Box>}
        /> 
      </Box> 

      <Box gap='xsmall'>
        {
        lastTx &&
        <Box 
          direction='row'
          justify='between'
          align='center'
          gap='small'
        >
          <Text size='xsmall'>Last successful transaction: </Text>
          <HashWrap hash={lastTx?.transactionHash}> 
            <Box direction='row' gap='medium' align='center'>
              <Text weight='bold' size='xsmall'>{abbreviateHash(lastTx?.transactionHash, 8)} </Text>  
              <EtherscanButton txHash={lastTx?.transactionHash} /> 
            </Box> 
          </HashWrap> 
        </Box>
        }
    
        {
        lastCompletedTx &&
        <Box
          gap='small'
          align='center'
          direction='row'
          justify='between'
        > 
          <Text size='xsmall'>Last transaction this session: </Text>
          <HashWrap hash={lastCompletedTx?.transactionHash}> 
            <Box direction='row' gap='medium' align='center'>
              <Text weight='bold' size='xsmall'>{abbreviateHash(lastCompletedTx?.transactionHash, 8)} </Text>  
              <EtherscanButton txHash={lastCompletedTx?.transactionHash} /> 
            </Box> 
          </HashWrap> 
        </Box>
        }

        { 
        pendingTxs.length>0 && 
        <Box gap='small'>
          <Text size='xsmall'>Pending Transactions: </Text>
          <Box
            round='xsmall'
            border='all'
            pad='xsmall'
          >      
            { 
            pendingTxs.map((x:any)=>(        
              <Box
                gap='small'
                align='center'
                direction='row'
                key={x.tx.hash}
              >       
                <Text weight='bold' size='xxsmall'> {x.msg} </Text>
                <HashWrap hash={x.tx.hash}> 
                  <Box direction='row' gap='medium' align='center'>
                    <Text weight='bold' size='xxsmall'>{abbreviateHash(x.tx.hash, 4)} </Text>  
                    <EtherscanButton txHash={x.tx.hash} />
                  </Box>
                </HashWrap>
                <FlatButton 
                  label={<Text size='xxsmall'>Stuck?</Text>}
                  onClick={()=> dispatch({ type:'forceClear', payload: null })}
                />
               
              </Box>
            ))
            }
          </Box>
        </Box>
        }

        { 
        !lastTx && 
        !lastCompletedTx && 
        !pendingTxs &&
        <Box
          pad={{ vertical:'small' }}
          gap='small'
          align='start'
        >
          <Text size='xsmall'>There are transactions to show. </Text>
        </Box>
        }

      </Box>
    </Box>
  );
};

export default TxRecent;