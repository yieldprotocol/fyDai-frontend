import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Button, Text } from 'grommet';

import { modColor } from '../utils';

const StyledButton = styled(Button)`
  border-radius: 25px;
  background: #f8f8f8;
  transition: all .3s;
  box-shadow:  6px 6px 11px #dfdfdf,  
               -6px -6px 11px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
                 -0px -0px 0px #ffffff;
  }
  :hover {
    transform: scale(1.02);
    box-shadow:  8px 8px 11px #dfdfdf,  
    -8px -8px 11px #ffffff;
  }

${(props:any) => props.background && css`
     background: ${ props.background };
     box-shadow:  6px 6px 11px ${modColor(props.background, -20)}, -6px -6px 11px ${modColor(props.background, 10)};
      :active:hover {
    box-shadow:  0px 0px 0px ${modColor(props.background, -20)}, -0px -0px 0px ${modColor(props.background, 10)};
    }
    :hover {
    transform: scale(1.02);
    box-shadow:  8px 8px 11px ${modColor(props.background, -20)}, -8px -8px 11px ${modColor(props.background, 10)};
}
`}
`;

function RaisedButton({ selected=true, ...props }:any ) {

  return (
    <>
      <StyledButton 
        {...props} 
        plain
        label={
          <Box pad={{ horizontal:'small' }}>
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

export default RaisedButton;
