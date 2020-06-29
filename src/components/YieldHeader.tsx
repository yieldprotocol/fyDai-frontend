import React, { useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import { Text, Image, Header, Button, Box, ThemeContext } from 'grommet';
import { FaSeedling as YieldLeaf } from 'react-icons/fa';
import { FiSettings as Gear } from 'react-icons/fi';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';
import ProfileButton from './ProfileButton';

import { ConnectionContext } from '../contexts/ConnectionContext';
import { NotifyContext } from '../contexts/NotifyContext';

const YieldHeader = (props: any) => {
  
  const { 
    openConnectLayer,
    openAccountLayer,
    activeView,
    setActiveView
  } = props;
  

  const { state: { account } } = React.useContext(ConnectionContext);
  const { state: { pendingTxs } } = React.useContext(NotifyContext);

  // const { account } = useWeb3React();

  const theme = React.useContext<any>(ThemeContext);

  useEffect(() => {

    // (async () => activate(injected, console.log))();
  }, []);

  return (
    <Header
      // elevation="xsmall"
      fill="horizontal"
      pad={{ horizontal: 'small', vertical: 'small' }}
    >
      <Box align="center" direction='row' gap='small' margin='none' pad='none'>
        <Box height="xsmall" width="xsmall" margin='none' pad='xsmall'>
          <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
        </Box>
      </Box>

      <Box justify='center' direction='row' gap='none'>
        <Box 
          justify='end'
          pad='small' 
          border={activeView === 'DASHBOARD' && { size: 'xsmall', side: 'bottom', color:'brand' }}
          onClick={()=>setActiveView('DASHBOARD')}
        > 
          <Text color={activeView === 'DASHBOARD'? 'brand':'text'}>
            Dashboard
          </Text>
        </Box>
        
        <Box 
          justify='end'
          pad='small' 
          border={activeView === 'BORROW' && { size: 'xsmall', side: 'bottom', color:'brand' }}
          onClick={()=>setActiveView('BORROW')}
          
        > 
          <Text color={activeView === 'BORROW'? 'brand':'text'}>
            Borrow
          </Text>
        </Box>

        <Box 
          pad='small' 
          border={activeView === 'LEND' && { size: 'xsmall', side: 'bottom', color:'brand' }}
          onClick={()=>setActiveView('LEND')}
        >
          <Text color={activeView === 'LEND'? 'brand':'text'}>
            Lend
          </Text>
        </Box>

        {/* <Box
          pad='small'
          border={activeView === 'HISTORY' && { size: 'xsmall', side: 'bottom', color:'brand' }}
          // onClick={()=>setActiveView('AMM')}
          direction='row'
          gap='small'
        >
          <Text color={activeView === 'HISTORY'? 'brand':'lightgrey'}>
            History
          </Text>
        </Box> */}

        <Box
          pad='small'
          border={activeView === 'AMM' && { size: 'xsmall', side: 'bottom', color:'brand' }}
          // onClick={()=>setActiveView('AMM')}
          direction='row'
          gap='small'
        >
          <Text color={activeView === 'AMM'? 'brand':'lightgrey'}>
            Yield AMM
          </Text>
        </Box>
      </Box>

      <Box direction='row' align='baseline'>

        {pendingTxs.length >0 && 
          <Box>
            {pendingTxs.length} transaction pending...
          </Box>}
        {account ? (
          <Box pad='small'>
            <ProfileButton action={() => openAccountLayer()} account={account || ''} />
          </Box>
        ) : (
          <Box pad='small'>
            <Button
              color='border'
              style={{ minWidth: '160px' }}
              label="Connect to a wallet"
              onClick={() => openConnectLayer()}
            />
          </Box>
        )}
        <Box>
          <Gear />
        </Box>
      </Box>
    </Header>
  );
};

export default YieldHeader;
