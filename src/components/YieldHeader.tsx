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

import styled from 'styled-components';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';
import YieldLogo from './logos/YieldLogo';

import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';
import TxStatus from  './TxStatus';
import FlatButton from './FlatButton';
import Authorization from './Authorization';
import AccountButton from './AccountButton';


const StyledText = styled(Text)`
  transition: all 0.5s ease-in-out;
  :active:hover {
    transform: scale(1.25);
    }
  :hover {
    transform: scale(1.25);
  }
`;

interface LinkProps {
  link: string;
  text: string;
  disabled: boolean;
}

const YieldHeader = (props: any) => {
  const { account } = useWeb3React();
  const {
    activeView,
    setActiveView,
  } = props;

  const { state: { pendingTxs, lastCompletedTx } } = useContext(NotifyContext);
  const { state: { yieldLoading } } = useContext(YieldContext);
  const screenSize = useContext(ResponsiveContext);

  // Menu state for mobile later
  const [menuOpen, setMenuOpen] = useState(false);

  const [navLinks] = useState([
    {
      link: 'BORROW',
      text: 'Borrow',
      id: 1,
      disabled: false,
    },
    {
      link: 'LEND',
      text: 'Lend',
      id: 2,
      disabled: false,
    },
    {
      link: 'POOL',
      text: 'Pool',
      id: 3,
      disabled: false,
    },
  ]);

  const theme = useContext<any>(ThemeContext);

  function toggleMenu() {
    setMenuOpen((prevMenu) => !prevMenu);
  }

  const MenuButton = () => (
    <Button
      onClick={toggleMenu}
      fill="horizontal"
      style={{
        textAlign: 'right',
      }}
    >
      Menu
    </Button>
  );

  const MobileNav = () => {
    return (
      <>
        { menuOpen &&
        <Layer full>
          <Box background='background' fill>
            <Nav />
          </Box>       
        </Layer>}
      </>
    );
  };


  const Nav = () => (
    <Box
      direction={screenSize === 'small' ? 'column' : 'row'}
      fill={screenSize === 'small' ? 'horizontal' : false}
      gap='medium'
    >
      { 
      navLinks.map((item) => (
        <Box
          direction="row-responsive"
          onClick={() => {
            !item.disabled && setActiveView(item.link);
            setMenuOpen(false);
          }}
          gap="small"
          key={item.id}
        >
          <StyledText
            weight='bold'
            // eslint-disable-next-line no-nested-ternary
            color={item.disabled ? 'lightgrey' : activeView === item.link ? 'brand' : 'text-xweak'}
            size={screenSize === 'small' ? 'medium' : 'xlarge'}
            style={{ 
              textDecoration: activeView === item.link ? 'none' : 'none', 
              width: screenSize === 'small' ? '100%' : 'auto',           
            }}

          >
            {item.text}
          </StyledText>
        </Box>
      ))
    }
    </Box>
  );

  return (
    <Box
      background='background-front'
      direction='row'
      pad={{ horizontal:'small', vertical:'large' }}
      justify='between'
      fill='horizontal'
      align='center'
      // width={{ max:'1200px' }}
    >
      <Box>
        <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
      </Box>

      <Box>
        { screenSize === 'small' ? 
          <MobileNav /> 
          : 
          <Nav />}
      </Box>

      <Box>
        {screenSize === 'small' ? (
          <MenuButton />
        ) : (
          <Box direction="row" align="center" gap="small">
            <AccountButton {...props} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default YieldHeader;
