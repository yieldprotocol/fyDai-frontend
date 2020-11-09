import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Collapsible, ThemeContext } from 'grommet';

import InlineAlert from './InlineAlert';
import { modColor } from '../utils';

interface IInputProps {
  warningMsg: string|null;
  errorMsg: string|null;
  children:any;
}

const InsetBox = styled(Box)`
border-radius: 8px;
  ${(props:any) => props.background && css`
    background: ${props.background};
    box-shadow: inset 6px 6px 11px ${modColor(props.background, -20)}, 
            inset -6px -6px 11px ${modColor(props.background, 10)};
  `}
`;

function InputWrap( { warningMsg, errorMsg, children }: IInputProps) {

  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  return (
    <InsetBox
      fill='horizontal'
      gap='none'
      align='center'
      background={defaultBackground}
    >
      <Box 
        round='small' 
        direction='row'
        fill='horizontal'
        pad='small'
        align='stretch'
      >
        {children}   
      </Box>
      <Box 
        fill='horizontal'    
      >
        <Collapsible open={!!warningMsg || !!errorMsg}>
          <InlineAlert warnMsg={warningMsg || null} errorMsg={errorMsg || null} />
        </Collapsible>
      </Box>
    </InsetBox>
  );
}

export default InputWrap;
