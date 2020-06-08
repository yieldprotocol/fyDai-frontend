import React from 'react';
import { Box, Grid, Heading, Text, Collapsible, Markdown, Layer } from 'grommet';


const Landing = () => {
  return (
    <Box margin='large' gap='large' align='center'>
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
