import React, { useState, useEffect, useContext } from 'react';

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
} from 'grommet';

import { 
  FiSettings as Gear,
  FiCheckCircle as Check,
} from 'react-icons/fi';


import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import FlatButton from './FlatButton';
import Authorization from './Authorization';
import RaisedBox from './RaisedBox';
import EthLogo from './logos/EthLogo';
import EthMark from './logos/EthMark';
import DaiMark from './logos/DaiMark';
import { unstable_renderSubtreeIntoContainer } from 'react-dom';
import Loading from './Loading';


const AccountButton = (props: any) => {

  const { account } = useWeb3React();

  const {
    openConnectLayer,
    activeView,
    setActiveView,
  } = props;

  const { state: { pendingTxs, lastCompletedTx } } = useContext(NotifyContext);
  const { state: { yieldLoading } } = useContext(YieldContext);
  const screenSize = useContext(ResponsiveContext);

  const { state: { position } } = useContext(UserContext);

  // Menu state for mobile later
  const [txCompleteOpen, setTxCompleteOpen] = useState(false);

  // useEffect(()=>{
  //   (async () => {
  //     setAccLabel(`${account?.substring(0, 4)}...${account?.substring(account.length - 4)}`);
  //     // setConnectorImage(()=>useConnectorImage);
  //   })(); 
  // }, [account]);

  useEffect(()=>{
    lastCompletedTx && pendingTxs.length===0 && setTxCompleteOpen(true);
    lastCompletedTx && pendingTxs.length===0 && (async () => {
      setTimeout(() => {
        setTxCompleteOpen(false);
      }, 6000);
    })();
  }, [lastCompletedTx, pendingTxs ]);
  
  return (
    <Box> 
      <Box
        round
        direction='row'
        align='center'
        pad={{ top:'2px', bottom:'2px', horizontal:'2px' }}
        background={account?'#f0f0f0':undefined}
      > 
        { (account && pendingTxs.length===0 && !txCompleteOpen)? 
          <Box pad={{ left:'small', right:'large' }} direction='row' gap='small' align='center'>
            <Text size='xsmall'><DaiMark /></Text>
            <Loading condition={!position.daiBalance} size='xsmall'>
              <Text size='xsmall' textAlign='center'>{position?.daiBalance_} </Text>
            </Loading>
          </Box>    
          :        
          <Box 
            direction='row'
            margin={{ right:'-20px' }}
            pad={{ vertical: 'xsmall', left:'small', right:'25px' }}
            round
            // eslint-disable-next-line no-nested-ternary
            background={pendingTxs.length>0 ? 'orange': txCompleteOpen ? '#519872': undefined}
          >
            {pendingTxs.length>0 && <Text size='small'> Transaction pending ... </Text>}

            {lastCompletedTx && pendingTxs.length===0 && txCompleteOpen && 
              <Text color='green' textAlign='center' size='small'> 
                <Check />  Transaction Complete. 
              </Text>}       
          </Box> }

        { account ?
          <FlatButton
            selected
            background='#f0f0f0'
            onClick={()=>openConnectLayer('ACCOUNT')}
            label={
              <Box gap='small' direction='row' align='center'>
                <Text size='small'>
                  {`${account?.substring(0, 4)}...${account?.substring(account.length - 4)}`}
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
    </Box>
  );
    
};

export default AccountButton;
