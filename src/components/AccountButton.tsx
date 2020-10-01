import React, { useState, useEffect, useContext, useRef } from 'react';

import { useWeb3React } from '@web3-react/core';

import {
  Text,
  Image,
  Header,
  Button,
  Box,
  ThemeContext,
  ResponsiveContext,
  Layer,
  Menu,
  Collapsible,
  Drop
} from 'grommet';

import { 
  FiSettings as Gear,
  FiCheckCircle as Check,
} from 'react-icons/fi';


import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';

import FlatButton from './FlatButton';
import Authorization from './Authorization';
import RaisedBox from './RaisedBox';
import EthLogo from './logos/EthLogo';
import EthMark from './logos/EthMark';
import DaiMark from './logos/DaiMark';
import Loading from './Loading';
import EtherscanButton from './EtherscanButton';
import TxPending from './TxPending';


const AccountButton = (props: any) => {

  const { account } = useWeb3React();
  const pendingRef:any = useRef(null);
  const completeRef:any = useRef(null);

  const [ over, setOver] = useState<boolean>(false);

  const {
    openConnectLayer,
    activeView,
    setActiveView,
  } = props;

  const { state: { pendingTxs, lastCompletedTx } } = useContext(NotifyContext);
  const { state: { yieldLoading } } = useContext(YieldContext);
  const screenSize = useContext(ResponsiveContext);

  const { state: { position } } = useContext(UserContext);
  const { state: { activeSeries } } = useContext(SeriesContext);

  // Menu state for mobile later
  const [txCompleteOpen, setTxCompleteOpen] = useState(false);

  useEffect(()=>{
    lastCompletedTx?.transactionHash && pendingTxs.length===0 && setTxCompleteOpen(true);
    lastCompletedTx?.transactionHash && pendingTxs.length===0 && (async () => {
      setTimeout(() => {
        setTxCompleteOpen(false);
      }, 10000);
    })();

  }, [pendingTxs, lastCompletedTx ]);

  const abbreviateAddr = (addr:string) => {
    return `${addr?.substring(0, 4)}...${addr?.substring(addr.length - 4)}`; 
  };

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
          { abbreviateAddr(lastCompletedTx.transactionHash) }
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
      onMouseOver={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
    > 

      { pendingTxs.length>0 &&  
      <Layer>
        {console.log(pendingTxs[0])}
        <TxPending msg='some message' tx={pendingTxs[0].tx.tx} />
      </Layer>}

      { pendingTxs.length===0 && !txCompleteOpen &&
      <Box pad={{ left:'small', right:'large' }} direction='row' gap='small' align='center'>
        <Text size='xsmall'><DaiMark /></Text>
        <Loading condition={!position.daiBalance} size='xsmall'>
          <Text size='xsmall' textAlign='center'>{position?.daiBalance_} </Text>
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
      >
        <Text size='small'> Transaction pending ... </Text>
        
        { pendingRef.current && over && 
        <Drop
          plain 
          target={pendingRef.current}
          align={{ top: 'bottom' }}
        >
            {pendingTxs.length>0 && 
              <Box     
                pad='small'
                background='#f0f0f0'
              >
                {pendingTxs[0].tx.hash}
                <EtherscanButton txHash={pendingTxs[0].tx.hash} />
              </Box>}
        </Drop>}
      </Box>}



      { txCompleteOpen && 
      <>    
        <Box
          ref={completeRef}
          direction='row'
          margin={{ right:'-20px' }}
          pad={{ vertical: 'xsmall', left:'small', right:'25px' }}
          round
          animation='slideLeft'
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
        <FlatButton
          selected
          background='#f0f0f0'
          onClick={()=>openConnectLayer('ACCOUNT')}
          label={
            <Box gap='small' direction='row' align='center'>
              <Text size='small'>
                { abbreviateAddr(account) }
              </Text>
              <Gear />
            </Box>
            }
        /> 
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
