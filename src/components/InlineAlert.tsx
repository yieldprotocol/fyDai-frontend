import React, { useEffect, useState, useContext } from 'react'; 
import { Box, Text, defaultProps } from 'grommet';

interface ErrorDisplayProps {
  warnMsg: string | null;
  errorMsg: string | null;
  warnHead?: string | null;
  errorHead?: string | null;
}

const defaultHeadings = { 
  warnHead: 'Procced with Caution',
  errorHead: 'Oops!',
};

const InlineAlert = ({ warnMsg, errorMsg, warnHead, errorHead }:ErrorDisplayProps) => {

  return (
    <>
      { warnMsg &&
      <Box 
        // border={[{ color: 'orange', side:'bottom' }, { color: 'orange', side:'vertical' }]} 
        // border={{color:'orange'}}
        fill
        round={{ corner:'bottom', size:'small' }}
        pad='small'
      >
        <Text weight='bold' color='orange'>{warnHead}</Text>  
        <Text color='orange'>{warnMsg}</Text>
      </Box> }

      { errorMsg &&
      <Box
        // border={[{ color: 'red', side:'bottom' }, { color: 'red', side:'vertical' }]}
        // border={{color:'red'}}
        background='#ff000025'
        fill
        round={{ corner:'bottom', size:'small' }}
        pad='small'
      >
        <Text weight='bold' color='red'>{errorHead}</Text>  
        <Text color='red'>{errorMsg}</Text>
      </Box> }    
    </>
  );
};

InlineAlert.defaultProps = defaultHeadings;

export default InlineAlert;
