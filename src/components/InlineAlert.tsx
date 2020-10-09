import React from 'react'; 
import { Box, Text } from 'grommet';

interface ErrorDisplayProps {
  warnMsg: string | null;
  errorMsg: string | null;
  warnHead?: string | null;
  errorHead?: string | null;
}

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

InlineAlert.defaultProps = { warnHead: '', errorHead: ''};

export default InlineAlert;
