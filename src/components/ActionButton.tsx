import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, Text } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import Authorization from './Authorization';

const color = '#f8f8f8';

const StyledBox = styled(Box)`
  background: ${color};
  border-radius: 8px;
  transition: all 0.3s ease-in-out;

  ${(props:any) => props.disabled && css`
  box-shadow:  0px 0px 0px #dfdfdf, 
  -0px -0px 0px #ffffff;
  :hover {
    transform: scale(1);
    box-shadow:  0px 0px 0px #dfdfdf,  
    -0px -0px 0px #ffffff;
    }
  `}

  ${(props:any) => !(props.disabled) && css`
  box-shadow:  6px 6px 11px #dfdfdf,  
  -6px -6px 11px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    } 
  :hover {
    transform: scale(1.01);
    box-shadow:  8px 8px 11px #dfdfdf,  
    -8px -8px 11px #ffffff;
    }
  `}
`;

function ActionButton({ ...props }:any ) {

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  
  const { state: userState } = useContext(UserContext);
  const { authorizations: { hasDelegatedProxy } } = userState;

  return (
    <>
      { hasDelegatedProxy && props.hasDelegatedPool && !props.disabled &&
      <StyledBox 
        {...props} 
        fill='horizontal'
        align='center'
        pad='small'
      >
        <Text 
          weight='bold'
          size='large'
          color={activeSeries?.seriesTextColor}
        >
          {props.label}
        </Text>
      </StyledBox>}

      { !hasDelegatedProxy && !props.disabled &&    
        <Authorization 
          authWrap
        >
          <StyledBox 
            {...props} 
            fill='horizontal'
            align='center'
            pad='small'
            onClick={()=>{ }}
          >
            <Text 
              size='medium'
              color={activeSeries?.seriesTextColor}
            >
              Please authorize Yield before going any further
            </Text>
          </StyledBox>
        </Authorization>}

      { hasDelegatedProxy && !props.hasDelegatedPool && !props.disabled &&
        <Authorization 
          authWrap
          series={activeSeries}
        >
          <StyledBox 
            {...props} 
            fill='horizontal'
            align='center'
            pad='small'
            onClick={()=>{ }}
          >
            <Text 
              size='medium'
              color={activeSeries?.seriesTextColor}
            >
              Please unlock this series first
            </Text>
          </StyledBox>
        </Authorization>}

      { props.disabled && 
        <StyledBox 
          {...props} 
          fill='horizontal'
          align='center'
          pad='small'
        >
          <Text 
            size='medium'
            color='background'
          >
            click me.
          </Text>
        </StyledBox>}
    </>
  );
}


export default ActionButton;