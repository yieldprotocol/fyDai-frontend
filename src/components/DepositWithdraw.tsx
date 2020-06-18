import React from 'react';
import { Box, Button, Heading, TextInput, Text } from 'grommet';
import DepositAction from './DepositAction';
import WithdrawAction from './WithdrawAction';

import { YieldContext } from '../contexts/YieldContext';
import { PositionsContext } from '../contexts/PositionsContext';

import { useDealer, useGetBalance } from '../hooks/yieldHooks';

const DepositWithdraw = ({ close }:any) => {

  const [over, setOver] = React.useState<boolean>(false);
  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('DEPOSIT');
  const [ wethBalance, setWethBalance ] = React.useState<number>(0);
  const [ wethPosted, setWethPosted ] = React.useState<number>(0);
  const { state, actions } = React.useContext(YieldContext);

  const { deployedCore, deployedExternal, yieldData } = state; 

  const { getWethBalance }  = useGetBalance();
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


  React.useEffect(()=>{
    (async () => setWethBalance( await getWethBalance(deployedExternal.Weth)) )();
    (async () => setWethPosted(yieldData.wethPosted_p) )();
  }, []);

  const depositSteps = async (value:number) => {
    await approveDealer(deployedExternal.Weth, deployedCore.Dealer, value);
    await post(deployedCore.Dealer, 'WETH', value);
    actions.updateExtBalances(state.deployedExternal);
    actions.updateYieldBalances(state.deployedCore);
  };

  const withdrawSteps = async (value:number) => {
    await withdraw(deployedCore.Dealer, 'WETH', value);
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
      elevation={over?'large':undefined}
      onMouseOver={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onFocus={() => setOver(true)}
      // onBlur={() => setOver(false)}
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
      { taskView==='DEPOSIT' && 
        <DepositAction 
          deposit={(x:number) => depositSteps(x)}
          maxValue={wethBalance}
        />}
      { taskView==='WITHDRAW' && 
      <WithdrawAction 
        withdraw={(x:number) => withdrawSteps(x)}
        maxValue={wethPosted}
      /> }
    </Box>
  );
};

export default DepositWithdraw;