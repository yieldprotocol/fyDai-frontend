import React, { useEffect, useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { Box, TextInput, Text, ResponsiveContext, Keyboard, Collapsible } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiArrowLeft as ArrowLeft,
  FiLayers as ChangeSeries
} from 'react-icons/fi';

import { cleanValue } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';
import { useRollProxy } from '../hooks/rollProxyHook';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

import DaiMark from '../components/logos/DaiMark';
import YieldMobileNav from '../components/YieldMobileNav';

import SeriesDescriptor from '../components/SeriesDescriptor';
import RollSelector from '../components/RollSelector';
import StickyButton from '../components/StickyButton';
import { IYieldSeries } from '../types';

interface IRepayProps {
  close?:any;
}

function Repay({ close }:IRepayProps) {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  /* state from context */
  const { state: { activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance } = userState.position;

  /* local state */
  const [ inputValue, setInputValue ] = useState<any>();
  const [inputRef, setInputRef] = useState<any>(null);
  const [maxRepay, setMaxRepay] = useState<any>();
  const [ repayDisabled, setRepayDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const [ isRollDebt, setIsRollDebt ] = useState<boolean>(false);
  const [ destinationSeries, setDestinationSeries ] = useState<IYieldSeries>();

  /* init hooks */
  const { repayDaiDebt } = useBorrowProxy();
  const { rollDebt } = useRollProxy();
  const [ txActive ] = useTxActive(['REPAY', 'ROLL_DEBT']);
  const { account } = useSignerAccount();
  const isLol = useIsLol(inputValue);
  const debouncedInput = useDebounce(inputValue, 500);


  const repayProcedure = async (value:number) => {
    if (!repayDisabled) {
      !activeSeries?.isMature() && close();
      /* repay using proxy */
      await repayDaiDebt(activeSeries, 'ETH-A', value);
      
      /* clean up and refresh */ 
      setInputValue(undefined);

      if (activeSeries?.isMature()) {
        await Promise.all([
          userActions.updateUser(),
          seriesActions.updateSeries([activeSeries]),
        ]);
      } else {
        userActions.updateUser();
        seriesActions.updateSeries([activeSeries]);
      }      
    }
  };

  const rollDebtProcedure = async (value:number) => {
    if (!repayDisabled && destinationSeries) {
      !activeSeries?.isMature() && close();
      /* roll using proxy */
      await rollDebt(activeSeries, destinationSeries, value.toString(), 'ETH-A' );
         
      /* clean up and refresh */ 
      setInputValue(undefined);

      if (activeSeries?.isMature()) {
        await Promise.all([
          userActions.updateUser(),
          seriesActions.updateAllSeries(),
        ]);
      } else {
        userActions.updateUser();
        seriesActions.updateAllSeries();
      }      
    }
  };

  useEffect(()=>{
    activeSeries?.ethDebtDai && daiBalance?.gt(activeSeries?.ethDebtDai) && setMaxRepay(activeSeries.ethDebtDai.add(ethers.BigNumber.from('1000000000000') )); 
    activeSeries?.ethDebtDai && daiBalance?.lt(activeSeries?.ethDebtDai) && setMaxRepay(daiBalance);
  }, [daiBalance, activeSeries]);

  /* Repay disabling logic */
  useEffect(()=>{
    (
      (daiBalance && daiBalance.eq(ethers.constants.Zero)) ||
      !account ||
      !inputValue ||
      parseFloat(inputValue) <= 0
    )? setRepayDisabled(true): setRepayDisabled(false);
  }, [ inputValue ]);

  /* Handle input warnings and errors */ 
  useEffect(() => {
    if ( debouncedInput && daiBalance && ( ethers.utils.parseEther(debouncedInput).gt(daiBalance) ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai in your wallet'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput, daiBalance ]);

  /* get seriesData into an array and filter out the active series and mature series for  */
  useEffect(()=>{
    const arr = [...seriesData].map(([ ,value]) => (value));
    const filteredArr = arr.filter((x:IYieldSeries) => !x.isMature() && x.maturity !== activeSeries.maturity );
    // setSeriesArr(filteredArr);
    setDestinationSeries(filteredArr[0]);
  }, [ activeSeries ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> repayProcedure(inputValue)}
      onBackspace={()=> {
        inputValue && 
        (document.activeElement !== inputRef) && 
        setInputValue(debouncedInput.toString().slice(0, -1));
      }}
      target='document'
    >
      {!activeSeries?.isMature() && !mobile && <SeriesDescriptor activeView='borrow' minimized />}
      
      { !txActive &&
        <Box
          width={!mobile?{ min: activeSeries?.isMature()?'600px':'620px', max: activeSeries?.isMature()?'600px':'620px' } : undefined}
          alignSelf="center"
          fill
          background="background" 
          round='small'
          pad="large"
        >
          <Box flex='grow' justify='between'>
            <Box align='center' fill='horizontal'>

              { (activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero)) ?
             
                <Box gap='medium' align='center' fill='horizontal'>
                  <Box alignSelf='start' direction='row' justify='between' align='center'>
                    {/* <Text size='large' color='text' weight='bold'>Amount to:  </Text> */}

                    <Box pad={{ top:'small' }} gap='small' alignSelf='start' direction='row'>
                      <StickyButton
                        onClick={() => setIsRollDebt(false)}
                        selected={!isRollDebt}
                      >
                        <Box pad={{ horizontal:'medium', vertical: 'small' }} alignSelf='center'>
                          <Text size="medium" weight='bold'>
                            Repay debt
                          </Text>
                        </Box>
                      </StickyButton>   

                      <StickyButton
                        onClick={() => setIsRollDebt(true)}
                        selected={isRollDebt}
                      >
                        <Box pad={{ horizontal:'medium', vertical: 'small' }} alignSelf='center'>
                          <Text size="medium" weight='bold'>
                            Roll debt to another series
                          </Text>
                        </Box>
                      </StickyButton>   

                    </Box>
                  </Box>

                  <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                    <TextInput
                      ref={(el:any) => {el && !mobile && el.focus(); setInputRef(el);}} 
                      type="number"
                      placeholder={!mobile ? 'Enter the amount of Dai': 'DAI'}
                      value={inputValue || ''}
                      plain
                      onChange={(event:any) => setInputValue(( cleanValue(event.target.value, 6) ))}
                      icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                    />
                    <FlatButton 
                      label={!mobile ? `${isRollDebt? 'Roll Maximum': 'Repay Maximum'}`: 'Maximum'}
                      onClick={()=>setInputValue( cleanValue(ethers.utils.formatEther(maxRepay), 6) )}
                    />
                  </InputWrap>

                  { 
                  isRollDebt &&
                  <Box pad='small' direction='row' justify='between' fill align='center'>
                    <Box fill='horizontal'>
                      <Text size='xsmall'> Select a series to roll debt to: </Text>
                    </Box>
                    <RollSelector changeDestination={(x:IYieldSeries) => setDestinationSeries(x)} />
                  </Box>
                  } 

                  <Box fill>
                    <Collapsible open={true}>
                      <InfoGrid 
                        entries={[

                          {
                            label: 'Current Debt',
                            labelExtra: `Cost to ${ isRollDebt? 'roll':'repay'} all now`,
                            visible: !isRollDebt? true : !!inputValue&&inputValue>0,
                            active: true,
                            loading: false,    
                            value:  activeSeries?.ethDebtDai_? `${cleanValue(activeSeries?.ethDebtDai_, 2)} DAI`: '0 DAI',
                            valuePrefix: null,
                            valueExtra: null,
                          },

                          {
                            label: 'Remaining debt',
                            labelExtra: `after ${ isRollDebt? 'rolling':'repaying'} ${inputValue && cleanValue(inputValue, 2)} DAI `,
                            visible: !!inputValue&&inputValue>0,
                            active: !!inputValue&&inputValue>0,
                            loading: false,
                            value: activeSeries?.ethDebtDai_ ? 
                              ( activeSeries?.ethDebtDai_ - parseFloat(debouncedInput)>0 ? 
                                activeSeries?.ethDebtDai_ - parseFloat(debouncedInput) 
                                : 0
                              ).toFixed(2) : '- DAI',

                            valuePrefix: null,
                            valueExtra: null, 
                          },
                          {
                            label: `Debt in ${destinationSeries?.displayNameMobile}`,
                            labelExtra: `after rolling ${inputValue && cleanValue(inputValue, 2)} debt`, 
                            visible: isRollDebt && !!inputValue&&inputValue>0,
                            active: !!inputValue&&inputValue>0,
                            loading: false,    
                            value: null,
                            valuePrefix: null,
                            valueExtra: null, 
                          },

                        ]}
                      />
                    </Collapsible>
                  </Box>

                  {
                   !repayDisabled &&
                   <ActionButton
                     onClick={isRollDebt? ()=> rollDebtProcedure(inputValue) : ()=>repayProcedure(inputValue)}
                     label={isRollDebt? `Roll ${inputValue || ''} Debt to ${destinationSeries?.displayNameMobile}` : `Repay ${inputValue || ''} DAI`}
                     disabled={repayDisabled}
                     hasPoolDelegatedProxy={true}
                     clearInput={()=>setInputValue(undefined)}
                   />                 
                  }

                  {!activeSeries?.isMature() && !mobile &&
                  <Box alignSelf='start' margin={{ top:'medium' }}> 
                    <FlatButton 
                      onClick={()=>close()}
                      label={
                        <Box direction='row' gap='medium' align='center'>
                          <ArrowLeft color='text-weak' />
                          <Text size='xsmall' color='text-weak'> go back </Text>
                        </Box>
                      }
                    />
                  </Box>}
          
                </Box> :
                <Box 
                  gap='medium' 
                  margin={{ vertical:'large' }}  
                  pad='medium'     
                  round='small'
                  fill='horizontal'
                  border='all'
                >   
                  { activeSeries &&
                  <Box direction='row' justify='center' fill>          
                    <Box direction='row' gap='small' align='center'>
                      <Box>
                        <Check />
                      </Box>
                      <Box> 
                        <Text size='small'>You do not have any debt in this series.</Text>      
                      </Box>
                    </Box>
                  </Box>}           
                </Box>}            
            </Box>
          </Box>
        </Box>}

      {mobile && 
      !activeSeries?.isMature() &&
        <YieldMobileNav noMenu={true}>
          <NavLink 
            to={`/borrow/${activeSeries?.maturity}`}
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='small'>
              <Text size='xxsmall' color='text-weak'><ArrowLeft /></Text>
              <Text size='xxsmall' color='text-weak'>back to borrow</Text>
            </Box>
          </NavLink>
        </YieldMobileNav>}
        
    </Keyboard>
  );
}

Repay.defaultProps = { close:()=>null };

export default Repay;
