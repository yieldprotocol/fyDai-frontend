import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, Text } from 'grommet';
import Authorization from './Authorization';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

const StyledBox = styled(Box)`
  background: #f8f8f8;
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
  
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { authorizations: { hasDelegatedProxy } } = userState;

  return (
    <>
      { hasDelegatedProxy && props.hasDelegatedPool &&
      <StyledBox 
        {...props} 
        fill='horizontal'
        align='center'
        pad='small'
      >
        <Text 
          weight='bold'
          size='large'
          color={props.disabled ? 'background' : activeSeries?.seriesTextColor }
        >
          {props.label}
        </Text>
      </StyledBox>}

      { !hasDelegatedProxy &&   
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
              color={props.disabled ? 'background' : activeSeries?.seriesTextColor}
            >
              Please authorise Yield before making any transactions
            </Text>
          </StyledBox>
        </Authorization>}

      { hasDelegatedProxy && !props.hasDelegatedPool &&
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
              color={props.disabled ? 'background' : activeSeries?.seriesTextColor}
            >
              Please unlock this series first
            </Text>
          </StyledBox>
        </Authorization>}
    </>
  );
}



export default ActionButton;