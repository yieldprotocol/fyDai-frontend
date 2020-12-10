import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Button, Text, ThemeContext } from 'grommet';

import { modColor } from '../utils';

const StyledButton = styled(Button)`
border-radius: 25px;

${(props:any) => props.disabled && css`
    background: ${ props.background };
    box-shadow:  0px 0px 0px ${modColor(props.background, 0)}, -0px -0px 0px ${modColor(props.background, 0)};
    -webkit-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    -moz-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    transition: transform 0.3s ease, box-shadow 0.3s ease-out;
`}


${(props:any) => props.background && css`
    background: ${ props.background };
    box-shadow:  6px 6px 11px ${modColor(props.background, -20)}, -6px -6px 11px ${modColor(props.background, 10)};
    :active:hover {
      box-shadow:  0px 0px 0px ${modColor(props.background, -20)}, -0px -0px 0px ${modColor(props.background, 10)};
      -webkit-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
      -moz-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
      transition: transform 0.3s ease, box-shadow 0.3s ease-out;
    }
    :hover {
    transform: scale(1.02);
    -webkit-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    -moz-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    transition: transform 0.3s ease, box-shadow 0.3s ease-out;
    box-shadow:  8px 8px 11px ${modColor(props.background, -20)}, -8px -8px 11px ${modColor(props.background, 10)};
}
`}
`;

function RaisedButton({ selected=true, ...props }:any ) {

  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  return (
    <StyledButton
      {...props} 
      background={props.background ? props.background : defaultBackground}
      plain
      pad={{ horizontal:'large', vertical:'none' }}
      label={null}
    >
      <Box pad={{ horizontal:'small' }} animation='zoomIn'>
        <Text size='xxsmall'>
          {props.label}
        </Text>
      </Box>
    </StyledButton>
  );
}

export default RaisedButton;
