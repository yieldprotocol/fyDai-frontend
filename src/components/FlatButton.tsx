import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Button, Text } from 'grommet';

import { modColor } from '../utils';

const StyledButton = styled(Button)`
  border-radius: 25px;
  transition: all .3s ease-in-out;
  background: #f8f8f8;
  box-shadow:  0px 0px 0px #dfdfdf, -0px -0px 0px #ffffff;
  :active:hover {
    transform: scale(1);
    box-shadow: inset 6px 6px 11px #dfdfdf, inset -6px -6px 11px #ffffff;
  }
  :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px #dfdfdf, -6px -6px 11px #ffffff;
  }

${(props:any) => props.background && css`
    background: ${ props.background };
    box-shadow:  0px 0px 0px ${modColor(props.background, -20)}, -0px -0px 0px ${modColor(props.background, 10)};
    :active:hover {
    transform: scale(1);
    box-shadow:  6px 6px 11px ${modColor(props.background, -20)}, -6px -6px 11px ${modColor(props.background, 10)};
    }
    :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px ${modColor(props.background, -20)}, -6px -6px 11px ${modColor(props.background, 10)};
}
`}
`;

function FlatButton({ selected=true, ...props }:any ) {
  return (
    <>
      <StyledButton 
        {...props} 
        plain
        label={
          <Box pad={{ horizontal:'small', vertical:'xsmall' }}>
            <Text size='xxsmall' color='brand'>
              {props.label}
            </Text>
          </Box>
          }
        pad={{ horizontal:'large', vertical:'none' }}
      />
    </>
  );
}

export default FlatButton;
