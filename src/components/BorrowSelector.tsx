import React, { useContext } from 'react';
import { Box, Button, Text, ResponsiveContext } from 'grommet';
import styled, { css } from 'styled-components';
import { useSignerAccount } from '../hooks';
import RaisedButton from './RaisedButton';

interface IActionSelectorProps {
  setActiveView: any;
  activeView: number;
}

const StyledBox = styled(Box)`
  
  border-radius: 25px;
  border-color: #f0f0f0;
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

function BorrowSelector({ setActiveView, activeView }:IActionSelectorProps) {
  const screenSize = useContext(ResponsiveContext);
  const { account } = useSignerAccount();


  const toggleActiveView = () => {
    activeView === 0 && setActiveView(1);
    activeView === 1 && setActiveView(0);
  };
  
  return (
    <>
      <Box align='start'>
        <Box
          align='start'
          round
          direction="row"
          gap="medium"
          justify='start'
          // background='#f0f0f0'
          pad='2px'
        >
          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'medium', vertical: 'xsmall' }}
              onClick={() => setActiveView(1)}
              border={activeView !== 1 ? undefined : 'all'}
            >
              <Text size="small">
                Borrow Dai
              </Text>
            </StyledBox>
          </Box>

          <Box gap='small' align='end'>
            {/* <Text size='xxsmall' color='brand'>Step 1</Text> */}
            <StyledBox
              round='large'
              pad={{ horizontal: 'medium', vertical: 'xsmall' }}
              onClick={() => toggleActiveView()}
              border={activeView !== 0 ? undefined : 'all'}
            >
              <Text size="small">
                Manage Collateral
              </Text>
              {/* {position.ethPosted>0 && <CheckCircle color="green" />} */}
            </StyledBox>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default BorrowSelector;
