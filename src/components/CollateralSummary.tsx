import React, { useContext } from 'react';
import { Box, Button, Text, ResponsiveContext } from 'grommet';
import styled, { css } from 'styled-components';
import { useSignerAccount } from '../hooks';
import RaisedButton from './RaisedButton';

import { modColor, invertColor, contrastColor } from '../utils';


import { SeriesContext } from '../contexts/SeriesContext';


interface IActionSelectorProps {
  setActiveView: any;
  activeView: number;
}

const StyledBox = styled(Box)`
  background: #f8f8f8;
  border-radius: 25px;
  border-color: #f8f8f8;
  transition: all 0.3s ease-in-out;

  ${(props:any) => !(props.border) && css`
  box-shadow: 0px 0px 0px #dfdfdf, -0px -0px 0px #ffffff;
  :active:hover {
    transform: scale(1);
    box-shadow: inset 6px 6px 11px #dfdfdf, inset -6px -6px 11px #ffffff;
    }
  :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px #dfdfdf, -6px -6px 11px #ffffff;
    }
  `}

  ${(props:any) => (props.border) && css`
  box-shadow:  inset 6px 6px 11px #dfdfdf,  
    inset -6px -6px 11px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    }
  :hover {
    /* transform: scale(1.01); */
    }
  `}

  ${(props:any) => (props.disabled) && css`
  box-shadow:  0px 0px 0px #dfdfdf, 
    -0px -0px 0px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    }
  :hover {
    transform: scale(1);
    }
  `}
`;

function CollateralSummary({ setActiveView, activeView }:IActionSelectorProps) {
  const screenSize = useContext(ResponsiveContext);
  const { account } = useSignerAccount();

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 

  const toggleActiveView = () => {
    activeView === 0 && setActiveView(1);
    activeView === 1 && setActiveView(0);
  };
  
  return (
    <Box gap='small' align='end'>
      <StyledBox
        round='large'
        pad={{ horizontal: 'large', vertical: 'xsmall' }}
        onClick={() => toggleActiveView()}
        border={activeView !== 0 ? undefined : 'all'}
      >
        <Text size="small">
          Manage Collateral
        </Text>
        {/* {position.ethPosted>0 && <CheckCircle color="green" />} */}
      </StyledBox>
    </Box>
  );
}

export default CollateralSummary;
