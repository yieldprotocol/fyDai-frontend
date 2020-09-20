import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Keyboard, TextInput, Text, ResponsiveContext, Collapsible } from 'grommet';

import { 
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
  
import { 
  usePool, 
  useMath,
  useSignerAccount, 
  useTxActive, 
  useProxy,
  useDebounce,
} from '../hooks';

import WithdrawDai from './WithdrawDai';
import Redeem from './Redeem';

import InputWrap from '../components/InputWrap';
import InfoGrid from '../components/InfoGrid';
import ApprovalPending from '../components/ApprovalPending';
import TxPending from '../components/TxPending';
import SeriesDescriptor from '../components/SeriesDescriptor';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

interface ILendProps {
  lendAmount?:any
}
  
const Lend = ({ lendAmount }:ILendProps) => {
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;

  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance_ } = userState.position;

  const screenSize = useContext(ResponsiveContext);

  const { previewPoolTx } = usePool();
  const { sellDai, sellActive } = useProxy();
  const { yieldAPR } = useMath();
  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['SELL_DAI']);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const [ withdrawDaiOpen, setWithdrawDaiOpen ] = useState<boolean>(false);
  
  const [ inputValue, setInputValue ] = useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);
  
  const [ lendDisabled, setLendDisabled ] = useState<boolean>(true);
  const [ lendPending, setLendPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const [ APR, setAPR ] = useState<number>();
  const [ eDaiValue, setEDaiValue ] = useState<number>(0);
  const [ currentValue, setCurrentValue ] = useState<number>(0);
  
  /* Lend execution flow */
  const lendProcedure = async (value:number) => {
    if (!lendDisabled ) {
      setLendPending(true);
      await sellDai(
        activeSeries,
        value
      );
      setInputValue('');
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setLendPending(false);
    }  
  };

  /* Handle input (debounce input) changes */
  useEffect(() => {
    activeSeries && !(activeSeries.isMature()) && !!debouncedInput && ( async () => {
      const preview = await previewPoolTx('sellDai', activeSeries, debouncedInput);
      !(preview instanceof Error) && setEDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
      !(preview instanceof Error) && setAPR( yieldAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries.maturity ) );
    })();
  }, [activeSeries, debouncedInput]);

  /* handle active series loads and changes */
  useEffect(() => {
    account && activeSeries?.eDaiBalance_ && !(activeSeries.isMature()) && ( async () => {
      const preview = await previewPoolTx('SellEDai', activeSeries, activeSeries.eDaiBalance_);
      !(preview instanceof Error) && setCurrentValue( parseFloat(ethers.utils.formatEther(preview)));
    })();
  }, [ activeSeries, account ]);
  
  /* Lend button disabling logic */
  useEffect(()=>{
    (
      inputValue > daiBalance_ ||
      !account ||
      !hasDelegated ||
      !inputValue || 
      parseFloat(inputValue) === 0
    )? setLendDisabled(true): setLendDisabled(false);
  }, [ inputValue, hasDelegated ]);


  /* handle exceptions, errors and warnings */
  useEffect(() => {
    if ( !!account && debouncedInput && debouncedInput> daiBalance_  ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you have'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> lendProcedure(inputValue)}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
      target='document'
    >
      { withdrawDaiOpen && <WithdrawDai close={()=>setWithdrawDaiOpen(false)} /> }

      <Collapsible open={!!activeSeries}> 
        <SeriesDescriptor activeView='lend'>
          <InfoGrid 
            alt 
            entries={[
              {
                label: 'Portfolio Value at Maturity',
                visible: !!account && !txActive,
                active: true,
                loading: lendPending,     
                value: activeSeries && `${activeSeries?.eDaiBalance_.toFixed(2)} DAI` || '-',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Current Value',
                visible: false && !!account && !txActive,
                active: true,
                loading: lendPending,           
                value: currentValue!==0?`${currentValue.toFixed(2)} DAI`: '-',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Dai balance',
                visible: !!account && !txActive,
                active: true,
                loading: lendPending,            
                value: daiBalance_?`${daiBalance_.toFixed(2)} DAI`: '0 DAI',
                valuePrefix: null,
                valueExtra: null,
              },
            ]}
          />
        </SeriesDescriptor>
      </Collapsible>
      
      {/* If there is no applicable transaction active, show the lending page */}
      { !txActive &&
      <Box
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
        pad='large'
        gap='medium'
      >
        <Box flex='grow' gap='small' align='center' fill='horizontal'>
          {/* If the series has NOT matured, show the lending input */}

          { !activeSeries?.isMature() && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
          <>
            <Box fill gap='medium'>
              <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to lend</Text>
              <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={lendDisabled}>
                <TextInput
                  ref={(el:any) => {el && !withdrawDaiOpen && el.focus(); setInputRef(el);}}
                  type="number"
                  placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to lend': 'DAI'}
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
                  icon={<DaiMark />}
                />
                {account &&
                <RaisedButton 
                  label={screenSize !== 'small' ? 'Lend Maximum': 'Maximum'}
                  onClick={()=>setInputValue(daiBalance_)}                  
                />}
              </InputWrap>

              <InfoGrid entries={[
                {
                  label: 'Estimated APR',
                  visible: true,
                  active: inputValue,
                  loading: false,     
                  value: APR?`${APR.toFixed(2)}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                  valuePrefix: null,
                  valueExtra: null, 
                },
                {
                  label: 'Approx. Dai received at maturity',
                  visible: true,
                  active: inputValue,
                  loading: false,           
                  value: `${eDaiValue.toFixed(2)} DAI`,
                  valuePrefix: null,
                  valueExtra: null,
                //   valueExtra: () => (
                //   <Text size='xxsmall'>
                //     {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                //   </Text>
                // ),
                },
                {
                  label: 'Like what you see?',
                  visible: !account && inputValue>0,
                  active: inputValue,
                  loading: false,            
                  value: '',
                  valuePrefix: null,
                  valueExtra: () => (
                    <RaisedButton
                      label={<Text size='small'>Connect a wallet</Text>}
                      onClick={()=>console.log('still to implement')}
                    /> 
                  )
                },
              ]}
              />
            </Box>

            <Box gap='small' fill='horizontal' align='center' pad={{ vertical:'small' }}>
              <ActionButton
                onClick={()=>lendProcedure(inputValue)}
                label={`Lend ${inputValue || ''} DAI`}
                disabled={lendDisabled}
              />       
            </Box>

            { activeSeries?.eDaiBalance_ > 0 &&

            <Box alignSelf='end'>

              <FlatButton 
                onClick={()=>setWithdrawDaiOpen(true)}
                label={
                  <Box direction='row' gap='small' align='center'>
                    <Box><Text size='xsmall' color='text-weak'>alternatively, close your position in this series</Text></Box>
                    <ArrowRight color='text-weak' />
                  </Box>
                }
              />
            </Box>}

          </>}

          {/* If the series is mature show the redeem view */}
          { (activeSeries?.isMature()) &&
          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Redeem />
          </Box>}
        </Box>
      </Box>}

      {/* If there is a transaction active, show the applicable view */}
      { sellActive && !txActive && <ApprovalPending /> } 
      { txActive && <TxPending msg={`You are lending ${inputValue} DAI`} tx={txActive} /> }
    </Keyboard>
  );
};

Lend.defaultProps={ lendAmount:null };

export default Lend;