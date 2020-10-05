import React, { useEffect, useState, useContext } from 'react'; 
import { Box, Text, defaultProps } from 'grommet';

import { 
  FiAlertCircle as AlertCircle,
} from 'react-icons/fi';

interface ErrorDisplayProps {
  warnMsg: string | null;
  errorMsg: string | null;
  warnHead?: string | null;
  errorHead?: string | null;
}

const defaultHeadings = { 
  warnHead: '',
  errorHead: '',
};

// linear-gradient(to top, #efa1a1, #f1b6c6, #eecde1, #eee4f1, #f8f8f8);

const InlineAlert = ({ warnMsg, errorMsg, warnHead, errorHead }:ErrorDisplayProps) => {

  return (
    <>
      { warnMsg &&
      <Box 
        fill
        round={{ corner:'bottom', size:'small' }}
        pad='medium'
      >
        <Text weight='bold' color='orange'>{warnHead}</Text>  
        <Text color='orange' size='xsmall'>{warnMsg}</Text>
      </Box> }

      { errorMsg &&
      <Box
        fill
        round={{ corner:'bottom', size:'small' }}
        pad='medium'
      >
        <Text weight='bold' color='red'>{errorHead}</Text>  
        <Text color='red' size='xsmall'>{errorMsg}</Text>
      </Box> }
    </>
  );
};

InlineAlert.defaultProps = defaultHeadings;

export default InlineAlert;
