import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, ResponsiveContext } from 'grommet';

const StyledBox = styled(Box)`
display: block;
border-radius: 8px;
background: #f8f8f8;
box-shadow:  8px 8px 11px #dadada, 
             -8px -8px 11px #ffffff;

${(props:any) => props.background && css`
  background: ${props.background};
`}
`;

function RaisedBox({ children }:any ) {
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  return (
    <>
      { !mobile ?
        <StyledBox 
          width={{ max:'600px' }}
          alignSelf='center'
          fill='horizontal'
          round='small'
        >
          {children}    
        </StyledBox>
        : 
        <Box
          width={{ max:'600px' }}
          alignSelf='center'
          fill='horizontal'
          round='small' 
          style={{ display:'block' }}
        >
          {children}
        </Box>}
    </>
  );
}

export default RaisedBox;
