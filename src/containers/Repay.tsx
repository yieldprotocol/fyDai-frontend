import React, { useEffect, useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { Box, TextInput, Text, ResponsiveContext, Keyboard, Collapsible } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import { cleanValue } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

import DaiMark from '../components/logos/DaiMark';
import YieldMobileNav from '../components/YieldMobileNav';

import { logEvent } from '../utils/analytics';
import SeriesDescriptor from '../components/SeriesDescriptor';

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

  /* init hooks */
  const { repayDaiDebt } = useBorrowProxy();
  const [ txActive ] = useTxActive(['repay']);
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
                  <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to Repay</Text>

                  <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                    <TextInput
                      ref={(el:any) => {el && !mobile && el.focus(); setInputRef(el);}} 
                      type="number"
                      placeholder={!mobile ? 'Enter the amount of Dai to Repay': 'DAI'}
                      value={inputValue || ''}
                      plain
                      onChange={(event:any) => setInputValue(( cleanValue(event.target.value, 6) ))}
                      icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                    />
                    <FlatButton 
                      label={!mobile ? 'Repay Maximum': 'Maximum'}
                      onClick={()=>setInputValue( cleanValue(ethers.utils.formatEther(maxRepay), 6) )}
                    />
                  </InputWrap>

                  <Box fill>
                    <Collapsible open={true}>
                      <InfoGrid 
                        entries={[
                          {
                            label: 'Total amount owed',
                            visible: false,
                            active: true,
                            loading: false,    
                            value: activeSeries?.ethDebtFYDai_? `${activeSeries?.ethDebtFYDai_} DAI`: '0 DAI',
                            valuePrefix: null,
                            valueExtra: null, 
                          }, 
                          {
                            label: 'Cost to repay all debt now',
                            visible: true,
                            active: true,
                            loading: false,    
                            value:  activeSeries?.ethDebtDai_? `${cleanValue(activeSeries?.ethDebtDai_, 2)} DAI`: '0 DAI',
                            valuePrefix: null,
                            valueExtra: null,
                          },
                          {
                            label: `Owed after repayment of ${inputValue && cleanValue(inputValue, 2)} DAI`,
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
                        ]}
                      />
                    </Collapsible>
                  </Box>

                  {
                   !repayDisabled &&
                   <ActionButton
                     onClick={()=>repayProcedure(inputValue)}
                     label={`Repay ${inputValue || ''} DAI`}
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
