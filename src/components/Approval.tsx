import React from 'react';
import { Box, CheckBox, ThemeContext } from 'grommet';

import { useToken } from '../hooks';

function Approval({ inputValue, approved, approveProcedure }:any) {

  const theme:any = React.useContext(ThemeContext);
  const { approveActive } = useToken();

  return (
    <Box margin='medium'>
      {approveActive || approved === undefined ?             
        <>
          loading
        
        </>: <CheckBox
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
