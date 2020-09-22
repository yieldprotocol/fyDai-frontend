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
} from '../hooks';

import SeriesDescriptor from '../components/SeriesDescriptor';
import ApprovalPending from '../components/ApprovalPending';
import TxPending from '../components/TxPending';
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

  const [ repayPending, setRepayPending ] = useState<boolean>(false);
  const [ repayDisabled, setRepayDisabled ] = useState<boolean>(true);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const repayProcedure = async (value:number) => {
    if (!repayDisabled) {
      setRepayPending(true);
      /* repay using proxy */
      await repayDaiDebt(activeSeries, 'ETH-A', value);
      setInputValue('');
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setRepayPending(false);     
    }
  };

  /* Repay disabling logic */
  useEffect(()=>{
    (
      (daiBalance && daiBalance.eq(ethers.constants.Zero)) ||
      !account ||
      !hasDelegated ||
      !inputValue ||
      parseFloat(inputValue) === 0
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
    <Layer onClickOutside={()=>close()}>
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
                  <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to Repay</Text>

                  <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={repayDisabled}>
                    <TextInput
                      ref={(el:any) => {el && el.focus(); setInputRef(el);}} 
                      type="number"
                      placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to Repay': 'DAI'}
                      value={inputValue || ''}
                      plain
                      onChange={(event:any) => setInputValue(( cleanValue(event.target.value) ))}
                      icon={<DaiMark />}
                    />
                    <RaisedButton 
                      label={screenSize !== 'small' ? 'Repay Maximum': 'Maximum'}
                      onClick={()=>setInputValue(ethers.utils.formatEther(daiBalance))}
                    />
                  </InputWrap>

                  <ActionButton
                    onClick={()=>repayProcedure(inputValue)}
                    label={`Repay ${inputValue || ''} DAI`}
                    disabled={repayDisabled}
                  />

                  <Box alignSelf='start'>
                    <FlatButton 
                      onClick={()=>close()}
                      label={
                        <Box direction='row' gap='medium' align='center'>
                          <ArrowLeft color='text-weak' />
                          <Text size='xsmall' color='text-weak'> go back </Text>
                        </Box>}
                    />
                  </Box>
          
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

        { txActive && <TxPending msg={`You are repaying ${inputValue} DAI`} tx={txActive} /> }
      </Keyboard>
    </Layer>
  );
}

Repay.defaultProps = { repayAmount:null, setActiveView: 2, close:()=>console.log('Send in a close function') };

export default Repay;
