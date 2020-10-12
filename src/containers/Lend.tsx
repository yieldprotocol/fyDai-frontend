import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { Box, Keyboard, TextInput, Text, ResponsiveContext, Collapsible, Layer } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';
import { VscHistory as History } from 'react-icons/vsc';

import { useParams } from 'react-router-dom';
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
import TxStatus from '../components/TxStatus';
import SeriesDescriptor from '../components/SeriesDescriptor';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import SeriesMatureBox from '../components/SeriesMatureBox';
import TxHistory from '../components/TxHistory';
import HistoryWrap from '../components/HistoryWrap';

import DaiMark from '../components/logos/DaiMark';
import RaisedBox from '../components/RaisedBox';
import YieldMobileNav from '../components/YieldMobileNav';

interface ILendProps {
  openConnectLayer:any;
}

const Lend = ({ openConnectLayer }:ILendProps) => {

  const { amnt }:any = useParams();
  
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

  const [ hasDelegated ] = useState<boolean>(true);

  const [ withdrawDaiOpen, setWithdrawDaiOpen ] = useState<boolean>(false);
  const [ histOpen, setHistOpen ] = useState<boolean>(false);
  
  const [ inputValue, setInputValue ] = useState<any>(amnt || undefined);
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);
  
  const [ lendDisabled, setLendDisabled ] = useState<boolean>(true);
  const [ lendPending, setLendPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const isLol = useIsLol(inputValue);

  const [ APR, setAPR ] = useState<number>();
  const [ fyDaiValue, setFYDaiValue ] = useState<number>(0);
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
      userActions.updateHistory();
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
        setFYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        setAPR( yieldAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) );      
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('sellDai', activeSeries, 1);
        !(rate instanceof Error) && setFYDaiValue(debouncedInput*parseFloat((ethers.utils.formatEther(rate))));
        (rate instanceof Error) && setFYDaiValue(0);
        setLendDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [activeSeries, debouncedInput]);

  /* handle active series loads and changes */
  useEffect(() => {
    fallbackProvider && account && activeSeries?.fyDaiBalance_ && !(activeSeries?.isMature()) && ( async () => {
      const preview = await previewPoolTx('SellFYDai', activeSeries, activeSeries.fyDaiBalance_);
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
    <RaisedBox>
      <Keyboard 
        onEsc={() => setInputValue(undefined)}
        onEnter={()=> lendProcedure()}
        onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
        target='document'
      >
        { withdrawDaiOpen && 
        <Layer onClickOutside={()=>setWithdrawDaiOpen(false)}>
          <WithdrawDai close={()=>setWithdrawDaiOpen(false)} />   
        </Layer>}

        { histOpen && 
        <HistoryWrap closeLayer={()=>setHistOpen(false)}>
          <TxHistory 
            filterTerms={['Lent', 'Closed']}
            series={activeSeries}
          />
        </HistoryWrap>}

        <SeriesDescriptor activeView='lend'>
          <InfoGrid 
            alt 
            entries={[
              {
                label: 'Portfolio Value',
                labelExtra: 'at maturity',
                visible: 
                  (!!account && !txActive && !activeSeries?.isMature()) || 
                  ( activeSeries?.isMature() && activeSeries?.fyDaiBalance_>0),
                active: true,
                loading: lendPending,  
                value: activeSeries && `${activeSeries?.fyDaiBalance_} DAI` || '-',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Current Value',
                labelExtra: 'if closing your position now',
                visible: !!account && !txActive && !activeSeries?.isMature(),
                active: true,
                loading: lendPending || !currentValue,           
                value: currentValue?`${cleanValue(currentValue, 2)} DAI`: '- Dai',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: null,
                labelExtra: null,
                visible: !!account && !txActive && !activeSeries?.isMature(),
                active: true,
                loading: false,           
                value: null,
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Dai Balance',
                visible: 
                  false &&
                  (!!account && !txActive && !activeSeries?.isMature()) || 
                  (activeSeries?.isMature() && activeSeries?.fyDaiBalance_>0),
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
            { !activeSeries?.isMature() && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
            <>
              <Box fill gap='medium'>
                <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to lend</Text>
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
                    onClick={()=>setInputValue( cleanValue(ethers.utils.formatEther(daiBalance), 6) )}
                  />}
                </InputWrap>

                <Box fill>
                  <Collapsible open={!!inputValue&&inputValue>0}>
                    <InfoGrid entries={[
                      {
                        label: 'Estimated APR',
                        labelExtra: `if lending ${inputValue && cleanValue(inputValue, 2)} Dai`,
                        visible: true,
                        active: inputValue,
                        loading: false,     
                        value: APR?`${APR.toFixed(2)}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                        valuePrefix: null,
                        valueExtra: null, 
                      },
                      {
                        label: 'Dai received',
                        labelExtra: 'at maturity',
                        visible: true,
                        active: inputValue,
                        loading: false,           
                        value: `${fyDaiValue.toFixed(2)} DAI`,
                        valuePrefix: null,
                        valueExtra: null,
                      },
                      {
                        label: 'Like what you see?',
                        visible: !account && inputValue>0,
                        active: inputValue,
                        loading: false,            
                        value: '',
                        valuePrefix: null,
                        valueExtra: () => (
                          <Box pad={{ top:'small' }}>
                            <RaisedButton
                              label={<Box pad='xsmall'><Text size='xsmall' color='brand'>Connect a wallet</Text></Box>}
                              onClick={() => openConnectLayer()}
                            /> 
                          </Box>
                        )
                      },
                    ]}
                    />
                  </Collapsible>
                </Box>
              </Box>
              
              <Box gap='small' fill='horizontal' align='center' pad={{ vertical:'small' }}>
                <ActionButton
                  onClick={()=>lendProcedure()}
                  label={`Lend ${inputValue || ''} DAI`}
                  disabled={lendDisabled}
                  hasDelegatedPool={activeSeries.hasDelegatedPool}
                />       
              </Box>
            </>}
          
            { activeSeries?.isMature() &&
            <SeriesMatureBox />}
            
            { !txActive && 
            !!account && 
            activeSeries?.isMature() && 
            activeSeries?.fyDaiBalance?.gt(ethers.constants.Zero) && 
            <Redeem />}

            <Box direction='row' fill justify='between'>
              { activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) && 
                screenSize !== 'small' &&
                <Box alignSelf='start' margin={{ top:'medium' }}>
                  <FlatButton 
                    onClick={()=>setHistOpen(true)}
                    label={
                      <Box direction='row' gap='small' align='center'>
                        <Text size='xsmall' color='text-xweak'><History /></Text>                
                        <Text size='xsmall' color='text-xweak'>
                          Series Lend History
                        </Text>              
                      </Box>
                    }
                  />
                </Box>}

              { !activeSeries?.isMature() && 
                activeSeries?.fyDaiBalance_ > 0 &&
                screenSize !== 'small' &&
                <Box alignSelf='end' margin={{ top:'medium' }}>
                  <FlatButton 
                    onClick={()=>setWithdrawDaiOpen(true)}
                    label={
                      <Box direction='row' gap='small' align='center'>
                        <Box><Text size='xsmall' color='text-weak'><Text weight='bold' color={activeSeries?.seriesColor}>close</Text> your position in this series</Text></Box>
                        <ArrowRight color='text-weak' />
                      </Box>
                    }
                  />
                </Box>}
            </Box>

          </Box>
        </Box>}

        {/* If there is a transaction active, show the applicable view */}
        { sellActive && !txActive && <ApprovalPending /> }
        { txActive && <TxStatus msg={`You are lending ${inputValue} DAI`} tx={txActive} /> }
      </Keyboard>

      {screenSize === 'small' &&
       !activeSeries?.isMature() && 
       activeSeries?.fyDaiBalance_ > 0 &&
       <YieldMobileNav>
         <Box onClick={()=>setWithdrawDaiOpen(true)}>
           <Box direction='row' gap='small' align='center'>
             <Box>
               <Text size='xxsmall' color='text-weak'>
                 <Text weight='bold' size='xsmall' color={activeSeries?.seriesColor}>close </Text> 
                 your position
               </Text>
             </Box>
             <ArrowRight color='text-weak' />
           </Box>
         </Box>
       </YieldMobileNav>}
        
    </RaisedBox>
  );
};

export default Lend;