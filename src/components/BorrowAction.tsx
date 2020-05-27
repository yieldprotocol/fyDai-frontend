import React from 'react';
import { Box, Button, Heading, TextInput, Text, CheckBox } from 'grommet';
import SlideConfirm from './SlideConfirm';

const BorrowAction = ({ close }:any) => {

  const [inputValue, setInputValue] = React.useState<any>();

  return (
    <Box>
      <Box direction='row' align='baseline' gap='small'>
        <Heading level='5'>Borrow yDai</Heading>
        <Text size='10px'> at an interest rate of <Text weight='bold' size='10px'>{` 3.86%`}</Text> </Text>
      </Box>

      <Box direction='column' gap='medium'>
        <Box gap='none' direction='row' align='baseline'>
          <Box
            style={{ borderRadius:'24px 0px 0px 24px' }}
            border='all'
            pad={{ horizontal:'large', vertical:'xsmall' }}
            hoverIndicator='background'
            onClick={()=>console.log('somehting')}
          > 
            <Text size='14px'>Max</Text>
          </Box>
          <TextInput
            style={{ borderRadius:'0px 24px 24px 0px' }}
            type="number"
            placeholder="Amount to borrow"
            value={inputValue}
            onChange={(event:any) => setInputValue(event.target.value)}
            icon={<Text>yDai</Text>}
            reverse
          />
        </Box>
        <Box direction='row' justify='between'>
          <Box />
          <Box>
            <CheckBox label={<Box direction='row' gap='xsmall'> Sell immediately for DAI on <Text color='#FF007F'><span role='img'> 🦄</span> Uniswap</Text></Box>} reverse />
          </Box>
        </Box>

        <Box pad='medium' direction='row' justify='evenly' fill='horizontal' align='baseline'>
          <Box hoverIndicator='background' onClick={()=>close()} round pad={{ horizontal:'large', vertical:'xsmall' }}> 
            <Text color='lightgrey'>Cancel</Text>
          </Box>
          <Button
            label='Confirm'
            disabled={false}
            onClick={()=>close()}
          />
          {/* <SlideConfirm 
            label='Slide to payback'
            disabled={false}
            brandColor='green'
            onConfirm={()=>close()}
          /> */}
        </Box>
      </Box>
    </Box>
  );
};

export default BorrowAction;
