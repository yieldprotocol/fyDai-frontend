import React, { useContext, useEffect, useState } from 'react';
import { Box, Text, Layer, ResponsiveContext } from 'grommet';
import { 
  FiCheckCircle as Check,
  FiClock as Clock,
  FiUnlock as Unlock,
  FiArrowLeft as ArrowLeft, 
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';

import { useTxActive } from '../hooks';
import FlatButton from './FlatButton';
import TxStatus from './TxStatus';
import { abbreviateHash } from '../utils';
import EtherscanButton from './EtherscanButton';
 
const ConfirmationRequired = ({ close }:any) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { requestedSigs, pendingTxs } }  = useContext(TxContext);

  const { state: { preferences } }  = useContext(UserContext);

  const [ sigsRequested, setSigsRequested ] = useState(false);
  const [ allSigned, setAllSigned ] = useState(false);

  const [ txActive ] = useTxActive([ 'AUTH' ]);

  useEffect(() =>{
    requestedSigs.length ? setSigsRequested(true): setSigsRequested(false) ;
  }, [requestedSigs]);


  useEffect(()=>{
    const _allSigned = requestedSigs.reduce((acc:boolean, nextItem:any)=> {
      return nextItem.signed;
    }, false);
    setAllSigned(_allSigned);
  }, [requestedSigs]);


  return (
    <Layer
      modal={true}
      responsive={mobile?false: undefined}
      full={mobile?true: undefined}
    >
      { !preferences?.useTxApproval && 
        <>
          { sigsRequested ?

            <Box 
              width={!mobile?{ min:'620px', max:'620px' }: undefined}
              round={mobile?undefined:'small'}
              background='background'
              pad='large'
              gap='medium'
            >
              { !txActive && allSigned ? 
                <Text weight='bold'> All the required permissions have been granted  👍</Text> : 
                <Text weight='bold'> The following signatures are required: </Text>}

              { requestedSigs.map((x:any, i:number)=> {
                const iKey = i;
                return ( 
                  <Box key={iKey} gap='small' direction='row' justify='between' fill>
                    <Box basis='70' direction='row' gap='small'> 
                      <Text 
                        size='xsmall'
                        color={x.signed?'green':undefined}
                      >
                        {i+1}.
                      </Text>

                      <Text 
                        size='xsmall'
                        color={x.signed?'green':undefined}
                      >
                        {x.desc}
                      </Text>
                    </Box>
        
                    <Box basis='30' alignSelf='end'> 
                      { !x.signed ? 
                        <Clock /> :
                        <Box animation='zoomIn'>
                          <Check color='green' />
                        </Box>}
                    </Box>
                  </Box>
                );
              })}
        
              { !txActive && allSigned && 
              <Text weight='bold'>
                Finally, confirm with your wallet provider to send the transaction...
              </Text>}  
            </Box>
            :
            <Box
              width={!mobile?{ min:'620px', max:'620px' }: undefined}
              pad="medium"
              gap="small"
              round='small'
              background='background-front'
            >
              <Text weight='bold'>Confirmation required</Text>
              <Text>Please check your wallet or provider to approve the transaction</Text>            
            </Box>}
        </>}

      { preferences?.useTxApproval &&
        <>
          { sigsRequested ?
            <Box 
              width={!mobile?{ min:'620px', max:'620px' }: undefined}
              round={mobile?undefined:'small'}
              background='background'
              pad='large'
              gap='medium'
            >
              <Text weight='bold'> Please approve the following authorization transactions with your wallet or provider </Text>

              { txActive &&
              <Box gap='medium'>
                <Box gap='medium'>
                  <Text size='xsmall' weight='bold'> 
                    Authorization transactions pending: 
                  </Text>
                  <Box gap='small' fill='horizontal'>
                    { pendingTxs.map((x:any, i:number)=> (
                      <Box key={x.tx.hash} direction='row' fill='horizontal' justify='between'>
                        <Box> { abbreviateHash(x.tx.hash) }</Box>
                        <EtherscanButton txHash={x.tx.hash} />
                      </Box>)
                    )}
                  </Box>
                </Box>
                
                <Box alignSelf='start'>
                  <FlatButton 
                    onClick={()=>close()}
                    label={
                      <Box direction='row' gap='medium' align='center'>
                        <ArrowLeft color='text-weak' />
                        <Text size='small' color='text-weak'>close, and go back to the app</Text>
                      </Box>
                  }
                  />
                </Box>
              </Box>}
            </Box>       
            :
            <Box
              width={!mobile?{ min:'620px', max:'620px' }: undefined}
              pad="medium"
              gap="small"
              round='small'
              background='background-front'
            >
              <Text weight='bold'>Confirmation required</Text>
              <Text>Please check your wallet or provider to approve the transaction</Text>            
            </Box>}
        </>}

    </Layer>
  );
};

export default ConfirmationRequired;
