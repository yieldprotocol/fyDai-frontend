import React from 'react';
import { Box, Grid, Heading, Text, Collapsible, Markdown, Layer, Drop, TextInput, Paragraph } from 'grommet';

import { Range } from 'react-range';

const Landing = () => {

  const [inputValue, setInputValue] = React.useState<any[]>([0]);
  const [showThumb, setShowThumb] = React.useState<boolean>(false);
  const thumbRef = React.useRef<any>(null);

  return (
    <Box gap='small' pad={{ vertical:'small', horizontal:'large' }}>
      <Box justify='between'>
        <Box direction='row' justify='between'>
          <Box width='75%'>
            <Heading level='3'>Borrow yDai</Heading>
            <Box pad={{ vertical:'small' }}>
              <Text size='small'>
                Interest is calculated on a yearly basis 
                and paid out when the term matures: 
                In this case 3 months, earning you 3.75% fixed-rate interest through yDai
              </Text>
            </Box>
          </Box>

          <Box
            round='xlarge'
            width='xsmall'
            height='xsmall'
            background='yellow'
            justify='center'
            align='center'
            margin='small'
          >
            <Box>
              <Text>JUNE</Text>
              <Text>2020</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box direction='row-responsive' background="lightgrey"> 
        info bar
      </Box>

      <Box flex='grow' direction='column'>
        <Box direction='row-responsive' gap='small' justify='between'>
          <Box background="grey" fill>
            task 1
          </Box>
          '>>'
          <Box background="grey" fill>
            task 2
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Landing;
