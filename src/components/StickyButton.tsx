import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, ResponsiveContext, ThemeContext } from 'grommet';

import { modColor } from '../utils';

const StyledBox = styled(Box)`
  border-radius: 25px;
  transition: all 0.3s ease-in-out;

  ${(props:any) => !(props.selected) && css`
  background: ${ props.background };
  border-color: ${ props.background };
  box-shadow: 0px 0px 0px ${modColor(props.background, -15)}, -0px -0px 0px ${modColor(props.background, 10)};
  :active:hover {
    transform: scale(1);
    box-shadow: inset 6px 6px 11px ${modColor(props.background, -15)}, inset -6px -6px 11px ${modColor(props.background, 10)};
    }
  :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px ${modColor(props.background, -15)}, -6px -6px 11px ${modColor(props.background, 10)};
    }
  `}
  
  ${(props:any) => (props.selected) && css`
  background: ${ props.background };
  border-color: ${ props.background };
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

  ${(props:any) => (props.disabled) && css`
  box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
    -0px -0px 0px ${modColor(props.background, 10)};
  :active:hover {
    box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
        -0px -0px 0px ${modColor(props.background, 10)};
    }
  :hover {
    transform: scale(1);
    }
  `}
`;

function StickyButton({ children, ...props }:any) {
  
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  return (
    <>
      <StyledBox 
        {...props}
        background={props.background || defaultBackground}
      >
        {children}    
      </StyledBox>
    </>
  );
}

export default StickyButton;
