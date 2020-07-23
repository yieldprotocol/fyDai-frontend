import React from 'react';

import moment from 'moment';

import { Box, Button, Heading, TextInput, Text } from 'grommet';
import DepositAction from './DepositAction';
import WithdrawAction from './EthWithdrawAction';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';

import { useController, useBalances } from '../hooks';
import RedeemAction from './RedeemAction';

const Redeem = ({ activeSeries }:any) => {

  const [over, setOver] = React.useState<boolean>(false);
  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('TIMER');
  const [ ethBalance, setEthBalance ] = React.useState<number>(0);
  const [ ethPosted, setEthPosted ] = React.useState<number>(0);
  const { state, dispatch } = React.useContext(YieldContext);

  const { deployedContracts, yieldData, userData } = state; 

  const {
    approveController,
    borrow,
    repay,
    repayActive,
    borrowActive,
  }  = useController();

  React.useEffect(()=>{
    // (async () => setWethBalance( await getWethBalance(deployedContracts.Weth)) )();
    (async () => setEthPosted(userData.ethPosted_) )();
  }, []);

  // const depositSteps = async (value:number) => {
  //   await approveController(deployedContracts.Weth, deployedContracts.Controller, value);
  //   await post(deployedContracts.Controller, 'ETH-A', value);
  // };

  // const withdrawSteps = async (value:number) => {
  //   await withdraw(deployedContracts.Controller, 'ETH-A', value);
  // };

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
          background={taskView==='REDEEM'? 'secondary-transparent': 'none'}
          round
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='secondary-transparent'
          onClick={()=>{setTaskView('REDEEM');}}
        >
          <Text 
            size='xsmall'
            color={taskView==='REDEEM'? 'secondary': 'text'}
            weight={taskView==='REDEEM'? 'bold': 'normal'}
            wordBreak='keep-all'
            truncate
          >
            Redeem
          </Text>
        </Box>
        {/* <Box
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
        </Box> */}
      </Box>
      { taskView==='REDEEM' && 
      <RedeemAction />}
      { taskView==='TIMER' && 
      <Box>

        Series matures { moment(activeSeries.maturity_).fromNow() }

      </Box> }
    </Box>
  );
};

export default Redeem;