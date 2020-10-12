import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Text, Layer, Nav, ThemeContext } from 'grommet';

import { FiArrowRight as ArrowRight, FiMenu as MenuIcon } from 'react-icons/fi';

const YieldMobileNav = ({ children }:any) =>  {
  const theme = useContext<any>(ThemeContext);

  return (
    <Layer
      position='bottom'
      modal={false}
      responsive={false}
      full='horizontal'
    >
      <Nav
        direction="row"
        background="background-mid"          
        round={{ corner:'top', size:'small' }}
        elevation='small'
        pad="medium"
        justify='evenly'
      >
        <MenuIcon />
        {children}
      </Nav>
    </Layer>
  );
}

export default YieldMobileNav;
