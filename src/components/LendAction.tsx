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
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
  
import SeriesSelector from './SeriesSelector';
import DaiWithDrawAction from './DaiWithDrawAction';
import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
  
import { useMarket, useBalances } from '../hooks';

interface BorrowActionProps {
  borrowFn?:any
  // activeSeries?:IYieldSeries,
  maxValue?:number
}
  
const LendAction = ({ borrowFn, maxValue }:BorrowActionProps) => {
  
  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { deployedContracts, userData } = yieldState;
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading, seriesAggregates, activeSeries } = seriesState;
  const {
    maxDaiAvailable_,
    // estimateRatio,
    debtValue_,
    ethBalance_,
  } = seriesAggregates;
  
  // const { borrow, borrowActive }  = useController();

  const { sellDai, previewMarketTx, approveToken }  = useMarket();
  const { getTokenAllowance } = useBalances();
  
  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ lendDisabled, setLendDisabled ] = React.useState<boolean>(false);
  const [ selectorOpen, setSelectorOpen ] = React.useState<boolean>(false);

  const [ approved, setApproved ] = React.useState<any>(0);

  const [ sellOpen, setSellOpen ] = useState<boolean>(false);

  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);
  const [ currentValue, setCurrentValue ] = React.useState<number>(0);
  
  const [ indicatorColor, setIndicatorColor ] = React.useState<string>('brand');
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);
  
  const lendProcedure = async (value:number) => {
    await sellDai(
      activeSeries.marketAddress,
      inputValue,
      0 // transaction queue value
    );
    setInputValue('');
    yieldActions.updateUserData();
    seriesActions.refreshPositions([activeSeries]);
  };

  const approveProcedure = async (value:number) => {
    await approveToken(deployedContracts.Dai, activeSeries.marketAddress, value);
    setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.marketAddress, 'Dai'));
  };

  useEffect(() => {
    activeSeries && inputValue && ( async () => {
      const preview = await previewMarketTx('sellDai', activeSeries.marketAddress, inputValue);
      setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
    })();
  }, [inputValue]);

  useEffect(() => {
    activeSeries && inputValue && ( async () => {
      const preview = await previewMarketTx('sellDai', activeSeries.marketAddress, inputValue);
      setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
    })();
  }, [inputValue]);
  
  useEffect(() => {
    if ( inputValue && ( inputValue > userData.daiBalance_ ) ) {
      setLendDisabled(true);
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you have'); 
    } else {
      // setLendDisabled(false);
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  /* Lend button disabling logic */
  useEffect(()=>{
    if (approved < inputValue) {
      setLendDisabled(true);
    } else if (!(inputValue) || inputValue===0) {
      setLendDisabled(true);
    } else {
      setLendDisabled(false);
    }
  }, [ approved, inputValue ]);

  useEffect(() => {
    activeSeries && ( async ()=> {
      const preview = await previewMarketTx('SellYDai', activeSeries.marketAddress, activeSeries.yDaiBalance_);
      setCurrentValue( parseFloat(ethers.utils.formatEther(preview)));
    })();
  }, [ activeSeries, ]);
  
  useEffect(() => {
    ( async ()=>{
      activeSeries && setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.marketAddress, 'Dai'));
      console.log(activeSeries);
    })();
  }, [ activeSeries ]);
  

  return (
    <>
      {selectorOpen && <SeriesSelector close={()=>setSelectorOpen(false)} /> }
      { sellOpen && <DaiWithDrawAction close={()=>setSellOpen(false)} /> }
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
              // background='brand-transparent'
              border='all'
              onClick={()=>setSelectorOpen(true)}
              hoverIndicator='brand-transparent'
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

          <Box fill gap='small' pad={{ horizontal:'medium' }}>

            <Box fill direction='row-responsive' justify='start' gap='large'>

              <Box gap='small'>
                <Box direction='row' gap='small'>
                  <Text color='text-weak' size='xsmall'>Series value @ Maturity</Text>
                  <Help />
                </Box>
                <Text color='brand' weight='bold' size='medium'> {activeSeries && `${activeSeries?.yDaiBalance_.toFixed(2)} Dai` || '-'} </Text>
              </Box>

              <Box gap='small'>
                <Box direction='row' gap='small'>
                  <Text color='text-weak' size='xsmall'>Current Series Value</Text>
                  <Help />
                </Box>
                <Text color='brand' weight='bold' size='medium'> {currentValue!==0?`${currentValue.toFixed(2)} Dai`: '-'} </Text>
              </Box>
            </Box>

          </Box>
  
          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to lend</Text>
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
                  placeholder='Enter the amount of Dai to lend'
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
              // icon={<Text alignSelf='start' size='xsmall'>Eth</Text>}
                  // icon={<Ethereum />}
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
                  <Text size='xsmall'>Use max</Text>
                </Box>
              </Box>
            </Box>

            <Box fill gap='small' pad={{ horizontal:'medium' }}>

              <Box fill direction='row-responsive' justify='between'>
                <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Estimated APR</Text>
                    <Help />
                  </Box>
                  <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='medium'> {activeSeries && activeSeries.yieldAPR_ || ''}% </Text>
                </Box>

                <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Approx. Dai received at maturity</Text>
                    <Help />
                  </Box>
                  <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='medium'> 
                    { yDaiValue.toFixed(2) } Dai on {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                  </Text>
                </Box>

                <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Wallet Dai balance</Text>
                    <Help />
                  </Box>
                  <Text color='brand' weight='bold' size='medium'> {userData.daiBalance_?`${userData.daiBalance_.toFixed(2)} Dai`: '-'} </Text>
                </Box>
              
              </Box>

              <Box fill direction='row-responsive' justify='between'>
                {/* <Box gap='small'>
                  <Box direction='row' gap='small'>
                    <Text color='text-weak' size='xsmall'>Wallet Dai balance</Text>
                    <Help />
                  </Box>
                  <Text color='brand' weight='bold' size='medium'> {userData.daiBalance_?`${userData.daiBalance_} Dai`: '-'} </Text>
                </Box> */}
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

          <Box>
            <CheckBox 
              reverse
                // value={true}
              checked={!inputValue || ( approved >= inputValue )}
              disabled={!inputValue || ( approved >= inputValue )}
              onChange={()=>approveProcedure(inputValue)}
              label={(approved >= inputValue) ? 
                `Lending unlocked for up to ${approved.toFixed(2) || '' } Dai` 
                : `Unlock lending of ${inputValue || ''} Dai`}
            />
          </Box>
  
          <Box
            fill='horizontal'
            round='medium'
            background={( !(inputValue>0) || lendDisabled) ? 'brand-transparent' : 'brand'}
            onClick={(!(inputValue>0) || lendDisabled)? ()=>{}:()=>lendProcedure(inputValue)}
            align='center'
            pad='small'
          >
            <Text 
              weight='bold'
              size='large'
              color={( !(inputValue>0) || lendDisabled) ? 'text-xweak' : 'text'}
            >
              {`Lend ${inputValue || ''} Dai`}
            </Text>
          </Box>
          <Box alignSelf='end'>
            <Box
              round
              onClick={()=>setSellOpen(true)}
              hoverIndicator='brand-transparent'
          // border='all'
              pad={{ horizontal:'small', vertical:'small' }}
              justify='center'
            >
              <Box direction='row' gap='small'>
                <Text size='xsmall' color='text-weak'> Alternatively, withdraw Dai from this series</Text>
                <ArrowRight color='text-weak' />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};
  
export default LendAction;