import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Collapsible } from 'grommet';

import InlineAlert from './InlineAlert';

interface IInputProps {
  warningMsg: string|null;
  errorMsg: string|null;
  children:any;
}

const InsetBox = styled(Box)`
border-radius: 8px;
background: #f8f8f8;
box-shadow: inset 6px 6px 11px #e9e9e9, 
            inset -6px -6px 11px #ffffff;
  ${(props:any) => props.background && css`
    background: ${props.background};
    color: black;
  `}
`;

function InputWrap( { warningMsg, errorMsg, children }: IInputProps) {

  return (
    <InsetBox
      fill='horizontal'
      gap='none'
      align='center'
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
