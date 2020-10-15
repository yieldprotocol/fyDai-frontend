import { Box, Stack, Text } from 'grommet';
import React from 'react';

function ExperimentWrap( { children }:any) {
  return (
    <>
      <Stack
        anchor='top-right'
        fill
      >
        {children}

        <Box margin={{ top:'-8px', right:'8px' }}>
          <Text size='xxsmall' color='red'> Experimental</Text>
        </Box>
        
      </Stack>
    </>
  );
}

export default ExperimentWrap;
