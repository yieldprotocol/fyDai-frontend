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
  

import WithdrawDai from './WithdrawDai';
import Redeem from './Redeem';

import SeriesDescriptor from '../components/SeriesDescriptor';
import InlineAlert from '../components/InlineAlert';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
  
import { usePool, useBalances, useMath, useToken } from '../hooks';


interface ILendProps {
  lendAmount?:any
}
  
const Lend = ({ lendAmount }:ILendProps) => {
  
  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { deployedContracts } = yieldState;

  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading, activeSeries } = seriesState;

  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const {
    daiBalance_,
    ethBorrowingPower_: maximumDai
  } = userState.position;
  
  // const { borrow, borrowActive }  = useController();

  const { sellDai, previewPoolTx }  = usePool();
  const { approveToken, approveActive } = useToken();
  const { getTokenAllowance } = useBalances();
  const { yieldAPR } = useMath();
  
  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ lendDisabled, setLendDisabled ] = React.useState<boolean>(false);

  const [ approved, setApproved ] = React.useState<any>(0);
  const [ sellOpen, setSellOpen ] = useState<boolean>(false);

  const [ APR, setAPR ] = React.useState<number>();
  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);
  const [ currentValue, setCurrentValue ] = React.useState<number>(0);
  
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);
  
  const lendProcedure = async (value:number) => {
    await sellDai(
      activeSeries.poolAddress,
      inputValue,
      0 // transaction queue value
    );
    setInputValue('');
    await userActions.updatePosition();
    await seriesActions.updateActiveSeries(); // or, await seriesActions.updateSeries([activeSeries]);
  };

  const approveProcedure = async (value:number) => {
    await approveToken(deployedContracts.Dai, activeSeries.poolAddress, value);
    setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.poolAddress, 'Dai'));
  };

  useEffect(() => {
    activeSeries && !(activeSeries.isMature) && inputValue && ( async () => {
      const preview = await previewPoolTx('sellDai', activeSeries.poolAddress, inputValue);
      setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
      setAPR( yieldAPR( ethers.utils.parseEther(inputValue.toString()), preview, activeSeries.maturity ) );
    })();
  }, [inputValue]);
  
  useEffect(() => {
    if ( inputValue && ( inputValue > daiBalance_ ) ) {
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

  /* handle active series loads and changes */
  useEffect(() => {
    activeSeries && !(activeSeries.isMature) && ( async ()=> {
      const preview = await previewPoolTx('SellYDai', activeSeries.poolAddress, activeSeries.yDaiBalance_);
      setCurrentValue( parseFloat(ethers.utils.formatEther(preview)));
    })();
    ( async ()=>{
      activeSeries && setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.poolAddress, 'Dai'));
      console.log(activeSeries);
    })();
  }, [ activeSeries ]);

  return (
    <>
      { sellOpen && <WithdrawDai close={()=>setSellOpen(false)} /> }
      <Box flex='grow' gap='medium' align='center' fill='horizontal'>
          
        {/* <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text>
          
        <SeriesDescriptor activeView='lend' /> */}

        <Box fill gap='small' pad={{ horizontal:'medium' }}>
          <Box fill direction='row-responsive' justify='start' gap='large'>
            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Portfolio Value at Maturity</Text>
                <Help />
              </Box>
              <Text color='brand' weight='bold' size='medium'> {activeSeries && `${activeSeries?.yDaiBalance_.toFixed(2)} Dai` || '-'} </Text>
            </Box>

            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Current Value</Text>
                <Help />
              </Box>
              <Text color='brand' weight='bold' size='medium'> {currentValue!==0?`${currentValue.toFixed(2)} Dai`: '-'} </Text>
            </Box>
          </Box>
        </Box>

        { !activeSeries?.isMature ?
          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to lend</Text>
            <Box
              direction='row-responsive'
              fill='horizontal'
              gap='small'
              align='center'
            >
              <Box 
                round='small'
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
                />
              </Box>

              <Box justify='center'>
                <Box
                  round
                  onClick={()=>setInputValue(daiBalance_)}
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
                  <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='medium'> 
                    {APR && APR.toFixed(2)}%                  
                  </Text>
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
                  <Text color='brand' weight='bold' size='medium'> {daiBalance_?`${daiBalance_.toFixed(2)} Dai`: '-'} </Text>
                </Box>         
              </Box>
              <Box fill direction='row-responsive' justify='between'>
                {/* next block */}
              </Box>
            </Box>
          </Box> :
          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Redeem />
          </Box>}
  
        <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />

        { !activeSeries?.isMature && 
          <>
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
              round='small'
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
          </>}
      </Box>
    </>
  );
};

Lend.defaultProps={ lendAmount:null };

export default Lend;