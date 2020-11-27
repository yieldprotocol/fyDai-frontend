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

  -webkit-transition: background 0.3s ease-in-out;
  -moz-transition: background 0.3s ease-in-out;
  transition: background 0.3s ease-in-out;

  -webkit-transition: box-shadow 0.3s ease-in-out;
  -moz-transition: box-shadow 0.3s ease-in-out;
  transition: box-shadow 0.3s ease-in-out;

  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;

  :hover {
    transform: scale(1.2);
  }
`;

const YieldNav = (props: any) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { activeSeries } } = useContext(SeriesContext);
  const theme = useContext<any>(ThemeContext);
  const textColor = theme.dark? theme.global.colors.text.dark : theme.global.colors.text.light;

  return (
    <>
      <Box
        direction='row'
        gap={mobile? 'medium':'large'}
      >
        <StyledLink 
          to={`/borrow/${activeSeries?.maturity}`}
          activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${textColor}` }}
          isActive={(match, location:any) => {
            return (location.pathname.includes('borrow'));
          }}
        > 
          <Text 
            weight='bold' 
            size={mobile? 'small':'xxlarge'}
          >Borrow
          </Text>
        </StyledLink> 

        <StyledLink 
          to={`/lend/${activeSeries?.maturity}`}
          activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${textColor}` }}
        >
          <Text 
            weight='bold' 
            size={mobile? 'small':'xxlarge'} 
          > Lend
          </Text>
        </StyledLink> 

        <StyledLink 
          to={`/pool/${activeSeries?.maturity}`}
          activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${textColor}` }}
        >
          <Text 
            weight='bold' 
            size={mobile? 'small':'xxlarge'} 
          >Pool
          </Text>
        </StyledLink> 

        <StyledLink 
          to={`/trade/${activeSeries?.maturity}`}
          activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${textColor}` }}
        >
          <Text 
            weight='bold' 
            size={mobile? 'small':'xxlarge'} 
          > Trade
          </Text>
        </StyledLink> 

      </Box>
    </>
  );
};

export default YieldNav;