import React, { useEffect, useState } from 'react';
import {ethers} from 'ethers';
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
import { NotifyContext } from '../contexts/NotifyContext';

import { useController, useCallTx } from '../hooks';

interface BorrowActionProps {
  borrowFn?:any
  // activeSeries?:IYieldSeries,
  maxValue?:number
}

const BorrowAction = ({ borrowFn, maxValue }:BorrowActionProps) => {

  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { deployedContracts } = yieldState;
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading, seriesAggregates, seriesRates, activeSeries } = seriesState;
  const {
    maxDaiAvailable_,
    debtValue_,
    collateralValue_,
    collateralRatio_,
  } = seriesAggregates;

  const { borrow, borrowActive }  = useController();

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ borrowDisabled, setBorrowDisabled ] = React.useState<boolean>(false);
  const [ selectorOpen, setSelectorOpen ] = React.useState<boolean>(false);
  const [ estRatio, setEstRatio ] = React.useState<any>(0);
  const [ estChange, setEstChange ] = React.useState<any>(0);
  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);

  const [ indicatorColor, setIndicatorColor ] = React.useState<string>('brand');
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const [ callTx ] = useCallTx();
 
  const borrowProcedure = async (value:number) => {
    await borrow(deployedContracts.Controller, 'ETH-A', activeSeries.maturity, value );
    yieldActions.updateUserData();
    seriesActions.refreshPositions([ activeSeries ]);
  };

  // TODO: maybe split into a custom hook
  const { state: { pendingTxs } } = React.useContext(NotifyContext);
  const [txActive, setTxActive] = useState<any>(null);
  useEffect(()=>{
    setTxActive(pendingTxs.find((x:any)=> x.type === 'BORROW'));
  }, [ pendingTxs ]);

  useEffect(()=>{
    if (estRatio && estRatio <= 1.5) {
      setBorrowDisabled(true);
      setIndicatorColor('red');
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of yDai you can borrow based on your collateral'); 
    } else if (estRatio > 1.5 && estRatio < 2.0 ) {
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
    activeSeries && inputValue && ( async () => {
      const res = await callTx(activeSeries.marketAddress, 'Market', 'sellChaiPreview', [ethers.utils.parseEther(inputValue.toString())]);
      setYDaiValue( parseFloat(ethers.utils.formatEther(res)) );
    })();
  }, [inputValue]);

  useEffect(() => {

    if (inputValue && activeSeries) {
      // console.log(seriesRates.get(activeSeries.maturity).sellYDai_);
      // const estValue = seriesRates.get(activeSeries.maturity).sellYDai_;
      // const newEst = ( activeSeries.yieldAPR/100 * parseFloat(inputValue) + parseFloat(inputValue));
      // setEstAtMaturity(newEst);
      // setYDaiValue( await getYDaiValue(activeSeries.market, inputValue));
    }

    if ( inputValue && ( inputValue > maxDaiAvailable_ ) ) {
      // setDepositDisabled(true);
      console.log(inputValue, maxDaiAvailable_);
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of yDai you can borrow based on your collateral'); 
    } else if (inputValue && ( inputValue > Math.round(maxDaiAvailable_-1) ) ) {
      setErrorMsg(null);
      setWarningMsg('If you borrow right up to your maximum allowance, there is high probability you will be liquidated soon!');
    } else {
      // setDepositDisabled(false);
      setWarningMsg(null);
      setErrorMsg(null);
    }

  }, [ inputValue ]);

  

  useEffect(() => {
    console.log(seriesAggregates);

  }, [ activeSeries ]);

  return (
    <>
      {selectorOpen && <SeriesSelector close={()=>setSelectorOpen(false)} /> }
      { !txActive && !borrowActive &&
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
              onClick={()=>setSelectorOpen(true)}
              hoverIndicator='brand'
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
                  <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='large'> {activeSeries && activeSeries.yieldAPR_ || ''}% </Text>
                  { false && 
                  <Box pad='xsmall'>
                    <Text alignSelf='start' size='xxsmall'>
                      <Info /> You need to deposit collateral in order to Borrow Dai.
                    </Text>
                  </Box>}
                </Box>

                <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Approx. Dai owed at maturity</Text>
                    <Help />
                  </Box>

                  <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='large'> 
                    {yDaiValue.toFixed(2)} Dai on {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                  </Text>
                </Box>
              </Box>
              <Box gap='small'>
                <Box direction='row' gap='small'>
                  <Text color='text-weak' size='xsmall'>Maximum Borrowing Power</Text>
                  <Help />
                </Box>
                <Box direction='row' gap='small'>
                  <Text color='brand' weight='bold' size='large'> {maxDaiAvailable_? `approx. ${maxDaiAvailable_.toFixed(2)} Dai`: ''}  </Text>
                </Box>
                {/* <Text color='text-weak' size='xxsmall'>if you deposit {inputValue||0} Eth</Text> */}
              </Box>
            </Box>
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
      </Box> }

      { borrowActive && !txActive &&
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
            <Text>You borrowed {inputValue} Dai</Text>
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
    </>
  );
};

export default BorrowAction;
