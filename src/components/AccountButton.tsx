import React, { useState, useEffect, useContext, useRef } from 'react';
import { useWeb3React } from '@web3-react/core';

import {
  Text,
  Box,
  ResponsiveContext,
  Layer,
  Drop
} from 'grommet';

import { 
  FiSettings as Gear,
  FiCheckCircle as Check,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import { NotifyContext } from '../contexts/NotifyContext';
import { UserContext } from '../contexts/UserContext';

import FlatButton from './FlatButton';
import DaiMark from './logos/DaiMark';
import Loading from './Loading';
import EtherscanButton from './EtherscanButton';
import TxStatus from './TxStatus';
import { abbreviateHash } from '../utils';


const AccountButton = (props: any) => {
  
  const { openConnectLayer } = props;
  const { account } = useWeb3React();
  
  const pendingRef:any = useRef(null);
  const completeRef:any = useRef(null);
  const [ over ] = useState<boolean>(false);

  const { state: { position } } = useContext(UserContext);
  const { state: { pendingTxs, lastCompletedTx } } = useContext(NotifyContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  // flags
  const [txStatusOpen, setTxStatusOpen] = useState(false);
  const [txCompleteOpen, setTxCompleteOpen] = useState(false);

  useEffect(()=>{
    lastCompletedTx?.transactionHash && pendingTxs.length===0 && setTxCompleteOpen(true);
    lastCompletedTx?.transactionHash && pendingTxs.length===0 && (async () => {
      setTimeout(() => {
        setTxCompleteOpen(false);
      }, 10000);
    })();

  }, [pendingTxs, lastCompletedTx ]);

  const DropBox = () => {
    return ( 
      <Drop
        target={completeRef.current}
        align={{ top: 'bottom' }}
        plain
      >
        {lastCompletedTx &&
        <Box
          pad='small'
          background='#f0f0f0'
        >
          { abbreviateHash(lastCompletedTx.transactionHash) }
          {lastCompletedTx.status}
          <EtherscanButton txHash={lastCompletedTx.transactionHash} />
        </Box>}
      </Drop>);
  };
  
  return (
    <Box
      round
      direction='row'
      align='center'
      background={account?'#f0f0f0':undefined}
    > 
      {txStatusOpen && 
      <Layer 
        onClickOutside={()=>setTxStatusOpen(false)}
        onEsc={()=>setTxStatusOpen(false)}
      >
        <Box 
          fill
          background="background-front"
          round='small'
          pad="none"
          align='center'
          gap='medium'
          width={!mobile?{ min:'620px', max:'620px' }: undefined}  
        >
          <TxStatus msg='Please be patient.' tx={pendingTxs[pendingTxs.length-1]} />
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
      </Layer>}

      { !mobile && pendingTxs.length===0 && !txCompleteOpen && account &&
      <Box pad={{ left:'small', right:'large' }} direction='row' gap='small' align='center'>
        <DaiMark />
        <Loading condition={!position.daiBalance} size='xsmall'>
          <Text size='xsmall' weight='bold'>{position?.daiBalance_} DAI </Text>
        </Loading>
      </Box>}
        
      {pendingTxs.length>0 &&  
      <Box
        ref={pendingRef}
        direction='row'
        margin={{ right:'-20px' }}
        pad={{ vertical: 'xsmall', left:'small', right:'25px' }}
        round
        animation='slideLeft'
        onClick={()=>setTxStatusOpen(true)}
      >
        <Text size='small'> Transaction pending ... </Text>   
        { pendingRef.current && over && <DropBox />}
      </Box>}

      {txCompleteOpen &&
      <>    
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
          <Text color='green' textAlign='center' size='small'>              
            <Check /> Transaction Complete
          </Text>}
          {lastCompletedTx?.status !== 1 &&
          <Text color='red' textAlign='center' size='small'>              
            Transaction failed
          </Text>}
        </Box> 
        { completeRef.current && over && <DropBox />}               
      </>}

      { account ?
        <>{!mobile && <FlatButton
          selected 
          background='#f0f0f0'
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
          label={<Text size='small'>Connect a wallet</Text>}
        />}

    </Box>
  );
};

export default AccountButton;
