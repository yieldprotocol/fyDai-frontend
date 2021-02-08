import React from 'react';
import { Box, Text } from 'grommet';
import { FiClock as Clock } from 'react-icons/fi';

const SeriesMatureBox = () => {
  return (
  // <Box 
  //   gap='medium' 
  //   margin={{ vertical:'small' }}      
  //   round='small'
  //   fill='horizontal'
  //   border='all'
  //   pad='small'
  // >    
  //   <Box direction='row' gap='small' justify='center' fill>          
  //     <Box>
  //       <Clock />
  //     </Box>
  //     <Box> 
  //       <Text size='small'> This series has matured.</Text>         
  //     </Box>
  //   </Box>
  // </Box>

    <Box 
      width={{ max: '600px' }}
      alignSelf="center"
      fill
      background='#666666'
      // round='small'
      pad={{ bottom: 'medium', top:'small', horizontal:'small' }}
      gap='small'   
      margin={{ bottom:'-12px' }}
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
