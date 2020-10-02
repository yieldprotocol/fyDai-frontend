import React, { useEffect, useContext, useState } from 'react';
import { ethers } from 'ethers';
import { Box, Button, TextInput, Text, ResponsiveContext, Keyboard, Layer } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { cleanValue } from '../utils';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import {
  usePool,
  useProxy,
  useTxActive,
  useSignerAccount,
  useDebounce,
  useIsLol,
} from '../hooks';

import ApprovalPending from '../components/ApprovalPending';
import TxStatus from '../components/TxStatus';
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

interface IRepayProps {
  repayAmount?:any
  setActiveView?: any;
  close?:any;
}

function Repay({ setActiveView, repayAmount, close }:IRepayProps) {
  const { state: { deployedContracts } } = useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance_, daiBalance } = userState.position;
  const screenSize = useContext(ResponsiveContext);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const { previewPoolTx }  = usePool(); 
  const { repayDaiDebt, repayActive } = useProxy();
  const [ txActive ] = useTxActive(['repay']);
  const { account } = useSignerAccount();

  const [ inputValue, setInputValue ] = useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);

  const [maxRepay, setMaxRepay] = useState<any>();

  const [ repayPending, setRepayPending ] = useState<boolean>(false);
  const [ repayDisabled, setRepayDisabled ] = useState<boolean>(true);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const isLol = useIsLol(inputValue);

  const repayProcedure = async (value:number) => {
    if (!repayDisabled) {
      setRepayPending(true);
      /* repay using proxy */
      await repayDaiDebt(activeSeries, 'ETH-A', value);
      setInputValue(undefined);
      if (activeSeries?.isMature()) {
        await Promise.all([
          userActions.updatePosition(),
          seriesActions.updateActiveSeries()
        ]);
      } else {
        userActions.updatePosition();
        seriesActions.updateActiveSeries();
      }
      setRepayPending(false);
      !activeSeries?.isMature() && close();    
    }
  };

  useEffect(()=>{
    daiBalance && activeSeries?.ethDebtDai && daiBalance.gt(activeSeries?.ethDebtDai) && setMaxRepay(activeSeries.ethDebtDai);
    daiBalance && activeSeries?.ethDebtDai && daiBalance.lt(activeSeries.ethDebtDai) && setMaxRepay(daiBalance);
  }, [daiBalance, activeSeries]);

  /* Repay disabling logic */
  useEffect(()=>{
    (
      (daiBalance && daiBalance.eq(ethers.constants.Zero)) ||
      !account ||
      !hasDelegated ||
      !inputValue ||
      parseFloat(inputValue) <= 0
    )? setRepayDisabled(true): setRepayDisabled(false);
  }, [ inputValue, hasDelegated ]);

  /* Handle input warnings and errors */ 
  useEffect(() => {
    if ( debouncedInput  && daiBalance && ( ethers.utils.parseEther(debouncedInput).gt(daiBalance) ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai in your wallet'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput ]);

  useEffect(() => {
    ( async ()=>{
    })();
  }, [ activeSeries ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> repayProcedure(inputValue)}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
      target='document'
    >

      { !txActive &&
        <Box
          width={{ min: '600px', max: '600px' }}
          alignSelf="center"
          fill
          background="background-front"
          round='small'
          pad="large"
        >
          <Box flex='grow' justify='between'>
            <Box gap='medium' align='center' fill='horizontal'>

              { (activeSeries?.ethDebtEDai.gt(ethers.constants.Zero)) ?
             
                <Box gap='medium' align='center' fill='horizontal'>
                  <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to Repay</Text>

                  <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={repayDisabled}>
                    <TextInput
                      ref={(el:any) => {el && el.focus(); setInputRef(el);}} 
                      type="number"
                      placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to Repay': 'DAI'}
                      value={inputValue || ''}
                      plain
                      onChange={(event:any) => setInputValue(( cleanValue(event.target.value, 6) ))}
                      icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                    />
                    <RaisedButton 
                      label={screenSize !== 'small' ? 'Repay Maximum': 'Maximum'}
                      onClick={()=>setInputValue(ethers.utils.formatEther(maxRepay))}
                    />
                  </InputWrap>


                  <InfoGrid 
                    entries={[
                      {
                        label: 'Total amount owed',
                        visible: true,
                        active: true,
                        loading: repayPending,    
                        value: activeSeries?.ethDebtEDai_? `${activeSeries.ethDebtEDai_} DAI`: '0 DAI',
                        valuePrefix: null,
                        valueExtra: null, 
                      }, 
                      {
                        label: 'Cost to repay today',
                        visible: true,
                        active: true,
                        loading: false,    
                        value:  activeSeries?.ethDebtDai_? `${activeSeries.ethDebtDai_} DAI`: '0 DAI',
                        valuePrefix: null,
                        valueExtra: null,
                      },
                      {
                        label: 'Owed after repayment',
                        visible: true,
                        active: !!inputValue&&inputValue>0,
                        loading: false,    
                        value: activeSeries?.ethDebtDai_ ? 
                          ( activeSeries.ethDebtDai_ - parseFloat(debouncedInput)>0 ? 
                            activeSeries.ethDebtDai_ - parseFloat(debouncedInput) 
                            : 0
                          ).toFixed(2) : '- DAI',

                        valuePrefix: null,
                        valueExtra: null, 
                      },
                    ]}
                  />

                  <ActionButton
                    onClick={()=>repayProcedure(inputValue)}
                    label={`Repay ${inputValue || ''} DAI`}
                    disabled={repayDisabled}
                    hasDelegatedPool={true}
                  />

                  {!activeSeries?.isMature() &&
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
                  <Box direction='row' justify='center' fill>          
                    <Box direction='row' gap='small' align='center'>
                      <Box>
                        <Check />
                      </Box>
                      <Box> 
                        <Text size='small' color='brand'>You do not have any debt in this series.</Text>         
                      </Box>
                    </Box>
                    {/* <Button label='borrow Dai from this series' /> */}
                  </Box>             
                </Box>}            
            </Box>
          </Box>
        </Box>}
      { repayActive && !txActive && <ApprovalPending /> }
      { txActive && <TxStatus msg={`You are repaying ${inputValue} DAI`} tx={txActive} /> }
    </Keyboard>
  );
}

Repay.defaultProps = { repayAmount:null, setActiveView: 2, close:()=>console.log('Send in a close function') };

export default Repay;
