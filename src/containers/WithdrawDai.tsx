import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Layer, TextInput, Text, Keyboard, ResponsiveContext } from 'grommet';

import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { cleanValue } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { usePool, useProxy, useSignerAccount, useTxActive, useDebounce } from '../hooks';

import InputWrap from '../components/InputWrap';
import TxPending from '../components/TxPending';
import ApprovalPending from '../components/ApprovalPending';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

interface IWithDrawDaiProps {
  close?: any;
}

const WithdrawDai = ({ close }:IWithDrawDaiProps) => {

  const screenSize = useContext(ResponsiveContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries  } = seriesState;

  const [ txActive ] = useTxActive(['BUY_DAI']);

  const { actions: userActions } = useContext(UserContext);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const { previewPoolTx }  = usePool();
  const { buyDai, buyDaiNoSignature, buyActive }  = useProxy();
  const { account, fallbackProvider } = useSignerAccount();

  const [ inputValue, setInputValue ] = useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);

  const [ isGettingMax, setIsGettingMax ] = useState<boolean>(false);
  const [ maxWithdraw, setMaxWithdraw ] = useState<string>();
  
  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(true);
  const [ withdrawDaiPending, setWithdrawDaiPending] = useState<boolean>(false);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const withdrawProcedure = async () => {
    if ( !withdrawDisabled ) {
      setWithdrawDaiPending(true);
      await buyDai(
        activeSeries,
        inputValue,
      );
      userActions.updatePosition();
      seriesActions.updateActiveSeries();
      setWithdrawDaiPending(false);
      close();
    }
  };

  useEffect(()=> {
    fallbackProvider && account && activeSeries.eDaiBalance && (async () => {
      const preview = await previewPoolTx('sellEDai', activeSeries, activeSeries.eDaiBalance);
      if (!(preview instanceof Error)) {
        setMaxWithdraw(ethers.utils.formatEther(preview));
      }
    })();
  }, [account, activeSeries.eDaiBalance, fallbackProvider]);

  /* Withdraw DAi button disabling logic */
  useEffect(()=>{
    (
      !account ||
      !hasDelegated ||
      !inputValue || 
      parseFloat(inputValue) === 0
    ) ? setWithdrawDisabled(true): setWithdrawDisabled(false);
  }, [ inputValue, hasDelegated ]);


  /* show warnings and errors with collateralisation ratio levels and inputs */
  useEffect(()=>{
    if ( debouncedInput && maxWithdraw && (debouncedInput > maxWithdraw) ) {
      setWarningMsg(null);
      setErrorMsg('You are not allowed to reclaim more than you have lent'); 
    } else {   
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput ]);

  return (
    <Layer onClickOutside={()=>close()}>
      <Keyboard 
        onEsc={() => { inputValue? setInputValue(undefined): close();}}
        onEnter={()=> withdrawProcedure()}
        onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
        target='document'
      >
        { !txActive && !withdrawDaiPending && 
        <Box 
          width={screenSize!=='small'?{ min:'600px', max:'600px' }: undefined}
          alignSelf='center'
          fill
          background='background-front'
          round='small'
          pad='large'
          gap='medium'
        >
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to close</Text>
          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={withdrawDisabled}>
            <TextInput
              ref={(el:any) => {el && el.focus(); setInputRef(el);}} 
              type="number"
              placeholder='DAI'
              value={inputValue || ''}
              plain
              onChange={(event:any) => setInputValue(( cleanValue(event.target.value) ))}
              icon={<DaiMark />}
            />
            <RaisedButton 
              label='Maximum'
              onClick={()=> setInputValue(maxWithdraw)}
            />
          </InputWrap>

          <ActionButton
            onClick={()=> withdrawProcedure()}
            label={`Reclaim ${inputValue || ''} Dai`}
            disabled={withdrawDisabled}
          />
          
          <Box alignSelf='start'>
            <FlatButton 
              onClick={()=>close()}
              label={
                <Box direction='row' gap='medium' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Text size='xsmall' color='text-weak'> go back </Text>
                </Box>
                }
            />
          </Box>
        </Box>}

        { withdrawDaiPending && !txActive && <ApprovalPending /> }

        { txActive && 
          <Box 
            width={{ max:'600px' }}
            alignSelf='center'
            fill
            background='background-front'
            round='small'
            pad='large'
            gap='medium'
            justify='between'
          > 
            <TxPending msg={`You are withdrawing ${inputValue} ETH`} tx={txActive} />
                
            <Box alignSelf='start'>
              <Box
                round
                onClick={()=>close()}
                hoverIndicator='brand-transparent'
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Box direction='row' gap='small' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Text size='xsmall' color='text-weak'> { !withdrawDaiPending? 'cancel, and go back.': 'go back'}  </Text>
                </Box>
              </Box>
            </Box>
          </Box>}
      </Keyboard>
    </Layer>
  );
};

WithdrawDai.defaultProps={ close:null };

export default WithdrawDai;
