import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import {
  Text,
  Image,
  Button,
  Box,
  ThemeContext,
  ResponsiveContext,
  Layer
} from 'grommet';
import { VscTelescope as Telescope } from 'react-icons/vsc';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

import AccountButton from './AccountButton';
import FlatButton from './FlatButton';

const StyledText = styled(Text)`
  transition: all 0.5s ease-in-out;
  :active:hover {
    transform: scale(1.25);
    }
  :hover {
    transform: scale(1.25);
  }
`;

const YieldHeader = (props: any) => {
  const {
    activeView,
    setActiveView,
  } = props;

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
      gap='large'
      align='center'
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
            size={screenSize === 'small' ? 'medium' : 'xxlarge'}
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
    <Box fill>
      <Box
        direction='row'
        pad={{ horizontal:'small', top:'large' }}
        justify='between'
        fill='horizontal'
      >
        <Box alignSelf='start'>
          <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
        </Box>

        <Box direction='row' gap='small'>
          {screenSize === 'small' ? (
            <MenuButton />
          ) : (
            <Box direction="row" align="center" gap="small">
              <AccountButton {...props} />
            </Box>
          )}
          <FlatButton 
            onClick={()=>console.log('xys')}
            label={<Box pad={{ horizontal:'small' }}><Telescope /></Box>}
          /> 
        </Box>
      </Box>

      <Box
        direction='row'
        justify='center'
        pad={{ horizontal:'small', top:'large' }}
        fill='horizontal'
      >
        <Box alignSelf='center'>
          { screenSize === 'small' ? 
            <MobileNav /> 
            : 
            <Nav />}
        </Box>
      </Box>
    </Box>
  );
};

export default YieldHeader;
