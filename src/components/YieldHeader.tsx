import React, { useState, useContext } from 'react';
import {
  Image,
  Button,
  Box,
  ThemeContext,
  ResponsiveContext,
  Layer,
} from 'grommet';
import { VscTelescope as Telescope } from 'react-icons/vsc';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

import AccountButton from './AccountButton';
import FlatButton from './FlatButton';
import YieldNav from './YieldNav';

const YieldHeader = (props: any) => {

  const screenSize = useContext(ResponsiveContext);

  // Menu state for mobile later
  const [menuOpen, setMenuOpen] = useState(false);

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
            <YieldNav />
          </Box>       
        </Layer>}
      </>
    );
  };

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
          { screenSize === 'small' && <MobileNav /> }
        </Box>
      </Box>
    </Box>
  );
};

export default YieldHeader;
