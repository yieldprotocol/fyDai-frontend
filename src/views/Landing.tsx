import React from 'react';
import { Box, Grid, Heading, Text, Collapsible, Markdown, Layer, Drop, TextInput } from 'grommet';

import { Range } from 'react-range';

const Landing = () => {

  const [inputValue, setInputValue] = React.useState<any[]>([0]);
  const [showThumb, setShowThumb] = React.useState<boolean>(false);
  const thumbRef = React.useRef<any>(null);

  return (
    <Box 
      margin='large'
      gap='large'
      align='center'
      // background='background'
    >
      <Heading>
        I am a borrower.
      </Heading>
      Some more copy here about borrowing. with same design language as the website.


      <Heading>
        I am a lender.
      </Heading>
      Some more copy here about ledning. with same design language as the website.
    </Box>
  );
};

export default Landing;
