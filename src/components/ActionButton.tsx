import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Text, Box, Layer, ResponsiveContext } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';

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

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  
  const { state: userState } = useContext(UserContext);
  const { authorizations: { hasDelegatedProxy } } = userState;

  return (
    <>
      { !mobile && hasDelegatedProxy && props.hasDelegatedPool && !props.disabled &&
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

      { !mobile && !hasDelegatedProxy && !props.disabled &&    
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

      { !mobile && hasDelegatedProxy && !props.hasDelegatedPool && !props.disabled &&
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

      { !mobile && props.disabled && 
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

      { mobile && !props.disabled &&
      <Layer
        position='bottom'
        modal={false}
        responsive={false}
        full='horizontal'
      >
        <Box
          background='background'
          direction="row"  
          elevation='medium'
          pad="medium"
          justify='between'
          align='center'
        >
          
          <Box
            onClick={()=>props.clearInput()}
          > 
            <Text size='xxsmall'>Cancel</Text>
          </Box>

          <Box {...props} direction='row' align='center' gap='small'>  
            <Text weight='bold'> {props.label} </Text>
            <ArrowRight color={activeSeries?.seriesColor} />
          </Box>     
        </Box>
      </Layer>}
    </>
  );
}


export default ActionButton;