import React from 'react';
import { Box, Button, TextInput, Text, Heading, Collapsible } from 'grommet';
import { FiCheckCircle } from 'react-icons/fi';
import SlideConfirm from './SlideConfirm';


import { IYieldSeries } from '../types';

import BuyAction from './BuyAction';
import SellAction from './SellAction';

interface BuySellActionProps {
  activeSeries?:IYieldSeries,
  fixedOpen?:boolean,
  close?:any,
}

function BuySellAction({ close }:BuySellActionProps) {

  const [inputValue, setInputValue] = React.useState<any>();
  const [buySellOpen, setBuySellOpen] = React.useState<boolean>(false);
  const [buySellMethod, setBuySellMethod] = React.useState<string>('BUY');

  return (

    <Box 
      elevation={buySellOpen?'xsmall':'none'}
      fill='horizontal'
      background='background'
      pad='medium'
    >
      <Box 
        direction='row'
        justify='between'
        onClick={()=>setBuySellOpen(!buySellOpen)}
      > 
        <Box direction='row' align='baseline' gap='small'>
          <Text weight='bold'>Add or Remove yDai</Text>
        </Box>
        <Box gap='small' direction='row'>
          <Box align='center'>
            <FiCheckCircle color='green' />
            <Text size='10px'> Collateral Posted </Text>
          </Box>
        </Box>
      </Box>
      
      <Collapsible open={buySellOpen}>
        <Box direction='column' gap='medium' pad='medium' align='start'>
          <Box direction='row'>
            <Button
              primary={buySellMethod === 'BUY'}
              label='Buy yDai'
              style={{ borderRadius:'24px 0px 0px 24px' }}
              hoverIndicator='brand'
              color='brand'
              onClick={()=>setBuySellMethod('BUY')}
            />
            <Button 
              primary={buySellMethod === 'SELL'}
              label='Offload yDai'
              hoverIndicator='brand'
              color='brand'
              style={{ borderRadius:'0px 24px 24px 0px' }}
              onClick={()=>setBuySellMethod('SELL')}
            />
          </Box>
          {buySellMethod==='BUY' && <BuyAction />}
          {buySellMethod==='SELL' &&  <SellAction />}
        </Box>
      </Collapsible>
    </Box>
  );
}

export default BuySellAction;