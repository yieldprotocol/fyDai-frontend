import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Keyboard, TextInput, Text, ResponsiveContext, Collapsible } from 'grommet';

import { 
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { cleanValue } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
  
import { 
  usePool, 
  useMath,
  useSignerAccount, 
  useTxActive, 
  useProxy,
  useDebounce,
  useIsLol,
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
import Loading from '../components/Loading';
import SeriesMatureBox from '../components/SeriesMatureBox';

interface ILendProps {
  lendAmount?:any
}
  
const Lend = ({ lendAmount }:ILendProps) => {

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;

  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance, daiBalance_ } = userState.position;

  const screenSize = useContext(ResponsiveContext);

  const { previewPoolTx } = usePool();
  const { sellDai, sellActive } = useProxy();
  const { yieldAPR } = useMath();
  const { account, fallbackProvider } = useSignerAccount();
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
  const isLol = useIsLol(inputValue);

  const [ APR, setAPR ] = useState<number>();
  const [ eDaiValue, setEDaiValue ] = useState<number>(0);
  const [ currentValue, setCurrentValue ] = useState<string>();
  
  /* Lend execution flow */
  const lendProcedure = async () => {
    if (inputValue && !lendDisabled ) {
      setLendPending(true);
      await sellDai(
        activeSeries,
        inputValue
      );
      setInputValue(undefined);
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setLendPending(false);
    }  
  };

  /* Handle input (debounce input) changes */
  useEffect(() => {
    activeSeries && !(activeSeries?.isMature()) && !!debouncedInput && ( async () => {
      const preview = await previewPoolTx('sellDai', activeSeries, debouncedInput);
      if (!(preview instanceof Error)) {
        setEDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        setAPR( yieldAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) );      
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('sellDai', activeSeries, 1);
        !(rate instanceof Error) && setEDaiValue(debouncedInput*parseFloat((ethers.utils.formatEther(rate))));
        (rate instanceof Error) && setEDaiValue(0);
        setLendDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [activeSeries, debouncedInput]);

  /* handle active series loads and changes */
  useEffect(() => {
    fallbackProvider && account && activeSeries?.eDaiBalance_ && !(activeSeries?.isMature()) && ( async () => {
      const preview = await previewPoolTx('SellEDai', activeSeries, activeSeries.eDaiBalance_);
      !(preview instanceof Error) && setCurrentValue( ethers.utils.formatEther(preview));
    })();
  }, [ activeSeries, account, fallbackProvider ]);
  
  /* Lend button disabling logic */
  useEffect(()=>{
    (
      ( inputValue && daiBalance && ethers.utils.parseEther(inputValue).gt(daiBalance) ) ||
      !account ||
      !hasDelegated ||
      !inputValue || 
      parseFloat(inputValue) <= 0
    )? setLendDisabled(true): setLendDisabled(false);
  }, [ inputValue, hasDelegated]);

  /* handle exceptions, errors and warnings */
  useEffect(() => {
    if ( false ) {
      setWarningMsg(null);
      setErrorMsg('There is not enough liquidity to support a transaction of that size just yet.'); 
    } else if ( daiBalance && debouncedInput && ethers.utils.parseEther(debouncedInput).gt(daiBalance)  ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you have'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput, daiBalance ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> lendProcedure()}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
      target='document'
    >
      { withdrawDaiOpen && <WithdrawDai close={()=>setWithdrawDaiOpen(false)} /> }

      <SeriesDescriptor activeView='lend'>
        <InfoGrid 
          alt 
          entries={[
            {
              label: 'Portfolio Value at Maturity',
              visible: 
                  (!!account && !txActive && !activeSeries?.isMature()) || 
                  ( activeSeries?.isMature() && activeSeries?.eDaiBalance_>0),
              active: true,
              loading: lendPending,  
              value: activeSeries && `${activeSeries?.eDaiBalance_} DAI` || '-',
              valuePrefix: null,
              valueExtra: null,
            },
            {
              label: 'Current Value',
              visible: !!account && !txActive && !activeSeries?.isMature(),
              active: true,
              loading: lendPending || !currentValue,           
              value: currentValue?`${cleanValue(currentValue, 2)} DAI`: '- Dai',
              valuePrefix: null,
              valueExtra: null,
            },
            {
              label: 'Dai Balance',
              visible: 
                  (!!account && !txActive && !activeSeries?.isMature()) || 
                  (activeSeries?.isMature() && activeSeries?.eDaiBalance_>0),
              active: true,
              loading: lendPending,            
              value: daiBalance_?`${daiBalance_} DAI`: '0 DAI',
              valuePrefix: null,
              valueExtra: null,
            },
          ]}
        />
      </SeriesDescriptor>
   
      {/* If there is no applicable transaction active, show the lending page */}
      { !txActive &&
      <Box
        width={{ max:'600px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
        pad='large'
        gap='medium'
      >
        <Box flex='grow' gap='small' align='center' fill='horizontal'>
          {/* If the series has NOT matured, show the lending input */}
          {/* <Loading condition={seriesState.seriesLoading} size='large'> */}
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
                    onChange={(event:any) => setInputValue( cleanValue(event.target.value, 6) )}
                    icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                  />
                  {account &&
                  <RaisedButton 
                    label={screenSize !== 'small' ? 'Lend Maximum': 'Maximum'}
                    onClick={()=>setInputValue( ethers.utils.formatEther(daiBalance) )}
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
                  onClick={()=>lendProcedure()}
                  label={`Lend ${inputValue || ''} DAI`}
                  disabled={lendDisabled}
                  hasDelegatedPool={activeSeries.hasDelegatedPool}
                />       
              </Box>

              { activeSeries?.eDaiBalance_ > 0 &&
              <Box alignSelf='end' margin={{ top:'medium' }}>
                <FlatButton 
                  onClick={()=>setWithdrawDaiOpen(true)}
                  label={
                    <Box direction='row' gap='small' align='center'>
                      <Box><Text size='xsmall' color='text-weak'><Text weight='bold' color={activeSeries.seriesColor}>close</Text> your position in this series</Text></Box>
                      <ArrowRight color='text-weak' />
                    </Box>
                }
                />
              </Box>}
            </>}
          
          { activeSeries?.isMature() &&
            <SeriesMatureBox />}
            
          { !txActive && 
            !!account && 
            activeSeries?.isMature() && 
            activeSeries?.eDaiBalance?.gt(ethers.constants.Zero) && 
            <Redeem />}

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