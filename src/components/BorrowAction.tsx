import React, { useEffect, useState } from 'react';
import Moment from 'moment';
import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';

import { 
  FiCheckCircle,
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import SeriesSelector from './SeriesSelector';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';

import { useDealer } from '../hooks';

interface BorrowActionProps {
  borrowFn?:any
  // activeSeries?:IYieldSeries,
  maxValue?:number
}

const BorrowAction = ({ borrowFn, maxValue }:BorrowActionProps) => {

  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { deployedContracts } = yieldState;
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading: positionsLoading, seriesTotals, activeSeries, setActiveSeries } = seriesState;
  const {
    daiAvailable_,
    // estimateRatio,
    debtValue_,
    collateralValue_,
    collateralRatio_,
  } = seriesTotals;

  const { borrow, borrowActive }  = useDealer();

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ borrowDisabled, setBorrowDisabled ] = React.useState<boolean>(false);
  const [ selectorOpen, setSelectorOpen ] = React.useState<boolean>(false);
  const [ estRatio, setEstRatio ] = React.useState<any>(0);
  const [ estChange, setEstChange ] = React.useState<any>(0);

  const [ indicatorColor, setIndicatorColor ] = React.useState<string>('brand');
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const borrowProcedure = async (value:number) => {
    await borrow(deployedContracts.Dealer, 'ETH-A', activeSeries.maturity, value );
    // actions.updateUserData(state.deployedContracts, state.deployedContracts);
    // actions.updateSeriesData(state.deployedSeries);
  };

  useEffect(()=>{
    if (estRatio && estRatio <= 150) {
      setBorrowDisabled(true);
      setIndicatorColor('red');
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of yDai you can borrow based on your collateral'); 
    } else if (estRatio > 150 && estRatio < 200 ) {
      setIndicatorColor('orange');
      setErrorMsg(null);
      setWarningMsg('Borrowing that much will put you at risk of liquidation');
    } else {
      setBorrowDisabled(false);
      setIndicatorColor('brand');
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ estRatio ]);

  useEffect(() => {
    if (inputValue && collateralValue_ && debtValue_) {
      const newRatio = collateralValue_ / ( debtValue_ + parseFloat(inputValue));
      setEstRatio(newRatio.toFixed(2));
      const change = (collateralRatio_ - newRatio);
      setEstChange(change.toFixed(2));
    }

    if ( inputValue && ( inputValue > daiAvailable_ ) ) {
      // setDepositDisabled(true);
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of yDai you can borrow based on your collateral'); 
    } else if (inputValue && ( inputValue > Math.round(daiAvailable_-1) ) ) {
      setErrorMsg(null);
      setWarningMsg('If you borrow right up to your maximum allowance, there is high probability you will be liquidated soon!');
    } else {
      // setDepositDisabled(false);
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  useEffect(() => {
    console.log(activeSeries);
  }, [ activeSeries ]);

  return (
    <>
      {selectorOpen && <SeriesSelector close={()=>setSelectorOpen(false)} /> }
      <Box flex='grow' justify='between'>
        <Box gap='medium' align='center' fill='horizontal'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Choose a series</Text>
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
              fill
              pad='small'
              flex
            >
              { activeSeries? activeSeries.displayName : 'Loading...' }
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

          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to borrow</Text>
            <Box 
              round='medium'
              background='brand-transparent'
              direction='row'
              fill='horizontal'
              pad='small'
              flex
            >
              {/* <Box width='15px' height='15px'>
              <Image src={ethLogo} fit='contain' />
            </Box> */}
              <TextInput
                type="number"
                placeholder='Enter the amount of Dai to borrow'
                value={inputValue}
                // disabled={depositDisabled}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
              />
            </Box>

            <Box fill gap='small' pad={{ horizontal:'medium' }}>
              <Box fill direction='row-responsive' justify='between'>
                <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Estimated APR</Text>
                    <Help />
                  </Box>
                  <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='large'> 3.5% </Text>
                  { false && 
                  <Box pad='xsmall'>
                    <Text alignSelf='start' size='xxsmall'>
                      <Info /> You need to deposit collateral in order to Borrow Dai.
                    </Text>
                  </Box>}
                </Box>

                <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Dai owed at maturity</Text>
                    <Help />
                  </Box>
                  <Text color='brand' weight='bold' size='large'> 15 Dai on 23 December 2020</Text>
                  { false && 
                  <Box pad='xsmall'>
                    <Text alignSelf='start' size='xxsmall'>
                      <Info /> Collateral value should be well above 150% to be safe from liquidation. Either increase your collateral amount or repay some existing debt. 
                    </Text>
                  </Box>}
                </Box>
              </Box>
              <Box gap='small'>

                <Box direction='row' gap='small'>
                  <Text color='text-weak' size='xsmall'>Maximum Borrowing Power</Text>
                  <Help />
                </Box>
                <Box direction='row' gap='small'>
                  <Text color='brand' weight='bold' size='large'> {daiAvailable_? `approx. ${daiAvailable_.toFixed(2)} Dai`: ''}  </Text>
                </Box>
                {/* <Text color='text-weak' size='xxsmall'>if you deposit {inputValue||0} Eth</Text> */}
              </Box>
            </Box>

            {inputValue > 150 &&
            <Box direction='row' border={{ color:'red' }} pad='small' margin={{ vertical:'small' }}> 
              <Text size='xsmall' color='red'>
                <Warning /> 
                {' Wooah. If you borrow that much there is a good chance you\'ll get liquidated soon. Proceed with caution!'}
              </Text>
            </Box>}
          </Box>

          { warningMsg &&
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
            <Text weight='bold' color='red'>Wooah, Hang on</Text>  
            <Text color='red'>{errorMsg}</Text>
          </Box> }

          <Box
            fill='horizontal'
            round='medium'
            background={( !(inputValue>0) || borrowDisabled) ? 'brand-transparent' : 'brand'}
            onClick={(!(inputValue>0) || borrowDisabled)? ()=>{}:()=>borrowProcedure(inputValue)}
            align='center'
            pad='medium'
          >
            <Text 
              weight='bold'
              size='large'
              color={( !(inputValue>0) || borrowDisabled) ? 'text-xweak' : 'text'}
            >
              {`Borrow ${inputValue || ''} Dai`}
            </Text>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default BorrowAction;
