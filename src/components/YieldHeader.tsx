import React, { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Image, Header, Button, Box, ThemeContext } from 'grommet';

import { FaSeedling as YieldLeaf } from 'react-icons/fa';

import logoDark from '../assets/images/yield.svg';
import logoLight from '../assets/images/yield_light.svg';
import ProfileButton from './ProfileButton';


const YieldHeader = (props: any) => {
  const { 
    openConnectLayer,
    openAccountLayer,
    activeView,
    setActiveView
  } = props;
  const { account } = useWeb3React();
  const theme = React.useContext<any>(ThemeContext);

  useEffect(() => {
    // (async () => activate(injected, console.log))();
  }, []);

  return (
    <Header
      // elevation="xsmall"
      gap="xlarge"
      fill="horizontal"
      pad={{ horizontal: 'large', vertical: 'xsmall' }}
    >
      <Box align="center" direction='row' gap='small'>
        <Box height="xsmall" width="xsmall">
          <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
        </Box>
      </Box>
      <Box direction='row' gap='medium'>
        <Box 
          pad='small' 
          border={activeView === 'BORROW' && { size: 'medium', side: 'bottom', color:'brand' }}
          onClick={()=>setActiveView('BORROW')}
        >BORROWER
        </Box>

        <Box 
          pad='small' 
          border={activeView === 'LEND' && { size: 'medium', side: 'bottom', color:'brand' }}
          onClick={()=>setActiveView('LEND')}
        >LENDER
        </Box>

        <Box 
          pad='small' 
          border={activeView === 'AMM' && { size: 'medium', side: 'bottom', color:'brand' }}
          onClick={()=>setActiveView('AMM')}
          direction='row'
          gap='small'
        ><YieldLeaf />YIELD AMM
        </Box>
      </Box>
      {account ? (
        <ProfileButton action={() => openAccountLayer()} />
      ) : (
        <Button
          style={{ minWidth: '160px' }}
          label="Connect to a wallet"
          onClick={() => openConnectLayer()}
        />
      )}
    </Header>
  );
};

export default YieldHeader;
