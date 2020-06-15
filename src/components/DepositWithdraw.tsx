import React from 'react';
import { Box, Button, Heading, TextInput, Text } from 'grommet';
import DepositAction from './DepositAction';
import WithdrawAction from './WithdrawAction';

const DepositWithdraw = ({ close }:any) => {

  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('DEPOSIT');

  return (
    <Box 
      round='medium'
      border='all'
      fill
      pad='small'
      width={{ min:'280px' }}
      height={{ min:'280px' }}
      elevation='large'
    >
      <Box direction='row-responsive' justify='start' gap='medium'>
        <Box 
          background={taskView==='DEPOSIT'? 'secondaryTransparent': 'none'}
          round
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='secondaryTransparent'
          onClick={()=>{setTaskView('DEPOSIT');}}
        >
          <Text 
            size='xsmall'
            color={taskView==='DEPOSIT'? 'secondary': 'text'}
            weight={taskView==='DEPOSIT'? 'bold': 'normal'}
            wordBreak='keep-all'
            truncate
          >
            Deposit Eth
          </Text>
        </Box>
        <Box 
          background={taskView==='WITHDRAW'? 'secondaryTransparent': 'none'}
          round 
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='secondaryTransparent'
          onClick={()=>{setTaskView('WITHDRAW');}}
        >
          <Text 
            size='xsmall' 
            color={taskView==='WITHDRAW'? 'secondary': 'text'}
            weight={taskView==='WITHDRAW'? 'bold': 'normal'}
            wordBreak='keep-all'
            truncate
          >
            Withdraw Eth
          </Text>
        </Box>
      </Box>
      { taskView==='DEPOSIT' && <DepositAction /> }
      { taskView==='WITHDRAW' && <WithdrawAction /> }
    </Box>
  );
};

export default DepositWithdraw;