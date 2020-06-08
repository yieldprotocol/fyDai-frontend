import React from 'react';
import { Box, Button, TextInput, Text, Heading } from 'grommet';
import SlideConfirm from './SlideConfirm';

function BuyAction({ close }:any) {

  const [inputValue, setInputValue] = React.useState<any>();

  return (

    <Box>
      <Heading level='5'>Buy from <Text color='#FF007F'><span role='img'> 🦄</span> Uniswap</Text></Heading>
      <Box direction='column' gap='medium'>
        {/* <Box direction='row' gap='small'>
          Sell on <Text color='#FF007F'><span role='img'> 🦄</span> Uniswap :</Text>
        </Box> */}
        
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
            placeholder="Amount to Buy"
            value={inputValue}
            onChange={(event:any) => setInputValue(event.target.value)}
            icon={<Text>yDai</Text>}
            reverse
          />
        </Box>

        <Box direction='row' justify='evenly' fill='horizontal' align='baseline'>
          <Box hoverIndicator='background' onClick={()=>console.log('hello')} round pad={{ horizontal:'large', vertical:'xsmall' }}> 
            <Text color='lightgrey'>Cancel</Text>
          </Box>
          <Button
            label='Confirm'
            disabled={false}
            onClick={()=>console.log('jello')}
          />
          {/* <SlideConfirm 
            label='Slide to payback'
            disabled={false}
            brandColor='green'
            onConfirm={()=>close()}
          /> */}
        </Box>
        {/* { actionsVisible.length === 1 && <Close onClick={()=>handleMenuClick([])} /> } */}
      </Box>
    </Box>

  );
}

export default BuyAction;
