import React, { useContext } from 'react';
import { NavLink, useLocation, useHistory } from 'react-router-dom';
import {
  Text,
  Image,
  Box,
  ThemeContext,
  ResponsiveContext,
  Layer,
  Nav,
} from 'grommet';
import { VscTelescope as Telescope } from 'react-icons/vsc';
import { FiArrowLeft as ArrowLeft, FiMenu as MenuIcon } from 'react-icons/fi';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

import AccountButton from './AccountButton';
import FlatButton from './FlatButton';

const YieldHeader = (props: any) => {
  const screenSize = useContext(ResponsiveContext);
  const theme = useContext<any>(ThemeContext);
  const location = useLocation();
  const history = useHistory();

  return (
    <>
      <Box
        direction='row'
        pad={screenSize==='small'? { horizontal:'medium', top:'medium' }: { horizontal:'small', top:'large' }}
        justify='between'
        fill
      >
        {screenSize !=='small' &&
        <Box width={screenSize==='small'? '20%':undefined}>
          <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
        </Box>}

        { screenSize==='small' && location.pathname.split('/')[2]!=='collateral' && 
        <Box direction='row' gap='medium' align='center'>

          <Box width={screenSize==='small'? '30%':undefined}>
            <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
          </Box>   
          {/* <Box onClick={()=>history.push('/borrow/')}> <MenuIcon /> </Box> */}
          <Text weight='bold' size='medium' style={{ textTransform:'capitalize' }}> {location.pathname.split('/')[1]} </Text>
        </Box>}

        { screenSize==='small' && location.pathname.split('/')[2]==='collateral' && 
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/borrow/')}> <ArrowLeft /> </Box>
          <Text weight='bold' size='medium'> Manage Collateral</Text>
        </Box>}

        <Box direction='row' gap='small'>
          {screenSize !== 'small' &&
          <Box direction="row" align="center" gap="small">
            <AccountButton {...props} />
          </Box>}
          <FlatButton 
            onClick={()=>console.log('xys')}
            label={<Box pad={{ horizontal:'small' }}><Telescope /></Box>}
          /> 
        </Box>
      </Box>
      {/*
      {screenSize === 'small' &&  
        
      <Layer
        position='left'
        modal={false}
        responsive={false}
        full='vertical'
      >
        <Nav
          background="background-mid"          
          round={{ corner:'top', size:'small' }}
          elevation='small'
          pad="medium"
          justify='evenly'
        >
          <NavLink 
            to='/borrow/'
            activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme?.global.colors.active}` }}
            style={{ textDecoration: 'none' }}
          >
            <Text size='xsmall'>Borrow</Text>
          </NavLink>

          <NavLink 
            to='/lend/'
            activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme?.global.colors.active}` }}
            style={{ textDecoration: 'none' }}
          >
            <Text size='xsmall'>Lend</Text>
          </NavLink>

          <NavLink 
            to='/pool/'
            activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme?.global.colors.active}` }}
            style={{ textDecoration: 'none' }}
          >
            <Text size='xsmall'>Pool</Text>
          </NavLink>
        </Nav>
      </Layer>} */}
    </>
  );
};

export default YieldHeader;
