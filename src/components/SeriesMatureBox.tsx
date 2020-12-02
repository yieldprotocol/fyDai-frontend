import React from 'react';
import { Box, Text } from 'grommet';
import { FiClock as Clock } from 'react-icons/fi';

const SeriesMatureBox = () => {
  return (
    <Box 
      gap='medium' 
      margin={{ vertical:'small' }}      
      round='small'
      fill='horizontal'
      border='all'
      pad='small'
    >    
      <Box direction='row' gap='small' justify='center' fill>          
        <Box>
          <Clock />
        </Box>
        <Box> 
          <Text size='small'> This series has matured.</Text>         
        </Box>
      </Box>
    </Box>
  );
};

export default SeriesMatureBox;
