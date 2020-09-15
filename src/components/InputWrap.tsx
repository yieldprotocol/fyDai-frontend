import React, { useState, useContext, useEffect } from 'react';
import { BigNumber } from 'ethers';

import { 
  Box, 
  TextInput, 
  Text, 
  ThemeContext,
  ResponsiveContext,
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
    <Box
     // direction='row-responsive'
      fill='horizontal'
      gap='none'
      align='center'
      // animation={animation}   
    >
      <Box 
        round={corners}
        // background='brand-transparent'
        border={border}   
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
    </Box>
  );
}

InputWrap.defaultProps = { disabled:false };

export default InputWrap;
