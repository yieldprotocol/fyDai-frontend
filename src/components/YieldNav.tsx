import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  Text,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';

const StyledLink = styled(NavLink)`
  text-decoration: none;
  -webkit-transition: all 0.5s ease-in-out;
  -moz-transition: all 0.5s ease-in-out;
  transition: all 0.5s ease-in-out;
  :hover {
    transform: scale(1.2);
  }
`;

const YieldNav = (props: any) => {

  const screenSize = useContext(ResponsiveContext);
  const theme = useContext<any>(ThemeContext);

  return (
    <Box
      direction={screenSize === 'small' ? 'column' : 'row'}
      fill={screenSize === 'small' ? 'horizontal' : false}
      gap='large'
      align='center'
    >
      <StyledLink 
        to='/borrow' 
        activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme.global.colors.active}` }}
      > 
        <Text weight='bold' size='xxlarge'>Borrow</Text>
      </StyledLink> 

      <StyledLink 
        to='/lend' 
        activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme.global.colors.active}` }}
      >
        <Text weight='bold' size='xxlarge'>Lend</Text>
      </StyledLink> 

      <StyledLink 
        to='/pool'
        activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme.global.colors.active}` }}
      >
        <Text weight='bold' size='xxlarge'>Pool</Text>
      </StyledLink> 
    </Box>
  );
};

export default YieldNav;