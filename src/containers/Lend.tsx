import React, { useEffect, useState, useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { BigNumber, ethers } from 'ethers';
import { Box, Keyboard, TextInput, Text, ResponsiveContext, Collapsible, Layer } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';
import { VscHistory as HistoryIcon } from 'react-icons/vsc';

/* utils and support */
import { analyticsLogEvent, cleanValue, genTxCode } from '../utils';

/* contexts */
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
import { HistoryContext } from '../contexts/HistoryContext';
  
/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { usePool } from '../hooks/poolHook';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

/* containers */
import CloseDai from './CloseDai';
import Redeem from './Redeem';
import History from './History';

/* components */
import InputWrap from '../components/InputWrap';
import InfoGrid from '../components/InfoGrid';
import TxStatus from '../components/TxStatus';
import SeriesDescriptor from '../components/SeriesDescriptor';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import SeriesMatureBox from '../components/SeriesMatureBox';
import HistoryWrap from '../components/HistoryWrap';
import DaiMark from '../components/logos/DaiMark';
import RaisedBox from '../components/RaisedBox';
import YieldMobileNav from '../components/YieldMobileNav';
import Loading from '../components/Loading';


interface ILendProps {
  openConnectLayer:any;
}

const Lend = ({ openConnectLayer }:ILendProps) => {

  const { amnt }:any = useParams();
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  
  /* state from contexts */
  const { state: { seriesLoading, activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance, daiBalance_ } = userState.position;
  const { state: { historyLoading } } = useContext(HistoryContext);

  /* local state */ 
  const [ CloseDaiOpen, setCloseDaiOpen ] = useState<boolean>(false);
  const [ histOpen, setHistOpen ] = useState<boolean>(false);
  const [ inputRef, setInputRef ] = useState<any>(null);
  const [ lendDisabled, setLendDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const [ inputValue, setInputValue ] = useState<any>(amnt || undefined);

  const [ APR, setAPR ] = useState<string>();
  const [ fyDaiValue, setFYDaiValue ] = useState<number>(0);
  const [ currentValue, setCurrentValue ] = useState<string>();
  
  /* init hooks */ 
  const { previewPoolTx } = usePool();
  const { sellDai } = useBorrowProxy();
  const { calculateAPR, estTrade } = useMath();
  const { account, fallbackProvider } = useSignerAccount();
  const [ txActive ] = useTxActive(['SELL_DAI']);
  const [ closeTxActive ] = useTxActive(['BUY_DAI']);
  const [ hasDelegated ] = useState<boolean>(true);
  const debouncedInput = useDebounce(inputValue, 500);
  const isLol = useIsLol(inputValue);

  const [showTxPending, setShowTxPending] = useState<boolean>(false);
  useEffect(()=>{
    setShowTxPending( txActive?.txCode === genTxCode('SELL_DAI', activeSeries?.maturity.toString()));
  }, [txActive, activeSeries]);
  
  /* Lend execution flow */
  const lendProcedure = async () => {

    analyticsLogEvent(
      'sell_initiated', 
      {
        value: inputValue,
        series: activeSeries ? activeSeries.displayName : null,
        maturity: activeSeries ? activeSeries.maturity: null, 
        time_to_maturity: activeSeries ? (new Date().getTime()/1000) - activeSeries?.maturity : null,
        account: account?.substring(2),
      });

    if (inputValue && !lendDisabled ) {
      await sellDai( activeSeries, inputValue);

      /* clean up and refresh */ 
      setInputValue(undefined);
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateSeries([activeSeries]),
      ]);
    }  
  };

  /* Handle input changes */
  useEffect(() => {
  
    let preview: BigNumber | Error = ethers.constants.Zero;
    let _apr: Number;
    if (
      activeSeries && 
      !(activeSeries?.isMature()) && 
      !!inputValue
    ) { 
      preview = estTrade('sellDai', activeSeries, inputValue);
      if (!(preview instanceof Error)) {
        setFYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        _apr = calculateAPR( ethers.utils.parseEther(inputValue.toString()), preview, activeSeries?.maturity );
        setAPR( cleanValue(_apr.toString(), 2) );      
      } else {     
        setLendDisabled(true);
      }
    }
    
    /* handle exceptions, errors and warnings on input changes */
    const daiErrorTxt = 'That amount exceeds the amount of Dai you have';
    const PoolErrorTxt = 'The Pool doesn\'t have the liquidity to support a transaction of that size just yet.';
    
    if ( preview instanceof Error || _apr! === 0 ) {
      setWarningMsg(null);
      setErrorMsg(PoolErrorTxt);
    } else if ( 
      daiBalance &&
      inputValue &&
      ethers.utils.parseEther(inputValue).gt(daiBalance)
    ) {
      setWarningMsg(null);
      setErrorMsg(daiErrorTxt); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }

  }, [activeSeries, inputValue, daiBalance]);

  /* handle active series loads and changes */
  useEffect(() => {
    fallbackProvider && account && activeSeries?.fyDaiBalance_ && !(activeSeries?.isMature()) && ( async () => {
      const preview = estTrade('sellFYDai', activeSeries, activeSeries.fyDaiBalance_);
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
    ) ? setLendDisabled(true): setLendDisabled(false);
  }, [ inputValue, hasDelegated, daiBalance]);

  /* analytics input values  before submission */ 
  const analyticsInput = useDebounce(inputValue, 3500);
  useEffect(() => {
    analyticsLogEvent(
      'lend_input', 
      {
        value: analyticsInput,
        series: activeSeries ? activeSeries.displayName : null,
        maturity: activeSeries ? activeSeries.maturity: null, 
        time_to_maturity: activeSeries ? (new Date().getTime()/1000) - activeSeries?.maturity : null,
        account: account?.substring(2),
      });
  }, [analyticsInput] );

  return (
    <RaisedBox expand={!!seriesData}>
      <Keyboard 
        onEsc={() => setInputValue(undefined)}
        onEnter={()=> lendProcedure()}
        onBackspace={()=> {
          inputValue && 
          (document.activeElement !== inputRef) && 
          setInputValue(debouncedInput.toString().slice(0, -1));
        }}
        target='document'
      >
        { CloseDaiOpen && 
        <Layer onClickOutside={()=>setCloseDaiOpen(false)}>
          <CloseDai close={()=>setCloseDaiOpen(false)} />   
        </Layer>}

        { histOpen && 
        <HistoryWrap closeLayer={()=>setHistOpen(false)}>
          <History 
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
                  ( activeSeries?.isMature() && activeSeries?.fyDaiBalance_>0) ||
                  (!!account && !activeSeries?.isMature()),
                active: true,
                loading: false,  
                value: activeSeries? `${activeSeries?.fyDaiBalance_} DAI` : '-',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Current Value',
                labelExtra: 'if closing your position now',
                visible: !!account && !activeSeries?.isMature(),
                active: true,
                loading: false || !currentValue,           
                value: currentValue?`${cleanValue(currentValue, 2)} DAI`: '- Dai',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: null,
                labelExtra: null,
                visible: !!account && !activeSeries?.isMature(),
                active: true,
                loading: false,           
                value: null,
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Dai Balance',
                visible: false,
                active: true,
                loading: false,            
                value: daiBalance_?`${daiBalance_} DAI`: '0 DAI',
                valuePrefix: null,
                valueExtra: null,
              },
            ]}
          />
        </SeriesDescriptor>

        { 
          activeSeries?.isMature() &&
          <SeriesMatureBox />
        }
   
        {/* If there is no applicable transaction active, show the lending page */}
        { !showTxPending &&
        <Box
          width={{ max:'600px' }}
          alignSelf='center'
          fill='horizontal'
          background='background'
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
                <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                  <TextInput
                    ref={(el:any) => {el && !CloseDaiOpen && !mobile && el.focus(); setInputRef(el);}}
                    type="number"
                    placeholder={!mobile ? 'Enter the amount of Dai to lend': 'DAI'}
                    value={inputValue || ''}
                    plain
                    onChange={(event:any) => setInputValue( cleanValue(event.target.value, 6) )}
                    icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                  />
                  {account &&
                  <FlatButton
                    label={!mobile ? 'Lend Maximum': 'Maximum'}
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
                        value: APR?`${APR}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
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
                  hasPoolDelegatedProxy={activeSeries.hasPoolDelegatedProxy}
                  clearInput={()=>setInputValue(undefined)}
                  openConnectLayer={()=>openConnectLayer()}
                />       
              </Box>
            </>}
            
            { !txActive && 
            !!account && 
            activeSeries?.isMature() && 
            activeSeries?.fyDaiBalance?.gt(ethers.constants.Zero) &&
            <Redeem />}

            <Box direction='row' fill justify='between'>
              { 
                !activeSeries?.isMature() && 
                activeSeries?.fyDaiBalance_ > 0 &&
                !mobile &&
                <Box alignSelf='start' margin={{ top:'medium' }}>
                  <FlatButton 
                    onClick={()=>setHistOpen(true)}
                    disabled={historyLoading}
                    label={
                      <Box direction='row' gap='small' align='center'>
                        <Text size='xsmall' color='text-weak'><HistoryIcon /></Text>                
                        <Text size='xsmall' color='text-weak'>
                          Series Lend History
                        </Text>              
                      </Box>
                    }
                  />
                </Box>
              }
              { !activeSeries?.isMature() && 
                activeSeries?.fyDaiBalance_ > 0 &&
                !mobile &&
                <Box alignSelf='end' margin={{ top:'medium' }}>
                  { closeTxActive ?
                    <Box direction='row' gap='small'>
                      <Text size='xsmall' color='text-weak'>
                        <Text weight='bold' color={activeSeries?.seriesColor}>close</Text> pending
                      </Text>
                      <Loading condition={true} size='xxsmall'>.</Loading>
                    </Box>
                    : 
                    <FlatButton 
                      onClick={()=>setCloseDaiOpen(true)}
                      label={
                        <Box direction='row' gap='small' align='center'>
                          <Box><Text size='xsmall' color='text-weak'><Text weight='bold' color={activeSeries?.seriesColor}>close</Text> your position in this series</Text></Box>
                          <ArrowRight color='text-weak' />
                        </Box>
                        }
                    />}
                </Box>}
            </Box>

          </Box>
        </Box>}

        { showTxPending && <TxStatus tx={txActive} /> }
        
      </Keyboard>

      {mobile &&
      <YieldMobileNav>
        {!activeSeries?.isMature() && 
          activeSeries?.fyDaiBalance_ > 0 &&
          <NavLink 
            to={`/close/${activeSeries?.maturity}`}
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='small' align='center'>
              <Text size='xxsmall' color='text-weak'><Text weight='bold' size='xsmall' color={activeSeries?.seriesColor}>close </Text> your position</Text>
              <ArrowRight color={activeSeries?.seriesColor} />
            </Box>
          </NavLink>}
      </YieldMobileNav>}
        
    </RaisedBox>
  );
};

export default Lend;