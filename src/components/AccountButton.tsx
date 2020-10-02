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
  FiArrowLeft as ArrowLeft,
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
import TxStatus from './TxStatus';


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

  // layer flags
  // const [pendingLayerOpen, setPendingLayerOpen] = useState(false);
  // const [completeLayerOpen, setCompleteLayerOpen] = useState(false);
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
      // onMouseOver={() => setOver(true)}
      // onMouseLeave={() => setOver(false)}
    > 
      {/* { pendingTxs.length>0 && pendingLayerOpen &&   
      <Layer 
        onClickOutside={()=>setPendingLayerOpen(false)}
        onEsc={()=>setPendingLayerOpen(false)}
      >
        <TxStatus msg='tx pending' tx={pendingTxs[pendingTxs.length-1]} />      
      </Layer>}

      { completeLayerOpen && txCompleteOpen &&  
      <Layer 
        onClickOutside={()=>setPendingLayerOpen(false)}
        onEsc={()=>setPendingLayerOpen(false)}
      >
        Soimething
      </Layer>} */}

      { txStatusOpen && 

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
        >
          <TxStatus msg='tx pending' tx={pendingTxs[pendingTxs.length-1]} />
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
        onClick={()=>setTxStatusOpen(true)}
      >
        <Text size='small'> Transaction pending ... </Text>   
        { pendingRef.current && over && <DropBox />}
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
