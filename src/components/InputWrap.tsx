import React, { useState, useContext, useEffect } from 'react';
import { BigNumber } from 'ethers';

import styled, { css } from 'styled-components';

import { 
  Box, 
  Collapsible,
} from 'grommet';

import { 
  FiInfo as Info,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';

import InlineAlert from './InlineAlert';

interface IInputProps {
  warningMsg: string|null;
  errorMsg: string|null;
  disabled?: boolean,
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

function InputWrap( { warningMsg, errorMsg, disabled, children }: IInputProps) {

  const [ border, setBorder ] = useState<any>('all');
  const [ corners, setCorners ] = useState<any>('small');
  const [ animation, setAnimation ] = useState<any>(null);

  useEffect(()=>{

    if (errorMsg || warningMsg) {
      setCorners({ corner:'top', size:'small' });
      setAnimation([{ type:'jiggle', duration:100, size:'xsmall' }, { type:'none', delay:1000 }] );
      errorMsg && setBorder([{ color: 'red', side:'top' }, { side:'bottom' }, { color: 'red', side:'vertical' }]);
      warningMsg && setBorder([{ color: 'orange', side:'top' }, { side:'bottom' }, { color: 'orange', side:'vertical' }]);
    } else { 
      setCorners('small');
      setBorder('all');
    }
  }, [errorMsg, warningMsg]);


  return (
    <InsetBox
     // direction='row-responsive'
      fill='horizontal'
      gap='none'
      align='center'
      // animation={animation}   
    >
      <Box 
        round={corners}
        // background='brand-transparent'
        // border={border}   
        direction='row'
        fill='horizontal'
        pad='small'
        align='stretch'
      >
        {children}   
      </Box>

      <Box fill='horizontal'>
        <Collapsible open={!!warningMsg || !!errorMsg}>
          <InlineAlert warnMsg={warningMsg || null} errorMsg={errorMsg || null} />
        </Collapsible>
      </Box>
    </InsetBox>
  );
}

InputWrap.defaultProps = { disabled:false };

export default InputWrap;
