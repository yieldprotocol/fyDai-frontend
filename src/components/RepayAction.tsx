import React from 'react';
import { Box, Button, TextInput, Text, Heading, Collapsible } from 'grommet';
import SlideConfirm from './SlideConfirm';


import { IYieldSeries } from '../types';

interface RepayActionProps {
  activeSeries?:IYieldSeries,
  fixedOpen?:boolean,
  close?:any,
}

function PaybackAction({ close }:RepayActionProps) {

  const [inputValue, setInputValue] = React.useState<any>();
  const [repayOpen, setRepayOpen] = React.useState<boolean>(false);
  const [repayMethod, setRepayMethod] = React.useState<string>('yDAI');

  return (

    <Box 
      elevation={repayOpen?'xsmall':'none'}
      fill='horizontal'
      background='background'
      pad='medium'
    >
      <Box 
        direction='row'
        justify='between'
        onClick={()=>setRepayOpen(!repayOpen)}
      > 
        <Box direction='row' align='baseline' gap='small'>
          <Text weight='bold'>Repay yDai</Text>
          {/* <Text size='10px'> at an interest rate of <Text weight='bold' size='10px'>{' 3.86%'}</Text> </Text> */}
        </Box>
      </Box>

      <Collapsible open={repayOpen}>

        <Box direction='column' gap='medium' pad='medium' align='center'>
          <Box direction='row'>
            <Button 
              primary={repayMethod === 'yDAI'}
              label='Repay with yDai'
              style={{ borderRadius:'24px 0px 0px 24px' }}
              hoverIndicator='brand'
              color='brand'
              onClick={()=>setRepayMethod('yDAI')}
            />
            <Button 
              primary={repayMethod === 'DAI'}
              label='Repay with Dai'
              hoverIndicator='brand'
              color='brand'
              style={{ borderRadius:'0px 24px 24px 0px' }}
              onClick={()=>setRepayMethod('DAI')}
            />
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
              placeholder="Amount"
              value={inputValue}
              onChange={(event:any) => setInputValue(event.target.value)}
              icon={<Text>{repayMethod}</Text>}
              reverse
            />
          </Box>
          <Box direction='row' justify='evenly' fill='horizontal' align='baseline'>
            <Box hoverIndicator='background' onClick={()=>setRepayOpen(false)} round pad={{ horizontal:'large', vertical:'xsmall' }}> 
              <Text color='border'>Cancel</Text>
            </Box>
            <Button
              label='Confirm'
              disabled={false}
              onClick={()=>setRepayOpen(false)}
            />
            {/* <SlideConfirm 
            label='Slide to payback'
            disabled={false}
            brandColor='green'
            onConfirm={()=>close()}
          /> */}
          </Box>
        </Box>
      </Collapsible>
    </Box>
  );
}

export default PaybackAction;
