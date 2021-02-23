import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, Collapsible, ResponsiveContext, ThemeContext } from 'grommet';

import { modColor } from '../utils';
import Loading from './Loading';

const StyledBox = styled(Box)`
display: block;
border-radius: 8px;

${(props:any) => props.background && css`
     background: ${ props.background };
     box-shadow:  8px 8px 11px 2px ${modColor(props.background, -10)}, 
             -8px -8px 11px 2px ${modColor(props.background, 10)};
}
`}
`;

function RaisedBox({ expand, children, loading=false }:any ) {

  const open = expand;

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  return (
    <>
      { !mobile ?
        <StyledBox 
          width={{ max:'600px' }}
          alignSelf='center'
          fill='horizontal'
          round='small'
          background={defaultBackground}
          animation='fadeIn'
        >
          {
            !open &&
            <Box pad='small' align='center' animation='fadeIn'>
              <Loading condition size='large' color='lightgrey'>
                <Box />
              </Loading>
            </Box>
          }
          <Collapsible open={open}>
            {children} 
          </Collapsible> 
        </StyledBox>
        : 
        <Box
          width={{ max:'600px' }}
          alignSelf='center'
          fill='horizontal'
          round='small' 
          style={{ display:'block' }}
          animation='fadeIn'
        >
          {children}
        </Box>}
    </>
  );
}

export default RaisedBox;
