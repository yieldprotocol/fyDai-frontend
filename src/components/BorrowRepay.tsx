import React from 'react';
import { Box, Button, Heading, TextInput, Text } from 'grommet';
import BorrowAction from './BorrowAction';
import RepayAction from './RepayAction';

import { YieldContext } from '../contexts/YieldContext';
import { PositionsContext } from '../contexts/PositionsContext';

import { useDealer, useGetBalance } from '../hooks/yieldHooks';

const BorrowRepay = ({ active, activeSeries }:any) => {
  const [over, setOver] = React.useState<boolean>(false);
  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('BORROW');
  const { state, actions } = React.useContext(YieldContext);
  const { deployedCore, yieldData } = state;
  const {
    post,
    approveDealer,
    withdraw,
    borrow,
    repay,
    postActive,
    withdrawActive,
    repayActive,
    borrowActive,
  }  = useDealer();

  const borrowSteps = async (value:number) => {
    await borrow(deployedCore.Dealer, 'WETH', activeSeries.maturity, value );
    actions.updateExtBalances(state.deployedExternal);
    actions.updateYieldBalances(state.deployedCore);
  };

  const repaySteps = async (value:number, collateral:string) => {
    console.log(activeSeries);
    await repay(deployedCore.Dealer, 'WETH', activeSeries.maturity, value, collateral );
    actions.updateExtBalances(state.deployedExternal);
    actions.updateYieldBalances(state.deployedCore);
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