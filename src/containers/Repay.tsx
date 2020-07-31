import React, { useEffect } from 'react';
import { Box, Button, Image, Select, TextInput, Text, Heading, Collapsible, CheckBox } from 'grommet';
import { 
  FiCheckCircle, 
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiSettings as SettingsGear,
} from 'react-icons/fi';

import SeriesSelector from '../components/SeriesSelector';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { NotifyContext } from '../contexts/NotifyContext';

import { useController, usePool, useBalances } from '../hooks';
import InlineAlert from '../components/InlineAlert';

interface RepayActionProps {
  repayFn:any
  maxValue:number
}

function Repay({ repayFn, maxValue }:RepayActionProps) {

  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { deployedContracts, userData } = yieldState;
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);

  const { buyDai, previewPoolTx, approveToken }  = usePool();
  const { getTokenAllowance }  = useBalances();

  const { isLoading: positionsLoading, seriesAggregates, activeSeries, setActiveSeries } = seriesState;
  const {
    collateralAmount_,
    collateralRatio_,
    debtValue_,
    estimateRatio, // TODO << this is a function (basically just passed from hooks via context) >> 
  } = seriesAggregates;

  const { repay, repayActive }  = useController();

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [repayDisabled, setRepayDisabled] = React.useState<boolean>(false);
  const [ selectorOpen, setSelectorOpen ] = React.useState<boolean>(false);
  const [ approved, setApproved ] = React.useState<any>(0);

  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  // TODO: maybe split into a custom hook
  const { state: { pendingTxs } } = React.useContext(NotifyContext);
  const [txActive, setTxActive] = React.useState<any>(null);
  useEffect(()=>{
    setTxActive(pendingTxs.find((x:any)=> x.type === 'REPAY'));
  }, [ pendingTxs ]);

  const repayProcedure = async (value:number) => {
    await repay(deployedContracts.Controller, 'ETH-A', activeSeries.maturity, value, 'Dai' );
    setApproved(await getTokenAllowance(deployedContracts.Dai, deployedContracts.Treasury, 'Dai'));
    setInputValue('');
    seriesActions.refreshPositions([activeSeries]);
    yieldActions.updateUserData();
  };

  const approveProcedure = async (value:number) => {
    await approveToken(deployedContracts.Dai, deployedContracts.Treasury, value);
    setApproved(await getTokenAllowance(deployedContracts.Dai, deployedContracts.Treasury, 'Dai'));
  };

  useEffect(() => {
    if ( inputValue  && userData?.daiBalance_ && ( inputValue > userData?.daiBalance_ ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai in your wallet'); 
    } else if ( false ) {
      setErrorMsg(null);
      setWarningMsg('If you borrow right up to your maximum allowance, there is high probability you will be liquidated soon!');
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  /* Repay button disabling logic */
  useEffect(()=>{
    if (approved < inputValue) {
      setRepayDisabled(true);
    } else if (!(inputValue) || inputValue===0) {
      setRepayDisabled(true);
    } else {
      setRepayDisabled(false);
    }
  }, [ approved, inputValue ]);

  useEffect(() => {
    console.log(seriesAggregates);
    ( async ()=>{
      activeSeries && setApproved(await getTokenAllowance(deployedContracts.Dai, deployedContracts.Treasury, 'Dai'));
    })();
  }, [ activeSeries ]);

  return (
    <>
      {selectorOpen && <SeriesSelector close={()=>setSelectorOpen(false)} /> }
      { !repayActive && !txActive &&
      <Box flex='grow' justify='between'>
        <Box gap='medium' align='center' fill='horizontal'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text>
          <Box
            direction='row-responsive'
            fill='horizontal'
            gap='small'
            align='center'
          >
            <Box
              round='xsmall'
              background='brand-transparent'
              border='all'
              onClick={()=>setSelectorOpen(true)}
              // hoverIndicator='brand'
              direction='row'
              fill
              pad='small'
              flex
            >
              <Text color='brand' size='large'>{ activeSeries? `${activeSeries.yieldAPR_}% ${activeSeries.displayName}` : 'Loading...' }</Text>
            </Box>

            <Box justify='center'>
              <Box
                round
                onClick={()=>setSelectorOpen(true)}
                hoverIndicator='brand-transparent'
                border='all'
            // border={{ color:'brand' }}
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Text size='xsmall'>Change series</Text>
              </Box>
            </Box>
          </Box>

          <Box direction='row-responsive' pad={{ horizontal:'medium' }} justify='start' gap='large' fill>
            
            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Current Debt</Text>
                <Help />
              </Box>
              <Box direction='row' gap='small'>
                {/* <Text color={maxDaiAvailable_? 'brand': 'brand-transparent'} size='xxsmall'>approx.</Text> */}
                <Text color='brand' weight='bold' size='medium'> {activeSeries?.wethDebtDai_? `${activeSeries.wethDebtDai_.toFixed(2)} Dai`: ''}  </Text>
              </Box>
            </Box>

            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Wallet Dai balance</Text>
                <Help />
              </Box>
              <Text color='brand' weight='bold' size='medium'> {userData?.daiBalance_? `${userData.daiBalance_.toFixed(2)} Dai`:'-'} </Text>
            </Box>

          </Box>


          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to Repay</Text>
            <Box
              direction='row-responsive'
              fill='horizontal'
              gap='small'
              align='center'
            >
              <Box 
                round='medium'
                // background='brand-transparent'
                border='all'
                direction='row'
                fill='horizontal'
                pad='small'
                flex
              >
                <TextInput
                  type="number"
                  placeholder='Enter the amount of Dai to Repay'
                  value={inputValue || ''}
                  // disabled={repayDisabled}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
                />
              </Box>

              <Box justify='center'>
                <Box
                  round
                  onClick={()=>setInputValue(userData.daiBalance_)}
                  hoverIndicator='brand-transparent'
                  border='all'
              // border={{ color:'brand' }}
                  pad={{ horizontal:'small', vertical:'small' }}
                  justify='center'
                >
                  <Text size='xsmall'>Repay max</Text>
                </Box>
              </Box>
            </Box>
          </Box>

          <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />
      
          <Box>
            <CheckBox 
              reverse
                // value={true}
              checked={!inputValue || ( approved >= inputValue )}
              disabled={!inputValue || ( approved >= inputValue )}
              onChange={()=>approveProcedure(inputValue)}
              label={(approved >= inputValue) ? 
                `Trading unlocked for up to ${approved.toFixed(2) || '' } Dai` 
                : `Unlock trading for ${inputValue || ''} Dai`}
            />
          </Box>

          <Box
            fill='horizontal'
            round='medium'
            background={repayDisabled ? 'brand-transparent' : 'brand'}
            onClick={repayDisabled ? ()=>{}:()=>repayProcedure(inputValue)}
            align='center'
            pad='small'
          >
            <Text 
              weight='bold'
              size='large'
              color={repayDisabled ? 'text-xweak' : 'text'}
            >
              {`Repay ${inputValue || ''} Dai`}
            </Text>
          </Box>
        </Box>
      </Box>}

      { repayActive && !txActive &&
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
              <Text>Repayment of  {inputValue} Dai</Text>
              <Text>Transaction Pending: </Text>
              <Box
                fill='horizontal'
                round='medium'
                border='all'
                onClick={()=>console.log('Going to etherscan')}
                align='center'
                pad='small'
              >
                <Text
                  weight='bold'
                  size='small'
                >
                  View on Etherscan
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>}
    </>
  );
}

export default Repay;
