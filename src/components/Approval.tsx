import React from 'react';
import { Box, CheckBox, ThemeContext } from 'grommet';
import { ScaleLoader } from 'react-spinners';

import { useToken } from '../hooks';

function Approval({ inputValue, approved, approveProcedure }:any) {

  const theme:any = React.useContext(ThemeContext);
  const { approveActive } = useToken();

  return (
    <Box margin='medium'>
      {approveActive || approved === undefined ?             
        <ScaleLoader color={theme?.global?.colors['brand-transparent'].dark} height='13' />
        : <CheckBox
          reverse
          checked={approved && !inputValue || ( approved >= inputValue )}
          disabled={!inputValue || ( approved >= inputValue )}
          onChange={()=>approveProcedure(inputValue)}
          label={            
        (approved >= inputValue) ? 
          `${approved.toFixed(2) || '' } Dai are unlocked.` 
          : `Unlock ${inputValue || ''} DAI`
      }
        />}
    </Box>
  );
}

export default Approval;
