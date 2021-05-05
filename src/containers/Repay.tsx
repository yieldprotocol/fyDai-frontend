import React, { useEffect, useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { Box, TextInput, Text, ResponsiveContext, Keyboard, Collapsible } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiArrowLeft as ArrowLeft
} from 'react-icons/fi';

import { cleanValue, analyticsLogEvent, ONE } from '../utils';
import { IYieldSeries } from '../types';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';
import { useRollProxy } from '../hooks/rollProxyHook';
import { usePool } from '../hooks/poolHook';
import { useUSDCProxy } from '../hooks/USDCProxyHook';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

import DaiMark from '../components/logos/DaiMark';
import YieldMobileNav from '../components/YieldMobileNav';

import SeriesDescriptor from '../components/SeriesDescriptor';
import StickyButton from '../components/StickyButton';
import Selector from '../components/Selector';
import USDCMark from '../components/logos/USDCMark';
import AprBadge from '../components/AprBadge';
import { psmUSDCOut } from '../utils/yieldMath';

interface IRepayProps {
  close?:any;
}

function Repay({ close }:IRepayProps) {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  /* state from context */
  const { state: { activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance, usdcBalance, usdcBalanceWad } = userState.position;

  /* local state */
  const [ inputValue, setInputValue ] = useState<any>();
  const [ inputRef, setInputRef ] = useState<any>(null);
  const [ isRollDebt, setIsRollDebt ] = useState<boolean>(false);
  const [ currency, setCurrency ] = useState<string>('DAI');
  const [ repayDisabled, setRepayDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const [ seriesArr, setSeriesArr ] = useState<IYieldSeries[]>([]);
  const [ destinationSeries, setDestinationSeries ] = useState<IYieldSeries>();
  const [ debtInDestinationSeries, setDebtDestinationSeries ] = useState<string>();
  
  const [ maxRepay, setMaxRepay ] = useState<any>();
  const [ maxRoll, setMaxRoll ] = useState<any>();
  const [ USDCValueInDai, setUSDCValueInDai ] = useState<string| undefined>(undefined);

  /* init hooks */
  const { repayDaiDebt } = useBorrowProxy();
  const { rollDebt } = useRollProxy();
  const { repayUSDCDebt, checkPsm } = useUSDCProxy();
  const { previewPoolTx }  = usePool();
  const [ txActive ] = useTxActive(['REPAY', 'ROLL_DEBT']);
  const { account } = useSignerAccount();
  const debouncedInput = useDebounce(inputValue, 500);

  const repayProcedure = async (value:number) => {
    if (!repayDisabled) {

      analyticsLogEvent(
        'Repay_initiated', 
        {
          value: inputValue,
          series: activeSeries ? activeSeries.displayName : null,
          maturity: activeSeries ? activeSeries.maturity: null, 
          time_to_maturity: activeSeries ? (new Date().getTime()/1000) - activeSeries?.maturity : null,
          account: account?.substring(2),
        });

      !activeSeries?.isMature() && close();
      /* repay using proxy */
      currency === 'DAI' && await repayDaiDebt(activeSeries, 'ETH-A', value);
      currency === 'USDC' && await repayUSDCDebt(activeSeries, 'ETH-A', value);
      
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

      try {
        analyticsLogEvent(
          'Roll_initiated', 
          {
            value: inputValue,
            series: activeSeries ? activeSeries.displayName : null,
            maturity: activeSeries ? activeSeries.maturity: null, 
            time_to_maturity: activeSeries ? (new Date().getTime()/1000) - activeSeries?.maturity : null,
            account: account?.substring(2),
          });
      } catch (e) {
        console.log('Analytics error');
      }

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

  /* Calculate the USDC/DAI rate on input change */
  useEffect(() => {
    activeSeries && currency === 'USDC' &&  debouncedInput>0 && ( async () => {

      const tin =  await checkPsm('tin'); // sell = xtin :  buy = xtout
      const amnt = ethers.utils.parseEther(debouncedInput.toString());
      const fee = amnt.mul(tin).div(ONE);
      const daiAmnt = amnt.sub(fee); // sell = sub : buy = add
      
      setUSDCValueInDai(cleanValue(ethers.utils.formatEther(daiAmnt.toString()), 2));
    })();
  }, [ currency, debouncedInput, activeSeries]);

    
  /* set the maximums available to repay in DAI and USDC */
  useEffect(()=>{

    /* If Dai in wallet greater than debt, then set the max value to the debt amount , else the wallet amount */
    if ( currency === 'DAI' && activeSeries?.ethDebtDai && !isRollDebt ) {
        daiBalance?.gt(activeSeries?.ethDebtDai) ? 
          setMaxRepay(activeSeries.ethDebtDai.add(ethers.BigNumber.from('1000000000000') )):
          setMaxRepay(daiBalance);
    }

    if ( currency === 'DAI' && activeSeries?.ethDebtDai) {
      setMaxRoll(activeSeries.ethDebtDai.add(ethers.BigNumber.from('1000000000000') ));
    }

    /* If USDC in wallet greater than debt, then set the max value to the debt amount , else the wallet amount */
    currency === 'USDC' && activeSeries?.ethDebtDai && (async () => {
      const tin =  await checkPsm('tin'); // sell = xtin :  buy = xtout
      const reqdOut = activeSeries?.ethDebtDai;
      const amntNeeded = ethers.utils.parseEther( psmUSDCOut( reqdOut, tin) ) ;

      usdcBalanceWad?.gt(amntNeeded) ?
        setMaxRepay(amntNeeded.add(ethers.BigNumber.from('1000000000000') )):
        setMaxRepay(usdcBalanceWad.toString());  
    })();

  }, [daiBalance, activeSeries, currency ]);


  /* Handle input (debounced input) changes: */
  useEffect(() => {

    /* Calculate the expected APR based on input and set  */
    isRollDebt && destinationSeries && debouncedInput>0 && ( async () => {

      const parsedInput = ethers.utils.parseEther(debouncedInput).gt(activeSeries?.ethDebtDai) ?  
        activeSeries?.ethDebtDai :
        ethers.utils.parseEther(debouncedInput); 

      const destDebt = destinationSeries.ethDebtFYDai || ethers.BigNumber.from('0');
      const preview = await previewPoolTx('buyDai', destinationSeries, parsedInput);

      if (!(preview instanceof Error)) {
        setDebtDestinationSeries( cleanValue( ethers.utils.formatEther( preview.add(destDebt) ), 2 ) );
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('buyDai', destinationSeries, 1);
        !(rate instanceof Error) && setDebtDestinationSeries( ( parseFloat( ethers.utils.formatEther( parsedInput.add(destDebt) )) * parseFloat((ethers.utils.formatEther(rate)))).toString() );
        (rate instanceof Error) && setDebtDestinationSeries('0');
        // setRepayDisabled(true);
        // setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  
  }, [debouncedInput, destinationSeries, isRollDebt, activeSeries]);

  /* Repay button DISABLING logic */
  useEffect(()=>{
    ( !account || !inputValue || parseFloat(inputValue) <= 0 ) ? setRepayDisabled(true): setRepayDisabled(false);  
    
    if (currency === 'DAI' && daiBalance && parseFloat(inputValue) > 0 && !isRollDebt ) {
      ( daiBalance?.eq(ethers.constants.Zero) || ( ethers.utils.parseEther(inputValue).gt(daiBalance) )  )? 
        setRepayDisabled(true) : 
        setRepayDisabled(false);
    } 

    if (currency === 'DAI' && parseFloat(inputValue) > 0 && isRollDebt ) {
      ethers.utils.parseEther(inputValue).lte(ethers.constants.Zero)? 
        setRepayDisabled(true) : 
        setRepayDisabled(false);
    } 

    /* note: USDC uses mwei precision */
    if (currency === 'USDC' && usdcBalance && parseFloat(inputValue) > 0 ) {
      ( usdcBalance?.eq(ethers.constants.Zero) || ethers.utils.parseUnits(inputValue, 'mwei').gt(usdcBalance)) ? 
        setRepayDisabled(true)  : 
        setRepayDisabled(false);
    } 
  }, [ inputValue ]);

  /* Handle input WARNINGS and ERRORS */ 
  useEffect(() => {
    if (isRollDebt) {
      if (debouncedInput && ethers.utils.parseEther(debouncedInput).gt(activeSeries?.ethDebtDai) ) {
        setWarningMsg('That is more than your current debt - only the available debt will be rolled over.');
        setErrorMsg(null); 
      } else {
        setWarningMsg(null);
        setErrorMsg(null);
      }
    }
    if (!isRollDebt && currency === 'DAI' ) {
      if ( debouncedInput && daiBalance && ( ethers.utils.parseEther(debouncedInput).gt(daiBalance) ) ) {
        setWarningMsg(null);
        setErrorMsg('That amount exceeds the amount of Dai in your wallet');
      } else {
        setWarningMsg(null);
        setErrorMsg(null);
      }
    }
    if (!isRollDebt && currency === 'USDC' ) {
      if ( currency === 'USDC' && debouncedInput && usdcBalance && ( ethers.utils.parseUnits(debouncedInput, 'mwei').gt(usdcBalance) ) ) {
        setWarningMsg(null);
        setErrorMsg('That amount exceeds the amount of USDC in your wallet'); 
      } else {
        setWarningMsg(null);
        setErrorMsg(null);
      }
    }
  }, [ currency, activeSeries, debouncedInput, daiBalance, usdcBalance, isRollDebt]);

  /* For RollDebt > Get seriesData into an array and filter out the active series and mature series for the selector */
  useEffect(()=>{
    const arr = [...seriesData].map(([ ,value]) => (value));
    const filteredArr = arr.filter((x:IYieldSeries) => !x.isMature() && x.maturity !== activeSeries.maturity );
    setSeriesArr(filteredArr);
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
      { !activeSeries?.isMature() && !mobile && <SeriesDescriptor activeView='borrow' minimized /> }
      { !txActive &&
        <Box
          width={!mobile?{ min: activeSeries?.isMature()?'600px':'620px', max: activeSeries?.isMature()?'600px':'620px' } : undefined}
          alignSelf="center"
          fill
          background="background" 
          round='small'
          pad={activeSeries?.isMature()? { vertical: undefined, horizontal:'large' } :'large'}
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
                        onClick={() => { setIsRollDebt(true); setCurrency('DAI'); }}
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

                    { 
                     !isRollDebt && 
                     !mobile &&
                     <Box basis='30%'>
                       <Selector
                         selectedIndex={0} 
                         selectItemCallback={(x:any) => setCurrency(x === 0 ? 'DAI' : 'USDC')}             
                         items={[
                           <Box 
                             key='DAI' 
                             direction='row' 
                             gap='xsmall' 
                             align='center' 
                             pad={{ horizontal:'small', vertical:'xsmall' }}
                           >
                             <DaiMark /> <Text size='small'> DAI </Text>
                           </Box>,
                           <Box 
                             key='USDC' 
                             direction='row' 
                             gap='xsmall' 
                             align='center' 
                             pad={{ left:'small', vertical:'xsmall' }}
                           >
                             <USDCMark /> <Text size='small'> USDC </Text>
                           </Box>  
                         ]}
                       />
                     </Box>
                    }

                    <TextInput
                      ref={(el:any) => {el && !mobile && el.focus(); setInputRef(el);}} 
                      type="number"
                      placeholder={!mobile ? `Enter the amount to ${isRollDebt? 'roll': 'repay'}`: `${isRollDebt? 'Dai to roll': 'Dai to repay'}`}
                      value={inputValue || ''}
                      plain
                      onChange={(event:any) => setInputValue(( cleanValue(event.target.value, 6) ))}
                      icon={isRollDebt || mobile ? <DaiMark /> : undefined}
                    />
                    <FlatButton 
                      label={!mobile ? `${isRollDebt? 'Roll Maximum': 'Repay Maximum'}`: 'Maximum'}
                      onClick={()=> {
                        if (isRollDebt) {
                          setInputValue( cleanValue( ethers.utils.formatEther(maxRoll), 6) );
                        } else {
                          setInputValue( cleanValue(ethers.utils.formatEther(maxRepay), 6) );
                        }
                      }}
                    />
                  </InputWrap>

                  { 
                    currency === 'USDC' &&
                    !!inputValue &&
                    inputValue>0 &&
                    <Text size='small'>
                      <Text size='small' weight='bold'>Note: </Text> 
                      You are repaying { USDCValueInDai } DAI debt, using {cleanValue(inputValue, 2)} USDC.
                    </Text>             
                  }

                  { 
                  isRollDebt &&
                  <Box pad='medium' direction='row' justify='between' fill>
                    <Box fill='horizontal'>
                      <Text size='xsmall'> Select a series to roll debt to: </Text>
                    </Box>

                    <Box fill='horizontal' margin={{ top:'-10px' }}>
                      <Selector
                        selectedIndex={0} 
                        selectItemCallback={(x:number) => setDestinationSeries(seriesArr[x])}             
                        items={
                          seriesArr?.map( (x:IYieldSeries) => (
                            <Box key={x.maturity} direction='row' gap='xsmall' align='center' pad={{ left:'large', vertical:'xsmall' }}>
                              <AprBadge activeView='Borrow' series={x} />
                              <Text size='small'>
                                { mobile? x.displayNameMobile : x.displayName }
                              </Text>
                            </Box>
                          ))
                          }
                      />
                    </Box>

                  </Box>
                  } 

                  <Box fill>
                    <Collapsible open={true}>
                      <InfoGrid 
                        entries={[

                          {
                            label: 'Current Debt',
                            labelExtra: `Cost to ${ isRollDebt? 'roll':'repay'} all now`,
                            visible: !isRollDebt,
                            active: true,
                            loading: false,    
                            value:  activeSeries?.ethDebtDai_? `${cleanValue(activeSeries?.ethDebtDai_, 2)} DAI`: '0 DAI',
                            valuePrefix: null,
                            valueExtra: null,
                          },

                          {
                            label: 'Remaining debt',
                            labelExtra: 
                              inputValue && isRollDebt ? 
                                `after rolling ${inputValue && cleanValue(inputValue, 2)} DAI ` :
                                `after repaying ${currency==='DAI'? inputValue && cleanValue(inputValue, 2) : USDCValueInDai!} DAI `,
                            visible: !!inputValue&&inputValue>0,
                            active: !!inputValue&&inputValue>0,
                            loading: false,
                            value:                          
                            currency === 'DAI' ? 
                              ( activeSeries?.ethDebtDai_ - parseFloat(inputValue!)>0 ? activeSeries.ethDebtDai_ - parseFloat(inputValue) : 0 ).toFixed(2) : 
                              ( activeSeries?.ethDebtDai_ - parseFloat(USDCValueInDai!)>0 ? activeSeries.ethDebtDai_ - parseFloat(USDCValueInDai!) : 0 ).toFixed(2),
                            valuePrefix: null,
                            valueExtra: null, 
                          },
                          {
                            label: `Debt in ${destinationSeries?.displayNameMobile}`,
                            labelExtra: 'owed at maturity after rolling debt', 
                            visible: isRollDebt && !!inputValue&&inputValue>0,
                            active: !!inputValue&&inputValue>0,
                            loading: false,    
                            value: debtInDestinationSeries,
                            valuePrefix: null,
                            valueExtra: null, 
                          },

                        ]}
                      />
                    </Collapsible>
                  </Box>

 
                  <ActionButton
                    onClick={isRollDebt? ()=> rollDebtProcedure(inputValue) : ()=>repayProcedure(inputValue)}
                    label={
                      currency === 'DAI' ?                       
                        `${isRollDebt? 'Roll':'Repay'} ${inputValue! || ''} Dai ${isRollDebt?'to':''} ${isRollDebt?destinationSeries?.displayNameMobile:''}` : 
                        `Repay ${USDCValueInDai || '' } Dai Debt with ${ inputValue && cleanValue(inputValue, 2)} USDC`
                      }
                    disabled={repayDisabled}
                    hasPoolDelegatedProxy={true}
                    clearInput={()=>setInputValue(undefined)}
                  />                 

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
