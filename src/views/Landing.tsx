import React from 'react';
import { Box, Button, Image, Heading, Text, Collapsible, Markdown, Layer, Drop, TextInput, Paragraph } from 'grommet';

import { Range } from 'react-range';
import DepositWithdraw from '../components/DepositWithdraw';
import BorrowRepay from '../components/BorrowRepay';

import logoLight from '../assets/images/logo_light.svg';


const Landing = () => {

  return (
    <Box gap='small' pad={{ vertical:'small', horizontal:'large' }}>
      <Box justify='between'>
        <Box direction='row' justify='between'>
          <Box width='75%'>
            <div className='pulsetext'> tester </div>
            <Heading level='3'>Yield yDai</Heading>
            <Box pad={{ vertical:'small' }}>
              <Text
                size='small'
              >
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
