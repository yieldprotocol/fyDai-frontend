import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, Button, Text } from 'grommet';
import Authorization from './Authorization';

import { SeriesContext } from '../contexts/SeriesContext';


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

  return (
    <>
      { props.hasDelegatedPool ? 
        <StyledBox 
          {...props} 
          fill='horizontal'
          align='center'
          pad='small'
        >
          <Text 
            weight='bold'
            size='large'
            color={props.disabled ? 'background' : 'brand'}
          >
            {props.label}
          </Text>
        </StyledBox>   
        :
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
              weight='bold'
              size='large'
              color={props.disabled ? 'background' : 'brand'}
            >
              Please unlock this series first
            </Text>
          </StyledBox>
        </Authorization>}
    </>
  );
}



export default ActionButton;