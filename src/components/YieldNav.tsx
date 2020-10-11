import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  Text,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';

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
  const { state: { activeSeries } } = useContext(SeriesContext);
  const theme = useContext<any>(ThemeContext);

  return (
    <Box
      direction={screenSize === 'small' ? 'column' : 'row'}
      fill={screenSize === 'small' ? 'horizontal' : false}
      gap='large'
      align='center'
    >
      <StyledLink 
        to={`/borrow/${activeSeries?.maturity}`}
        activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme.global.colors.active}` }}
      > 
        <Text weight='bold' size='xxlarge'>Borrow</Text>
      </StyledLink> 

      <StyledLink 
        to={`/lend/${activeSeries?.maturity}`}
        activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme.global.colors.active}` }}
      >
        <Text weight='bold' size='xxlarge'>Lend</Text>
      </StyledLink> 

      <StyledLink 
        to={`/pool/${activeSeries?.maturity}`}
        activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme.global.colors.active}` }}
      >
        <Text weight='bold' size='xxlarge'>Pool</Text>
      </StyledLink> 
    </Box>
  );
};

export default YieldNav;