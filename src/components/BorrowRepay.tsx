import React from 'react';
import { Box, Button, Heading, TextInput, Text } from 'grommet';
import BorrowAction from './BorrowAction';
import RepayAction from './RepayAction';

import { YieldContext } from '../contexts/YieldContext';

import { useDealer, useBalances } from '../hooks';

const BorrowRepay = ({ active, activeSeries }:any) => {
  const [over, setOver] = React.useState<boolean>(false);
  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('BORROW');
  const { state, actions } = React.useContext(YieldContext);
  const { deployedCore, yieldData } = state;
  const {
    approveDealer,
    borrow,
    repay,
    repayActive,
    borrowActive,
  }  = useDealer();

  const borrowSteps = async (value:number) => {
    await borrow(deployedCore.Dealer, 'WETH', activeSeries.maturity, value );
    actions.updateUserData(state.deployedCore, state.deployedExternal);
    actions.updateSeriesData(state.deployedSeries);
  };

  const repaySteps = async (value:number, collateral:string) => {
    console.log(activeSeries);
    await repay(deployedCore.Dealer, 'WETH', activeSeries.maturity, value, collateral );
    actions.updateUserData(state.deployedCore, state.deployedExternal);
    // actions.updateYieldBalances(state.deployedCore);
    actions.updateSeriesData(state.deployedSeries);
  };

  return (
    <Box 
      round='medium'
      border='all'
      fill
      pad='small'
      width={{ min:'280px' }}
      height={{ min:'280px' }}
      onMouseOver={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onFocus={() => setOver(true)}
      // onBlur={() => setOver(false)}
      elevation={over?'large':undefined}
    >
      <Box direction='row-responsive' justify='start' gap='medium'>
        <Box 
          background={taskView==='BORROW'? 'brand-transparent': 'none'}
          round
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='brand-transparent'
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
          background={taskView==='REPAY'? 'brand-transparent': 'none'}
          round 
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='brand-transparent'
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
      <Box flex='grow'>
        { taskView==='BORROW' && 
        <BorrowAction 
          borrowFn={(x:number)=>borrowSteps(x)}
          // maxValue={activeSeries}
        /> }
        { taskView==='REPAY' && 
        <RepayAction
          repayFn={(x:number, c:string)=>repaySteps(x, c)}
          maxValue={10}
        /> }
      </Box>
    </Box>
  );
};

export default BorrowRepay;