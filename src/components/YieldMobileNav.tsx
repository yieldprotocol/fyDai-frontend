import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Image, Box, Text, Layer, Nav, ThemeContext } from 'grommet';
import { FiArrowRight as ArrowRight, FiMenu as MenuIcon } from 'react-icons/fi';

import { SeriesContext } from '../contexts/SeriesContext';
import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

const YieldMobileNav = ({ children }:any) =>  {

  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const theme = useContext<any>(ThemeContext);

  const { state: { activeSeries } } = useContext(SeriesContext);


  return (
    <Box>
      <Layer
        position='bottom'
        modal={false}
        responsive={false}
        full='horizontal'
      >
        <Nav
          background='background'
          direction="row"  
          elevation='medium'
          pad="medium"
          justify='between'
          align='center'
        >
          <Box onClick={()=>setShowSidebar(!showSidebar)}>
            <MenuIcon />
          </Box>   
          {children}
        </Nav>
      </Layer>

      {showSidebar && (  
      <Layer
        animation='slide'
        position='left'
        responsive={false}
        modal={true}
        full='vertical'
        onClickOutside={()=>setShowSidebar(false)}
      >
        <Box
          width={{ min:'60vw' }}
          background='background'
          elevation='small'
          fill
          gap='large'
          pad='small'
        >
          <Box pad='small' align='center'>
            <Box width='30%'>
              <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
            </Box>
          </Box>

          <Box
            gap='small'
            pad='small'
            align='center'
          >
            <NavLink 
              onClick={()=>setShowSidebar(false)}
              to={`/borrow/${activeSeries?.maturity}`}
              activeStyle={{ fontWeight: 'bold', color: `${theme.global.colors.active}` }}
              isActive={(match, location:any) => {
                return (location.pathname.includes('borrow'));
              }}
              style={{ textDecoration:'none' }}
            > 
              <Text weight='bold' size='medium' color='text-weak'>Borrow</Text>
            </NavLink>
            <NavLink 
              onClick={()=>setShowSidebar(false)}
              to={`/lend/${activeSeries?.maturity}`}
              activeStyle={{ fontWeight: 'bold', color: `${theme.global.colors.active}` }}
              style={{ textDecoration:'none' }}
            >
              <Text weight='bold' size='medium' color='text-weak'>Lend</Text>
            </NavLink>
            <NavLink
              onClick={()=>setShowSidebar(false)}
              to={`/pool/${activeSeries?.maturity}`}
              activeStyle={{ fontWeight: 'bold', color: `${theme.global.colors.active}` }}
              style={{ textDecoration:'none' }}   
            >
              <Text weight='bold' size='medium' color='text-weak'>Pool</Text>
            </NavLink> 
          </Box>
        </Box>
      </Layer>
      )}

    </Box>
  );
};

export default YieldMobileNav;
