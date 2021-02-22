import React, { useState, useEffect, useContext, useRef } from 'react';
import { useWeb3React } from '@web3-react/core';
import {
  Text,
  Box,
  ResponsiveContext,
  Layer,
  Collapsible,
} from 'grommet';
import { 
  FiSettings as Gear,
  FiCheckCircle as Check,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import { abbreviateHash } from '../utils';

import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';

import FlatButton from './FlatButton';
import DaiMark from './logos/DaiMark';
import Loading from './Loading';
import TxStatus from './TxStatus';
import EthMark from './logos/EthMark';
import Selector from './Selector';
import USDCMark from './logos/USDCMark';

const AccountButton = (props: any) => {
  
  const { openConnectLayer } = props;

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { account } = useWeb3React();

  const pendingRef:any = useRef(null);
  const completeRef:any = useRef(null);

  const { state: { position } } = useContext(UserContext);
  const { state: { pendingTxs, lastCompletedTx } } = useContext(TxContext);

  // flags
  const [txStatusOpen, setTxStatusOpen] = useState(false);
  const [txCompleteOpen, setTxCompleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

  /* show txComplete for a short amount of time */
  useEffect(()=>{  
    lastCompletedTx?.transactionHash && pendingTxs.length===0 && setTxCompleteOpen(true);
    lastCompletedTx?.transactionHash && pendingTxs.length===0 && (async () => {
      setTimeout(() => {
        setTxCompleteOpen(false);
      }, 10000);
    })();

  }, [pendingTxs, lastCompletedTx ]);


  /* internal components */

  const TxStatusLayer = () => (
    <Layer 
      onClickOutside={()=>setTxStatusOpen(false)}
      onEsc={()=>setTxStatusOpen(false)}
    >
      <Box 
        fill
        background='background'
        round='small'
        pad="none"
        align='center'
        gap='medium'
        width={!mobile?{ min:'620px', max:'620px' }: undefined}
      >
        <TxStatus tx={pendingTxs[pendingTxs.length-1]} />
        <Box alignSelf='start' pad='medium'> 
          <FlatButton
            onClick={()=>setTxStatusOpen(false)}
            label={
              <Box direction='row' gap='medium' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='xsmall' color='text-weak'> go back </Text>
              </Box>
          }
          />
        </Box>
      </Box>
    </Layer>
  );


  return (
    <Box
      round
      direction='row'
      // align='center'
      background='background'
    > 
      { 
        txStatusOpen &&  
        <TxStatusLayer />
      }

      { 
      account &&
      !mobile && 
      pendingTxs.length===0 && 
      !txCompleteOpen && 
        <Box 
          gap='medium' 
          width={{ min:'150px' }}
        >
          <Selector 
            selectedIndex={0} 
            selectItemCallback={(x:any) => null}
            flat        
            items={[
              <Box 
                key='DAI' 
                direction='row' 
                gap='xsmall' 
                align='center' 
                pad={{ left:'small', vertical:'xsmall' }}
              >
                <DaiMark /> 
                <Text size='xsmall' weight='bold'>{position?.daiBalance_}</Text>
                <Text size='small'> DAI </Text>
              </Box>,

              <Box
                key='ETH' 
                direction='row' 
                gap='xsmall' 
                align='center' 
                pad={{ left:'small', vertical:'xsmall' }}
              >    
                <EthMark /> 
                <Text size='xsmall' weight='bold'>{position?.ethBalance_}</Text>
                <Text size='xsmall' weight='bold'>ETH</Text>
              </Box>,

              <Box 
                key='USDC' 
                direction='row' 
                gap='xsmall' 
                align='center' 
                pad={{ left:'small', vertical:'xsmall' }}
              >
                <USDCMark /> 
                <Text size='xsmall' weight='bold'>{position?.usdcBalance_}</Text>
                <Text size='small'> USDC </Text>
              </Box>  
            ]}
          />
        </Box>
      }
      
      {
      pendingTxs.length>0 && 
      !txCompleteOpen &&
        <Box
          ref={pendingRef}
          direction='row'
          margin={{ right:'-20px' }}
          pad={{ vertical: 'xsmall', left:'small', right:'25px' }}
          round
          animation='slideLeft'
          onClick={()=>setTxStatusOpen(true)}
        >
          <Text size='xsmall'> Transaction pending ... </Text>  
        </Box>
      }

      { 
        txCompleteOpen && 
        <Box
          ref={completeRef}
          direction='row'
          margin={{ right:'-20px' }}
          pad={{ vertical: 'xsmall', left:'small', right:'25px' }}
          round
          animation='slideLeft'
          onClick={()=>setTxStatusOpen(true)}
        >
          {lastCompletedTx?.status === 1 &&
          <Box direction='row' gap='xsmall'> 
            <Text color='green' textAlign='center' size='xsmall'><Check /></Text>
            { pendingTxs.length===0 && <Text color='green' textAlign='center' size='xsmall'>Transaction Complete</Text>}
          </Box>}
  
          {lastCompletedTx?.status !== 1 &&
          <Box direction='row' gap='xsmall'>
            <Text color='red' textAlign='center' size='xsmall'>Transaction failed</Text>
          </Box>}  
        </Box>
      }
  

      { 
      account ?
        <>{!mobile && <FlatButton
          onClick={()=>openConnectLayer('ACCOUNT')}
          label={
            <Box gap='small' direction='row' align='center'>
              <Text size='small'>
                { abbreviateHash(account) }
              </Text>
              <Gear />
            </Box>
            }
        />}
        </> 
        : 
        <FlatButton 
          onClick={() => {
            openConnectLayer('CONNECT');
          }}
          label={<Box pad='xsmall'><Text size='small'>Connect a wallet</Text></Box>}
        />
    }
    </Box>
  );
};

export default AccountButton;
