import React, {useContext} from 'react';
import styled, { css } from 'styled-components';
import { Box, ThemeContext } from 'grommet';

const StyledBox = styled(Box)`
border-radius: 8px;
background: #f8f8f8;
box-shadow:  29px 29px 31px #dadada, 
             -29px -29px 31px #ffffff;

  ${(props:any) => props.background && css`
    background: ${props.background};
    color: black;
  `}
`

function RaisedBox({ inset=false, children }:any ) {

  const theme:any = useContext(ThemeContext);

  theme && console.log(theme);

  return (
    <StyledBox>
      {children}    
    </StyledBox>
  );
}

export default RaisedBox;
