import React from 'react';
import { Box, Button, Image, Heading, Text, Collapsible, Markdown, Layer, Drop, TextInput, Paragraph } from 'grommet';

import logoLight from '../assets/images/logo_light.svg';

const Landing = () => {

  return (
    <Box gap='small' pad={{ vertical:'small', horizontal:'large' }}>
      <Box justify='between'>
        <Box direction='row' justify='between'>
          <Box width='75%'>
            <Heading level='3'>Yield yDai Landing Page</Heading>
            <Box pad={{ vertical:'small' }}>
              <Text
                size='small'
              >
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis est elit. Nunc vitae fringilla quam. Phasellus porta, purus in porta tincidunt, urna arcu imperdiet arcu, eget pulvinar velit nibh vel magna. Pellentesque egestas risus purus, vitae auctor arcu sagittis id. Nulla felis elit, condimentum in blandit nec, maximus eget mauris. Vivamus et condimentum velit, et euismod urna. In nec hendrerit nibh. Nunc eros elit, scelerisque bibendum dui ac, scelerisque posuere elit. Sed interdum massa non massa volutpat finibus. Vestibulum a felis in elit malesuada ullamcorper. Maecenas fermentum pulvinar odio.
              </Text>
            </Box>
          </Box>

          <Box
            round='xlarge'
            width='xsmall'
            height='xsmall'
            background='black'
            justify='center'
            align='center'
            margin='small'
          >
            <Box pad='xsmall'>
              <Image src={logoLight} />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box flex='grow' direction='column'>
        <Box direction='row-responsive' gap='medium' justify='start'>
          
          <Box
            onClick={()=>{}}
            hoverIndicator='brandTransparent'
            round
            pad={{ horizontal:'small' }}
          >
            <Text color='brand'>
              I am a Borrower
            </Text>

          </Box>

          <Box
            onClick={()=>{}}
            hoverIndicator='secondaryTransparent'
            round
            pad={{ horizontal:'small' }}
          >
            <Text color='secondary'>
              I am a Lender
            </Text>
          </Box>

        </Box>

      </Box>
    </Box>
  );
};

export default Landing;
