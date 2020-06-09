import React from 'react';
import { Box, Button, Heading, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';
import { FiCheckCircle } from 'react-icons/fi';

import { IYieldSeries } from '../types';

interface BorrowActionProps {
  activeSeries?:IYieldSeries,
  fixedOpen?:boolean,
  close?:any,
}

const BorrowAction = (props:BorrowActionProps) => {

  const [inputValue, setInputValue] = React.useState<any>();
  const [borrowOpen, setBorrowOpen] = React.useState<boolean>(false);
  const slideRef = React.useRef<any>();

  return (

    <Box 
      elevation={borrowOpen?'xsmall':'none'} 
      fill='horizontal'
      background='background'
      pad='medium'
    >
      <Box 
        direction='row'
        justify='between'
        onClick={()=>setBorrowOpen(!borrowOpen)}
      >
        <Box direction='row' align='baseline' gap='small'>
          <Text weight='bold'>Borrow yDai</Text>
          <Text size='10px'> at an interest rate of <Text weight='bold' size='10px'>{' 3.86%'}</Text> </Text>
        </Box>
        <Box gap='small' direction='row'>
          <Box align='center'>

            <FiCheckCircle color='green' />
            <Text size='10px'> Collateral Posted </Text>

          </Box>
        </Box>
      </Box>

      <Collapsible open={borrowOpen}>
        <Box direction='column' gap='medium' pad='medium' align='center'>
          
          <Box 
            direction='row'
            gap='small'
            // background='background-front'
            fill
            round
            pad='small'
            border={{ color:'background' }}
          >
            <Box round='xsmall' border='all' pad={{ horizontal:'small' }}> Max
              {/* <Button round='xsmall' label='MAX' /> */}
            </Box>
            <Box round='xsmall' border='all' pad={{ horizontal:'small' }}> Max
              {/* <Button round='xsmall' label='MAX' /> */}
            </Box>
            <RangeInput
              ref={slideRef}
              value={inputValue}
              max='100'
              // @ts-ignore
              step='0.10'
              onChange={(e:any) => setInputValue(e.target.value)}
            />
            <Box round='xsmall' border='all' pad={{ horizontal:'small' }}> Max
              {/* <Button round='xsmall' label='MAX' /> */}
            </Box>
          </Box>


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
            <Box hoverIndicator='background' onClick={()=>setBorrowOpen(!borrowOpen)} round pad={{ horizontal:'large', vertical:'xsmall' }}> 
              <Text color='border'>Cancel</Text>
            </Box>
            <Button
              label='Confirm'
              disabled={false}
              onClick={()=>setBorrowOpen(!borrowOpen)}
            />
          </Box>
        </Box>

      </Collapsible>
    </Box>

  );
};

export default BorrowAction;
