import React from 'react';
import { Box, Button, Heading, TextInput, Text } from 'grommet';

import SellAction from './SellAction';
import BuyAction from './BuyAction';

const BuySell = ({ activeSeries }:any) => {

  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('BUY');

  return (
    <Box 
      round='medium'
      border='all'
      fill
      pad='small'
      width={{ min:'280px', max:'50%' }}
      height={{ min:'280px' }}
    >
      <Box direction='row-responsive' justify='start' gap='medium'>
        <Box 
          background={taskView==='BUY'? 'brandTransparent': 'none'}
          round
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='brandTransparent'
          onClick={()=>{setTaskView('BUY');}}
        >
          <Text 
            size='xsmall'
            color={taskView==='BUY'? 'brand': 'text'}
            weight={taskView==='BUY'? 'bold': 'normal'}
            wordBreak='keep-all'
            truncate
          >
            Deposit Dai
          </Text>
        </Box>
        <Box 
          background={taskView==='SELL'? 'brandTransparent': 'none'}
          round 
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='brandTransparent'
          onClick={()=>{setTaskView('SELL');}}
        >
          <Text 
            size='xsmall' 
            color={taskView==='SELL'? 'brand': 'text'}
            weight={taskView==='SELL'? 'bold': 'normal'}
            wordBreak='keep-all'
            truncate
          >
            Withdraw Dai
          </Text>
        </Box>
      </Box>
      <Box flex='grow'>
        { taskView==='BUY' && <BuyAction /> }
        { taskView==='SELL' && <SellAction /> }
      </Box>
    </Box>
  );
};

export default BuySell;