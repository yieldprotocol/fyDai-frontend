import React from 'react';
import { Box, Button, TextInput, Text, Heading } from 'grommet';
import SlideConfirm from './SlideConfirm';

function PaybackAction({ close }:any) {

  const [inputValue, setInputValue] = React.useState<any>();

  return (

    <Box>
      <Heading level='5'>Payback yDai debt</Heading>

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
            placeholder="Amount to payback"
            value={inputValue}
            onChange={(event:any) => setInputValue(event.target.value)}
            icon={<Text>yDai</Text>}
            reverse
          />
        </Box>
        <Box direction='row' justify='evenly' fill='horizontal' align='baseline'>
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
}

export default PaybackAction;
