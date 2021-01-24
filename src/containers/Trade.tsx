import React, { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber } from 'ethers';
import { Box, Keyboard, TextInput, Select, Text, ResponsiveContext, Collapsible, Layer } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';
import { VscHistory as History } from 'react-icons/vsc';

import { NavLink, useParams } from 'react-router-dom';
import { cleanValue, genTxCode } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
  
/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { usePool } from '../hooks/poolHook';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

import CloseDai from './CloseDai';
import Redeem from './Redeem';

import InputWrap from '../components/InputWrap';
import InfoGrid from '../components/InfoGrid';
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
import Loading from '../components/Loading';

import { logEvent } from '../utils/analytics';

interface ILendProps {
  openConnectLayer:any;
}

const Trade = ({ openConnectLayer }:ILendProps) => {

  const { amnt }:any = useParams();
  
  const { state: { seriesLoading, activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);

  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance, daiBalance_ } = userState.position;

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const { previewPoolTx } = usePool();
  const { sellDai } = useBorrowProxy();
  const { buyDai } = useBorrowProxy();
  const { sellFYDai } = useBorrowProxy();
  const { buyFYDai } = useBorrowProxy();
  const { calcAPR } = useMath();
  const { account, fallbackProvider } = useSignerAccount();
  const [ txActive ] = useTxActive(['SELL_DAI']);

  const [ closeTxActive ] = useTxActive(['BUY_DAI']);



  const [ hasDelegated ] = useState<boolean>(true);

  const [ CloseDaiOpen, setCloseDaiOpen ] = useState<boolean>(false);
  const [ histOpen, setHistOpen ] = useState<boolean>(false);
  
  const [showTxPending, setShowTxPending] = useState<boolean>(false);
  useEffect(()=>{
    setShowTxPending( txActive?.txCode === genTxCode('SELL_DAI', activeSeries));
  }, [txActive, activeSeries]);
  
  const [ inputValue, setInputValue ] = useState<any>(amnt || undefined);
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);
  
  const [ lendDisabled, setLendDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const isLol = useIsLol(inputValue);

  const [ APR, setAPR ] = useState<number>(0);
  const [ spotAPR, setSpotAPR ] = useState<number>(0);  
  const [ fyDaiValue, setFYDaiValue ] = useState<number>(0);
  const [ minFYDaiOut, setMinFYDaiOut ] = useState<number>(0);
  const [ maxFYDaiIn, setMaxFYDaiIn ] = useState<number>(0);
  const [ minDaiOut, setMinDaiOut ] = useState<number>(0);
  const [ maxDaiIn, setMaxDaiIn ] = useState<number>(0);
  const [ currentValue, setCurrentValue ] = useState<string>();
  const [ fromToken, setFromToken ] = useState<string>("DAI");
  const [ toToken, setToToken ] = useState<string>("fyDAI");
  const [ fromQuantity, setFromQuantity ] = useState<number>(0);
  const [ toQuantity, setToQuantity ] = useState<number>(0);
  const [ inputFromQuantity, setInputFromQuantity ] = useState<boolean>(true);
  const [ priceImpact, setPriceImpact ] = useState<number>(0);
  const [ tradeType, setTradeType ] = useState<string>("");
  let trade: string = "";

  /* Lend execution flow */
  const tradeProcedure = async () => {
    if (inputValue && !lendDisabled ) {
      switch(tradeType) {
        case "sellDai":
        await sellDai( activeSeries, inputValue);
        break;
        case "buyDai":
        await buyDai( activeSeries, inputValue);
        break;
        case "sellFYDai":
        await sellFYDai( activeSeries, inputValue);
        break;
        case "buyFYDai":
          await buyFYDai( activeSeries, inputValue);
          break;
  
      }

      setInputValue(undefined);
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateActiveSeries()
      ]);
    }  
  };

  function roundTo(num: number, precision: number) {
    var factor = Math.pow(10, precision);
    var tempNumber = num * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

  /* Handle input (debounce input) changes */
  useEffect(() => {
    if (inputFromQuantity && fromToken === "DAI") {
      console.log("hit sellDai")
      trade = "sellDai";
      setFromQuantity( debouncedInput );
      if (!debouncedInput) {
        setToQuantity(0);
      } ;
    }
    if (!inputFromQuantity && toToken === "DAI") {
      console.log("hit buyDai")
      trade = "buyDai";
      setToQuantity( debouncedInput );
      if (!debouncedInput) {
        setFromQuantity(0);
      } ;
    }
    setTradeType ( trade );

    console.log("fromToken: ", fromToken);
    console.log("toToken: ", toToken);
    console.log("debouncedInput: ", debouncedInput);
    console.log("inputFromQuantity: ", inputFromQuantity);
    console.log("trade: ", trade);

    activeSeries && !(activeSeries?.isMature()) &&  !!debouncedInput &&  ( async () => {
    const preview = await previewPoolTx(trade, activeSeries, debouncedInput);
    const spotPreview = await previewPoolTx(trade, activeSeries, 1);
      if (!(preview instanceof Error) && !(spotPreview instanceof Error)) {
        switch(trade) {
          case "sellDai":
            console.log("preview: ", roundTo(parseFloat(ethers.utils.formatEther(preview)), 3))
            setToQuantity(roundTo(parseFloat(ethers.utils.formatEther(preview)), 3))
            setAPR( calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) );                  
            setPriceImpact(( calcAPR( ethers.utils.parseEther("1"), spotPreview, activeSeries?.maturity ) ) - ( calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) ))   
            console.log("APR: ", calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ))
            console.log("priceImpact: ", ( calcAPR( ethers.utils.parseEther("1"), spotPreview, activeSeries?.maturity ) ) - ( calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) ) )
            break;
          case "buyDai":
            console.log("preview: ", roundTo(parseFloat(ethers.utils.formatEther(preview)), 3))
            setFromQuantity(roundTo(parseFloat(ethers.utils.formatEther(preview)), 3))
            setAPR( calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) );                  
            setPriceImpact(( calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) ) - ( calcAPR( ethers.utils.parseEther("1"), spotPreview, activeSeries?.maturity ) ))   
             console.log("APR: ", calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ))
            console.log("priceImpact: ", ( calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries?.maturity ) ) - ( calcAPR( ethers.utils.parseEther("1"), spotPreview, activeSeries?.maturity ) )  )
            break;
          case "sellFYDai":
            setMinDaiOut(parseFloat(ethers.utils.formatEther(preview)));
            console.log("setMinFYDaiOut: ", setMinFYDaiOut)
            break;
          case "buyFYDai":
            setMaxDaiIn(parseFloat(ethers.utils.formatEther(preview)));
            console.log("MaxDaiIn: ", setMaxDaiIn)
            break;
        }
              
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('sellDai', activeSeries, 1);
        !(rate instanceof Error) && setFYDaiValue(debouncedInput*parseFloat((ethers.utils.formatEther(rate))));
        (rate instanceof Error) && setFYDaiValue(0);
        setLendDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [activeSeries, debouncedInput, inputValue]);

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
    if ( daiBalance && debouncedInput && ethers.utils.parseEther(debouncedInput).gt(daiBalance)  ) {
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
        onEnter={()=> tradeProcedure()}
        onBackspace={()=> {
          inputValue && 
          (document.activeElement !== inputRef) && 
          setInputValue(debouncedInput.toString().slice(0, -1));
          if (inputValue.length === 0) {
            setInputValue(0);
            setToQuantity(0);
            setFromQuantity(0);
          } 
        }}
        target='document'
      >
        { CloseDaiOpen && 
        <Layer onClickOutside={()=>setCloseDaiOpen(false)}>
          <CloseDai close={()=>setCloseDaiOpen(false)} />   
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
                label: 'Dai Balance',
                labelExtra: 'in your wallet',
                visible: true,
                active: true,
                loading: false,            
                value: daiBalance_?`${daiBalance_} DAI`: '0 DAI',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'fyDai Balance',
                labelExtra: 'current series',
                visible: !!account && !activeSeries?.isMature(),
                active: true,
                loading: false || !currentValue,           
                value: currentValue?`${cleanValue(currentValue, 2)} DAI`: '- Dai',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'fyDai Value at Maturity',
                labelExtra: 'current series',
                visible: 
                  (!!account && !activeSeries?.isMature()) || 
                  ( activeSeries?.isMature() && activeSeries?.fyDaiBalance_>0),
                active: true,
                loading: false,  
                value: activeSeries? `${activeSeries?.fyDaiBalance_} DAI` : '-',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'To fyDai',
                labelExtra: 'minimum you will receive',
                visible: true,
                active: true,
                loading: false,            
                value: minFYDaiOut?`${minFYDaiOut.toFixed(2)} `: '0',
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

            ]}
          />
        </SeriesDescriptor>
   
        {/* If there is no applicable transaction active, show the trading page */}
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
            {/* If the series has NOT matured, show the trading input */}
            { !activeSeries?.isMature() && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
            <>
              <Box fill gap='medium'>
                <Text alignSelf='start' size='large' color='text' weight='bold'>From</Text>
                <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                    <TextInput
                      /* ref={(el:any) => {el && !CloseDaiOpen && !mobile && el.focus(); setInputRef(el);}} */
                      type="number"
                      placeholder={!mobile ? '0': '0'}
                      value={fromQuantity || ""}
                      plain
                      onChange={(event:any) => 
                        { 
                          setInputValue( cleanValue(event.target.value, 6) );
                          setInputFromQuantity(true);
                        }
                      }
                    />
                    <Select
                      options={['DAI', 'fyDAI']}
                      placeholder='DAI'
                      value={fromToken}
                      onChange={({ option }) => 
                        {
                          if (option === "DAI") {
                            setFromToken("DAI");
                            setToToken("fyDAI");
                            setInputValue(0);
                            setFromQuantity(0);
                            setToQuantity(0);
                            } if (option === "fyDAI") {
                            setFromToken("fyDAI");
                            setToToken("DAI");
                            setInputValue(0);
                            setFromQuantity(0);
                            setToQuantity(0);
                            }
                        }
                      }                      
                    />
                </InputWrap>
                <Text alignSelf='start' size='large' color='text' weight='bold'>To</Text>
                <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                  <TextInput
                        type="number"
                        value={toQuantity || ''}
                        plain
                        placeholder={!mobile ? '0': '0'}
                        onChange={(event:any) => 
                          { 
                            setInputValue( cleanValue(event.target.value, 6) );
                            setInputFromQuantity(false);
                          }
                        }
                      />
                  <Select
                    options={['DAI', 'fyDAI']}
                    placeholder='fyDAI'
                    value={toToken}
                    onChange={({ option }) => 
                      {
                        if (option === "DAI") {
                          setFromToken("fyDAI");
                          setToToken("DAI");
                          setInputValue(0);
                          setFromQuantity(0);
                          setToQuantity(0);
                        } if (option === "fyDAI") {
                          setFromToken("DAI");
                          setToToken("fyDAI");
                          setInputValue(0);
                          setFromQuantity(0);
                          setToQuantity(0);
                      }
                      }
                    }
                  />
              </InputWrap>



                <Box fill>
                  <Collapsible open={!!inputValue&&inputValue>0}>
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
                        label: 'Price Impact',
                        visible: true,
                        active: inputValue,
                        loading: false,           
                        value: `${priceImpact.toFixed(3)}%`,
                         valuePrefix: null,
                        valueExtra: null,
                      },
                      {
                        label: 'Liquidity Provider Fee',
                        visible: true,
                        active: inputValue,
                        loading: false,            
                        value: `${0} Dai`,
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
                  onClick={()=>tradeProcedure()}
                  label={`Swap`}
                  disabled={lendDisabled}
                  hasPoolDelegatedProxy={activeSeries.hasPoolDelegatedProxy}
                  clearInput={()=>setInputValue(undefined)}
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

export default Trade;