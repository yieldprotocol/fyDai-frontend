import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, ResponsiveContext } from 'grommet';

const StyledBox = styled(Box)`
border-radius: 8px;
background: #f8f8f8;
box-shadow:  29px 29px 31px #dadada, 
             -29px -29px 31px #ffffff;

${(props:any) => props.background && css`
  background: ${props.background};
`}
`;

function RaisedBox({ inset=false, children }:any ) {
  const screenSize = useContext(ResponsiveContext);
  return (
    <>
      { screenSize !=='small' ?
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
        >
          {children}
        </Box>}
    </>
  );
}

export default RaisedBox;
