import React, { useState, useContext, useEffect } from 'react';
import { Box, Layer, Button, Image, TextInput, Text, CheckBox } from 'grommet';
import { 
  FiInfo as Info,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';

import { useEthProxy, useController } from '../hooks';

import { NotifyContext } from '../contexts/NotifyContext';

interface IWithDrawActionProps {
  close?: any;
  withdraw?: any;
  maxValue?: number;
}

const EthWithdrawAction = ({ close }:IWithDrawActionProps) => {

  const [ estRatio, setEstRatio ] = useState<any>();
  const [ estDecrease, setEstDecrease ] = useState<any>();

  const [ maxWithdraw, setMaxWithdraw ] = useState<number>(0);
  const [ inputValue, setInputValue ] = useState<any>();
  const [ hasApproved, setHasApproved ] = useState<boolean>(false);

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(false);
  const [ indicatorColor, setIndicatorColor ] = useState<string>('brand');
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const { deployedContracts } = yieldState;

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { userData: { ethBalance_ } } = yieldState;
  const { seriesAggregates } = seriesState;
  const {
    collateralAmount_,
    minSafeCollateral_,
    // collateralRatio_,
    collateralPercent_,
    debtValue_,
    estimateRatio, // TODO << this is a function (basically just passed from hooks via context) >> 
  } = seriesAggregates;

  const { withdrawEth, withdrawEthActive }  = useEthProxy();
  const { approveEthWithdraws, checkWithdrawApproval }  = useController();

  const withdrawProcedure = async (value:number) => {
    await withdrawEth(deployedContracts.EthProxy, value);
    yieldActions.updateUserData();
    close();
  };

  const approveProcedure = async (value:number) => {
    await approveEthWithdraws(deployedContracts.Controller, deployedContracts.EthProxy);
    setHasApproved(await checkWithdrawApproval(deployedContracts.Controller, deployedContracts.EthProxy));
  };

  // TODO: maybe split into a custom hook
  const { state: { pendingTxs } } = React.useContext(NotifyContext);
  const [txActive, setTxActive] = React.useState<any>(null);
  useEffect(()=>{
    setTxActive(pendingTxs.find((x:any)=> x.type === 'WITHDRAW'));
  }, [ pendingTxs ]);

  useEffect(()=>{
    setMaxWithdraw(collateralAmount_- minSafeCollateral_);
  }, [collateralAmount_, minSafeCollateral_]);

  useEffect(()=>{
    if (estRatio < 150) {
      setWithdrawDisabled(true);
      setIndicatorColor('red');
      setWarningMsg(null);
      setErrorMsg('You are not allowed to withdraw below the collateralization ratio'); 
    } else if (estRatio >= 150 && estRatio < 250 ) {
      setIndicatorColor('orange');
      setErrorMsg(null);
      setWarningMsg('Your collateralisation ration will put you at risk of liquidation');
    } else {
      setWithdrawDisabled(false);
      setIndicatorColor('brand');
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ estRatio ]);

  useEffect(()=>{
    if (collateralAmount_ < inputValue ){
      setWithdrawDisabled(true);
    } else { setWithdrawDisabled(false); }

    if ( (collateralAmount_ > inputValue) && inputValue  && debtValue_) {
      const newRatio = estimateRatio((collateralAmount_- parseFloat(inputValue)), debtValue_); 
      setEstRatio(newRatio.toFixed(2));
      const newDecrease = collateralPercent_ - newRatio ;
      setEstDecrease(newDecrease.toFixed(2));
    }
  }, [ inputValue ]);

  useEffect(()=>{
    (async () => {setHasApproved(await checkWithdrawApproval(deployedContracts.Controller, deployedContracts.EthProxy));})();
  }, []);

  return (
    <Layer onClickOutside={()=>close()}>
      <Box 
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='medium'
        pad='large'
      >
        { !txActive && !withdrawEthActive && 
        <Box align='center' flex='grow' justify='between' gap='large'>
          <Box gap='medium' align='center' fill='horizontal'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to withdraw</Text>
            <Box
              direction='row-responsive'
              fill='horizontal'
              gap='small'
              align='center'
            >
              <Box 
                round='medium'
                background='brand-transparent'
                direction='row'
                fill='horizontal'
                pad='small'
                flex
              >
                <TextInput
                  type="number"
                  placeholder='ETH'
                  disabled={withdrawEthActive}
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
                  icon={<Ethereum />}
                />
              </Box>

              <Box justify='center'>
                <Box
                  round
                  onClick={()=>setInputValue(maxWithdraw)}
                  hoverIndicator='brand-transparent'
                  border='all'
                  pad={{ horizontal:'small', vertical:'small' }}
                  justify='center'
                >
                  <Text size='xsmall'>Use max</Text>
                </Box>
              </Box>

            </Box>
          </Box>

          <Box fill direction='row-responsive' justify='between'>

            <Box gap='small'>
              <Text color='text-weak' size='xsmall'>Max withdraw</Text>
              <Text color='brand' weight='bold' size='large'> {collateralAmount_? `~${maxWithdraw.toFixed(2)} Eth` : '-' }</Text>
            </Box>

            { (collateralPercent_ > 0) &&
            <Box gap='small' alignSelf='start'>
              <Text color='text-weak' size='xsmall'>Collateralization Ratio after withdraw</Text>
              <Box direction='row' gap='small'>
                <Text color={!inputValue? 'brand-transparent': indicatorColor} weight='bold' size='large'> 
                  {(estRatio && estRatio !== 0)? ` approx. ${estRatio}%`: collateralPercent_ || '' }
                </Text>
                { false &&
                <Text color='red' size='large'> 
                  { inputValue && (estDecrease !== 0) && `(- ${estDecrease}%)` }
                </Text>}
              </Box>
            </Box>}

          </Box>

          { warningMsg && !errorMsg &&
          <Box 
            border={{ color:'orange' }} 
            fill
            round='small'
            pad='small'
          >
            <Text weight='bold' color='orange'>Procced with Caution:</Text>  
            <Text color='orange'>{warningMsg}</Text>
          </Box> }

          { errorMsg &&
          <Box
            border={{ color:'red' }}
            fill
            round='small'
            pad='small'
          >
            <Text weight='bold' color='red'>Hang on...</Text>  
            <Text color='red'>{errorMsg}</Text>
          </Box> }

          <Box
            fill='horizontal'
            round='medium'
            background={( !(inputValue>0) || withdrawDisabled) ? 'brand-transparent' : 'brand'}
            onClick={(!(inputValue>0) || withdrawDisabled)? ()=>{}:()=> withdrawProcedure(inputValue)}
            align='center'
            pad='medium'
          >
            <Text
              weight='bold'
              size='large'
              color={( !(inputValue>0) || withdrawDisabled) ? 'text-xweak' : 'text'}
            >
              {`Withdraw ${inputValue || ''} Eth`}
            </Text>
          </Box>
          
          {!hasApproved && 
          <Box
            round
            onClick={()=>approveProcedure(inputValue)}
            hoverIndicator='brand-transparent'
            // border='all'
            pad={{ horizontal:'small', vertical:'small' }}
            align='center'
          >
            <Text
              weight='bold'
              size='xxsmall'
              color='text'
            >
              Approve Eth withdrawals (once-off)
            </Text>
          </Box>}

          <Box alignSelf='start'>
            <Box
              round
              onClick={()=>close()}
              hoverIndicator='brand-transparent'
          // border='all'
              pad={{ horizontal:'small', vertical:'small' }}
              justify='center'
            >
              <Box direction='row' gap='small' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='xsmall' color='text-weak'> { !withdrawEthActive? 'cancel, and go back.': 'go back'}  </Text>
              </Box>
            </Box>
          </Box>
        </Box>}
        { withdrawEthActive && !txActive &&
        <Box>Awaiting transaction approval</Box>}

        { txActive &&
        <Box align='center' flex='grow' justify='between' gap='large'>
          <Box gap='medium' align='center' fill='horizontal'>
            <Text size='xlarge' color='brand' weight='bold'>Good One!</Text>
            <Box
            // direction='row-responsive'
              fill='horizontal'
              gap='large'
              align='center'
            >
              <Text>You made a withdrawal of {inputValue} Eth</Text>
              <Text>Transaction Pending: </Text>
              <Box
                fill='horizontal'
                round='medium'
                background='brand'
                onClick={()=>console.log('Going to etherscan')}
                align='center'
                pad='medium'
              >
                <Text
                  weight='bold'
                  size='large'
                >
                  View on Etherscan
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>}

      </Box>
    </Layer>
  );
};

export default EthWithdrawAction;
