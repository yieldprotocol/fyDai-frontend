import React from 'react';
import { Box, Button, Heading, TextInput, Text } from 'grommet';
import DepositAction from './DepositAction';
import WithdrawAction from './WithdrawAction';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';

import { useDealer, useEthProxy, useBalances } from '../hooks';

const DepositWithdraw = ({ close }:any) => {

  const [over, setOver] = React.useState<boolean>(false);
  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('DEPOSIT');
  // const [ wethBalance, setWethBalance ] = React.useState<number>(0);
  const [ ethPosted, setEthPosted ] = React.useState<number>(0);
  const { state, actions } = React.useContext(YieldContext);

  const { deployedContracts, yieldData, userData } = state; 

  const {
    approveDealer,
    borrow,
    repay,
    repayActive,
    borrowActive,
  }  = useDealer();

  const {
    postEth, 
    withdrawEth,
    postEthActive,
    withdrawEthActive,
  }  = useEthProxy();

  React.useEffect(()=>{
    // (async () => setWethBalance( await getWethBalance(deployedContracts.Weth)) )();
    (async () => setEthPosted(yieldData.ethPosted_) )();
  }, []);

  const depositSteps = async (value:number) => {
    // await approveDealer(deployedContracts.Weth, deployedContracts.Dealer, value);
    await postEth(deployedContracts.EthProxy, value);
    actions.updateUserData(state.deployedContracts, state.deployedContracts);
    actions.updateYieldBalances(state.deployedContracts);
  };

  const withdrawSteps = async (value:number) => {
    await withdrawEth(deployedContracts.EthProxy, value);
    actions.updateUserData(state.deployedContracts, state.deployedContracts);
    actions.updateYieldBalances(state.deployedContracts);
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
          background={taskView==='DEPOSIT'? 'secondary-transparent': 'none'}
          round
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='secondary-transparent'
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
          background={taskView==='WITHDRAW'? 'secondary-transparent': 'none'}
          round 
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='secondary-transparent'
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
          maxValue={userData.ethBalance_}
        />}
      { taskView==='WITHDRAW' && 
      <WithdrawAction 
        withdraw={(x:number) => withdrawSteps(x)}
        maxValue={userData.ethPosted_}
      /> }
    </Box>
  );
};

export default DepositWithdraw;