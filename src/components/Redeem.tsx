import React from 'react';

import moment from 'moment';

import { Box, Button, Heading, TextInput, Text } from 'grommet';
import DepositAction from './DepositAction';
import WithdrawAction from './WithdrawAction';

import { YieldContext } from '../contexts/YieldContext';
import { PositionsContext } from '../contexts/PositionsContext';

import { useDealer, useGetBalance } from '../hooks/yieldHooks';
import RedeemAction from './RedeemAction';

const Redeem = ({ activeSeries }:any) => {

  const [over, setOver] = React.useState<boolean>(false);
  const [inputValue, setInputValue] = React.useState<any>();
  const [taskView, setTaskView] = React.useState<string>('TIMER');
  const [ wethBalance, setWethBalance ] = React.useState<number>(0);
  const [ wethPosted, setWethPosted ] = React.useState<number>(0);
  const { state, dispatch } = React.useContext(YieldContext);

  const { deployedCore, yieldData } = state; 

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
    (async () => setWethBalance( await getWethBalance(deployedCore.Weth)) )();
    (async () => setWethPosted(yieldData.wethPosted_p) )();
  }, []);

  const depositSteps = async (value:number) => {
    await approveDealer(deployedCore.Weth, deployedCore.WethDealer, value);
    await post(deployedCore.WethDealer, value);
  };

  const withdrawSteps = async (value:number) => {
    await withdraw(deployedCore.WethDealer, value);
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
          background={taskView==='REDEEM'? 'secondaryTransparent': 'none'}
          round
          pad={{ horizontal:'small', vertical:'xsmall' }}
          hoverIndicator='secondaryTransparent'
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
        </Box> */}
      </Box>
      { taskView==='REDEEM' && 
      <RedeemAction />}
      { taskView==='TIMER' && 
      <Box>

        Series matures { moment(activeSeries.maturity_p).fromNow() }

      </Box> }
    </Box>
  );
};

export default Redeem;