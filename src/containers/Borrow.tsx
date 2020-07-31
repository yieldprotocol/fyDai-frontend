import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Moment from 'moment';
import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';

import { 
  FiCheckCircle,
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import SeriesSelector from '../components/SeriesSelector';
import InlineAlert from '../components/InlineAlert';

import { YieldContext } from '../contexts/YieldContext';

import { SeriesContext } from '../contexts/SeriesContext';
import { NotifyContext } from '../contexts/NotifyContext';

import { useController, useCallTx, usePool, useYDai } from '../hooks';

interface BorrowProps {
  borrowFn?:any
  // activeSeries?:IYieldSeries,
  maxValue?:number
}

const Borrow = ({ borrowFn, maxValue }:BorrowProps) => {

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
  const { 
    buyDai,
    previewPoolTx,
    approveToken,
    addPoolDelegate,
    checkPoolDelegate
  }  = usePool();
  const { userAllowance } = useYDai();

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ borrowDisabled, setBorrowDisabled ] = React.useState<boolean>(true);
  const [ selectorOpen, setSelectorOpen ] = React.useState<boolean>(false);
  const [ estRatio, setEstRatio ] = React.useState<any>(0);

  const [ hasDelegated, setHasDelegated] = React.useState<boolean>(activeSeries?.hasDelegated || true);

  /* token balances and values */
  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);
  const [ approved, setApproved ] = React.useState<any>(0);
  const [ daiApproved, setDaiApproved ] = React.useState<any>(0);

  const [ indicatorColor, setIndicatorColor ] = React.useState<string>('brand');
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const borrowProcedure = (value:number) => {
    borrow(deployedContracts.Controller, 'ETH-A', activeSeries.maturity, value).then(
      async () => {
        await buyDai(
          activeSeries.marketAddress,
          inputValue,
          0
        );
      }
    );
    setInputValue('');
    yieldActions.updateUserData();
    seriesActions.refreshPositions([ activeSeries ]);
  };

  const approveProcedure = async (value:number) => {
    await approveToken(activeSeries.yDaiAddress, activeSeries.marketAddress, value);
    const approvedYDai = await userAllowance(activeSeries.yDaiAddress, activeSeries.marketAddress);
    setApproved( approvedYDai ); // TODO convert to Dai somehow
  };

  const delegateProcedure = async () => {
    await addPoolDelegate(activeSeries.marketAddress, activeSeries.yDaiAddress);
    const res = await checkPoolDelegate(activeSeries.marketAddress, activeSeries.yDaiAddress);
    setHasDelegated(res);
  };

  // TODO: maybe split into a custom hook
  const { state: { pendingTxs } } = React.useContext(NotifyContext);
  const [txActive, setTxActive] = useState<any>(null);
  useEffect(()=>{
    setTxActive(pendingTxs.find((x:any)=> x.type === 'BORROW' || x.type === 'BUY' || x.type === 'DELEGATION'));
  }, [ pendingTxs ]);


  /* Handle collateralisation ratio exceptions and warnings */
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
      setIndicatorColor('brand');
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ estRatio ]);

  /* Handle dai to yDai conversion (yDai needed to compare with the approved allowance)  */
  useEffect(() => {
    activeSeries && inputValue > 0 && ( async () => {
      const preview = await previewPoolTx('buyDai', activeSeries.marketAddress, inputValue);
      if (!preview.isZero()) {
        setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        setWarningMsg(null);
        setErrorMsg(null);
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('buyDai', activeSeries.marketAddress, 1);
        setYDaiValue(inputValue* parseFloat((ethers.utils.formatEther(rate))) );
        setBorrowDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [inputValue]);

  /* Then also the opposite, Handle yDai to Dai conversion for the approved Dai */
  useEffect(() => {
    approved && ( async () => {
      const preview = await previewPoolTx('SellYDai', activeSeries.marketAddress, approved);
      if (!preview.isZero()) {
        setDaiApproved( parseFloat(ethers.utils.formatEther(preview)) );
      } else {
        /* market doesn't have liquidity - estimate from a rate */
        const rate = await previewPoolTx('SellYDai', activeSeries.marketAddress, 1);
        setDaiApproved( approved*parseFloat(ethers.utils.formatEther(rate)) );
      }
    })();
  }, [ approved ]);

  useEffect(() => {
    if ( inputValue && ( inputValue > maxDaiAvailable_ ) ) {
      console.log(inputValue, maxDaiAvailable_);
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of yDai you can borrow based on your collateral'); 
    } else if (inputValue && ( inputValue > Math.round(maxDaiAvailable_-1) ) ) {
      setErrorMsg(null);
      setWarningMsg('If you borrow right up to your maximum allowance, there is high probability you will be liquidated soon!');
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  /* Borrow button disabling logic */
  useEffect(()=>{
    if (!hasDelegated) {
      setBorrowDisabled(true);
    } else if (approved < yDaiValue) {
      setBorrowDisabled(true);
    } else if (!(inputValue) || inputValue===0) {
      setBorrowDisabled(true);
    } else {
      setBorrowDisabled(false);
    }
  }, [ approved, inputValue, yDaiValue, hasDelegated ]);

  useEffect(() => {
    activeSeries && ( async ()=>{
      const approvedAmount = await userAllowance(activeSeries.yDaiAddress, activeSeries.marketAddress);
      setApproved( parseFloat(approvedAmount.toString()));
      setHasDelegated(activeSeries.hasDelegated);
    })();
  }, [ activeSeries ]);

  return (
    <>
      {selectorOpen && <SeriesSelector close={()=>setSelectorOpen(false)} /> }
      { txActive?.type !== 'BORROW' && txActive?.type !== 'BUY' && !borrowActive &&
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
              // elevation='small'
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

          {!hasDelegated &&
            <Box round pad='small' gap='small' border='all' elevation='small' align='center' fill>
              <Text weight='bold' size='medium' color='brand'>Once-off Action required: </Text>
              <CheckBox 
                reverse
                onChange={()=>delegateProcedure()}
                label={( txActive?.type === 'DELEGATION')? 'Approval pending...' : 'Approve Transactions for this series'}
              />
              {/* <Box
                round
                onClick={()=>delegateProcedure()}
                hoverIndicator='brand-transparent'
                border='all'
                pad={{ horizontal:'small', vertical:'small' }}
                align='center'
              >
                <Text
                  weight='bold'
                // size='xxsmall'
                  color='text'
                >
                  Approve Transactions for this series
                </Text>
              </Box> */}
            </Box>}

          
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
                <Text color='text-weak' size='xsmall'>Maximum Borrowing Power</Text>
                <Help />
              </Box>
              <Box direction='row' gap='small'>
                <Text color={maxDaiAvailable_? 'brand': 'brand-transparent'} size='xxsmall'>approx.</Text>
                <Text color='brand' weight='bold' size='medium'> {maxDaiAvailable_? `${maxDaiAvailable_.toFixed(2)} Dai`: ''}  </Text>
              </Box>
            </Box>
            
          </Box>


          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to borrow</Text>
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
                placeholder='Enter the amount of Dai to borrow'
                value={inputValue || ''}
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
                  <Text color={inputValue>0?'brand':'brand-transparent'} weight='bold' size='medium'> {activeSeries && activeSeries.yieldAPR_ || ''}% </Text>
                </Box>

                <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Approx. Dai owed at maturity</Text>
                    <Help />
                  </Box>
                  <Text color={inputValue>0? 'brand':'brand-transparent'} weight='bold' size='medium'> 
                    {yDaiValue.toFixed(2)} Dai on {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                  </Text>
                </Box>
              </Box>
              {/* add next layer here */}
            </Box>
          </Box>

          <Box>
            <CheckBox
              reverse
                // value={true}
              checked={!inputValue || ( approved >= yDaiValue )}
              disabled={!inputValue || ( approved >= yDaiValue )}
              onChange={()=>approveProcedure(yDaiValue)}
              label={(approved >= yDaiValue) ? 
                `Borrowing unlocked for ~${daiApproved.toFixed(2)} Dai (${approved.toFixed(2) || '' } yDai)` 
                : `Unlock borrowing of ${inputValue || ''} Dai`}
            />
          </Box>

          <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />

          <Box
            fill='horizontal'
            round='medium' 
            background={borrowDisabled ? 'brand-transparent' : 'brand'} 
            onClick={borrowDisabled ? ()=>{}:()=>borrowProcedure(inputValue)} 
            align='center'
            pad='small'
          >
            <Text 
              weight='bold'
              size='large'
              color={borrowDisabled ? 'text-xweak' : 'text'} 
            >
              {`Borrow ${inputValue || ''} Dai`}
            </Text>
          </Box>
          Note, the borrowing process involves two transactions that both require authorization.
        </Box>
      </Box> }

      { borrowActive && !txActive &&
        <Box>Awaiting transaction approval</Box>}

      { (txActive?.type === 'BORROW') &&
      <Box align='center' flex='grow' justify='between' gap='large'>
        <Box gap='medium' align='center' fill='horizontal'>
          <Text size='xlarge' color='brand' weight='bold'>Thank you.</Text>
          <Box
            // direction='row-responsive'
            fill='horizontal'
            gap='large'
            align='center'
          >
            <Text>You are in the process of borrowing {inputValue} Dai</Text>
            <Text>The transaction is pending. </Text>
            <Box
              fill='horizontal'
              round='medium'
              // background='brand'
              border='all'
              onClick={()=>console.log('Going to etherscan')}
              align='center'
              pad='xsmall'
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

      { (txActive?.type === 'BUY') &&
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
            <Text>We are now putting the Dai in your wallet.</Text>
            <Box
              fill='horizontal'
              round='medium'
              // background='brand'
              border='all'
              onClick={()=>console.log('Cancelling Dai buying')}
              align='center'
              pad='xsmall'
            >
              <Text
                weight='bold'
                size='small'
              >
                Cancel automatic Dai conversion to keep your yDai.
              </Text>
            </Box>
            <Box
              fill='horizontal'
              round='medium'
              // background='brand'
              border='all'
              onClick={()=>console.log('Going to etherscan')}
              align='center'
              pad='xsmall'
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
};

export default Borrow;