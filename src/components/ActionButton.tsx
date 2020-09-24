import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Button, Text } from 'grommet';

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

  return (
    <>
      <StyledBox 
        {...props} 
        fill='horizontal'
        // background={props.disabled ? undefined : 'brand'} 
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
    </>
  );
}



export default ActionButton;


// {/* <> 
//         <Box
//           fill='horizontal'
//           round='small'
//           background={repayDisabled ? 'brand-transparent' : 'brand'}
//           onClick={()=>repayProcedure(inputValue)}
//           align='center'
//           pad='small'
//         >
//           <Text 
//             weight='bold'
//             size='large'
//             color={repayDisabled ? 'text-xweak' : 'text'}
//           >
//             {`Repay ${inputValue || ''} DAI`}
//           </Text>
//         </Box>
//       </>  */}