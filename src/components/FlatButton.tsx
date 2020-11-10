import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Button, Text, ThemeContext } from 'grommet';

import { modColor } from '../utils';

const StyledButton = styled(Button)`
  border-radius: 25px;
  
  -webkit-transition: background 0.3s ease-in-out;
  -moz-transition: background 0.3s ease-in-out;
  transition: background 0.3s ease-in-out;

  -webkit-transition: box-shadow 0.3s ease-in-out;
  -moz-transition: box-shadow 0.3s ease-in-out;
  transition: box-shadow 0.3s ease-in-out;

  -webkit-transition: transform 0.3s ease-in-out;
  -moz-transition: transform 0.3s ease-in-out;
  transition: transform 0.3s ease-in-out;
  
${(props:any) => props.background && css`
    background: ${ props.background };
    border: 1px solid ${props.background};
    box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, -0px -0px 0px ${modColor(props.background, 10)};
    :active:hover {
      border: 1px solid ${ props.background };
    transform: scale(1);
    box-shadow:  6px 6px 11px ${modColor(props.background, -15)}, -6px -6px 11px ${modColor(props.background, 10)};
    }
    :hover {
      border: 1px solid ${ props.background };
    transform: scale(1.02);
    box-shadow:  6px 6px 11px ${modColor(props.background, -15)}, -6px -6px 11px ${modColor(props.background, 10)};
}
`}

${(props:any) => (props.selected) && css`
background: ${ props.background };
box-shadow:  inset 6px 6px 11px ${modColor(props.background, -15)},  
  inset -6px -6px 11px ${modColor(props.background, 10)};
:active:hover {
  box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
      -0px -0px 0px ${modColor(props.background, 10)};
  }
:hover {
  /* transform: scale(1.01); */
  }
`}

`;

function FlatButton({ ...props }:any ) {

  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  return (
    <>
      <StyledButton 
        {...props}
        background={props.background? props.background : defaultBackground}
        plain
        label={
          <Box pad={{ horizontal:'small', vertical:'xsmall' }}>
            <Text size='xsmall'>
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
