import React from 'react';
import { Box, Button, Heading, TextInput, Text } from 'grommet';
import BorrowAction from './BorrowAction';
import RepayAction from './RepayAction';

const BorrowRepay = ({ close }:any) => {

  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('BORROW');

  return (
    <Box round='medium' border='all' fill pad='small' width={{ min:'280px' }} height={{ min:'280px' }}>
      <Box direction='row-responsive' justify='start' gap='medium'>
        <Box 
          background={taskView==='BORROW'? 'brandTransparent': 'none'}
          round
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='brandTransparent'
          onClick={()=>{setTaskView('BORROW');}}
        >
          <Text 
            size='xsmall'
            color={taskView==='BORROW'? 'brand': 'text'}
            weight={taskView==='BORROW'? 'bold': 'normal'}
            wordBreak='keep-all'
            truncate
          >
            Borrow
          </Text>
        </Box>
        <Box 
          background={taskView==='REPAY'? 'brandTransparent': 'none'}
          round 
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='brandTransparent'
          onClick={()=>{setTaskView('REPAY');}}
        >
          <Text 
            size='xsmall' 
            color={taskView==='REPAY'? 'brand': 'text'}
            weight={taskView==='REPAY'? 'bold': 'normal'}
            wordBreak='keep-all'
            truncate
          >
            Repay
          </Text>
        </Box>
      </Box>

      { taskView==='BORROW' && <BorrowAction /> }
      { taskView==='REPAY' && <RepayAction /> }
    </Box>
  );
};

export default BorrowRepay;