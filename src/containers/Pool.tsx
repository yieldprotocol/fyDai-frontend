import React, { useEffect, useState, useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { Box, Keyboard, TextInput, Text, ResponsiveContext, Collapsible, Layer  } from 'grommet';
import { 
  FiArrowRight as ArrowRight,
  FiArrowLeft as ArrowLeft,
  FiInfo as Info,
} from 'react-icons/fi';
import { VscHistory as HistoryIcon } from 'react-icons/vsc';

/* utils and support */
import { analyticsLogEvent, cleanValue, nFormatter } from '../utils';
import { secondsToFrom, fyDaiForMint } from '../utils/yieldMath';

/* contexts */
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
import { HistoryContext } from '../contexts/HistoryContext';

/* hooks */ 
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useTxActive } from '../hooks/txHooks';
import { usePoolProxy } from '../hooks/poolProxyHook';
import { useMath } from '../hooks/mathHooks';

/* containers */ 
import RemoveLiquidity from './RemoveLiquidity';
import History from './History';

/* components */
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import TxStatus from '../components/TxStatus';
import SeriesDescriptor from '../components/SeriesDescriptor';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import SeriesMatureBox from '../components/SeriesMatureBox';
import HistoryWrap from '../components/HistoryWrap';
import RaisedBox from '../components/RaisedBox';
import DaiMark from '../components/logos/DaiMark';
import YieldMobileNav from '../components/YieldMobileNav';
import Loading from '../components/Loading';
import StickyButton from '../components/StickyButton';


interface IPoolProps {
  openConnectLayer:any;
}

  
const Pool = ({ openConnectLayer }:IPoolProps) => {

  const { amnt }:any = useParams(); /* check if the user sent in any requested amount in the url */
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  /* state from contexts */
  const { state: { seriesLoading, activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { state: { historyLoading } } = useContext(HistoryContext);
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { authorization :{ hasDsProxy } } = userState;
  const { daiBalance } = userState.position;
  const { useBuyToAddLiquidity } = userState.preferences;

  /* local state */ 
  const [ hasDelegated ] = useState<boolean>(true);
  const [ inputValue, setInputValue ] = useState<any>(amnt || undefined);
  const [ inputRef, setInputRef ] = useState<any>(null);
  const [ removeLiquidityOpen, setRemoveLiquidityOpen ] = useState<boolean>(false);
  const [ histOpen, setHistOpen ] = useState<boolean>(false);
  const [ explainerOpen, setExplainerOpen ] = useState<boolean>(false);
  const [ forceBorrow, setForceBorrow] = useState<boolean>(false);
  const [ addLiquidityDisabled, setAddLiquidityDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  /* init hooks */
  const { estPoolShare } = useMath();
  const { addLiquidity } = usePoolProxy();
  const [ newPoolShare, setNewPoolShare ] = useState<string>();
  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['ADD_LIQUIDITY', 'REMOVE_LIQUIDITY']);
  const [ removeTxActive ] = useTxActive(['REMOVE_LIQUIDITY']);
  const debouncedInput = useDebounce(inputValue, 500);
  const isLol = useIsLol(inputValue);
  
  /* execution procedure */ 
  const addLiquidityProcedure = async () => { 
    if (inputValue && !addLiquidityDisabled ) {

      try {
        analyticsLogEvent(
          'addLiquidity_initiated', 
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

      await addLiquidity( activeSeries, inputValue, forceBorrow );
      
      /* clean up and refresh */ 
      setInputValue(undefined);
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateSeries([activeSeries]),
      ]);

    }   
  };

  /* handle value calculations based on input changes */
  useEffect(()=>{
    if (activeSeries && inputValue) {

      /* calculate new pool share */
      const estShare = estPoolShare(activeSeries, inputValue);
      setNewPoolShare(cleanValue(estShare, 3));

      /* check whether to force 'BORROW and POOL' stratgey */
      // const fyDaiMinted = fyDaiForMint(
      //   activeSeries.daiReserves, 
      //   activeSeries.fyDaiReserves, 
      //   activeSeries.fyDaiVirtualReserves, 
      //   ethers.utils.parseEther(inputValue), 
      //   secondsToFrom(activeSeries.maturity) 
      // );
      // (ethers.BigNumber.from(fyDaiMinted)).gte(activeSeries.fyDaiReserves,) && setForceBorrow(true); 
    }

  }, [inputValue]);
  
  /* Add liquidity disabling logic */
  useEffect(()=>{
    (
      ( inputValue && daiBalance && ethers.utils.parseEther(inputValue).gt(daiBalance) ) ||  
      !account ||
      !hasDelegated ||
      !inputValue ||
      parseFloat(inputValue) <= 0
    )? setAddLiquidityDisabled(true): setAddLiquidityDisabled(false);
  }, [ account, daiBalance, inputValue, hasDelegated]);

  /* handle warnings input errors */
  useEffect(() => {
    if ( daiBalance && debouncedInput && ( ethers.utils.parseEther(debouncedInput).gt(daiBalance))) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you have'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput, daiBalance ]);


  /* analytics input values  before submission */ 
  const analyticsInput = useDebounce(inputValue, 3500);
  useEffect(() => {
    analyticsLogEvent(
      'pool_input', 
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
        onEnter={()=> addLiquidityProcedure()}
        onBackspace={()=> {
          inputValue && 
        (document.activeElement !== inputRef) && 
        setInputValue(debouncedInput.toString().slice(0, -1));
        }}
        target='document'
      >
        { removeLiquidityOpen && 
        <Layer onClickOutside={()=>setRemoveLiquidityOpen(false)}>
          <RemoveLiquidity close={()=>setRemoveLiquidityOpen(false)} openConnectLayer={openConnectLayer} /> 
        </Layer>}

        { explainerOpen && 
        <Layer onClickOutside={()=>setExplainerOpen(false)}>
          <Box 
            width={!mobile?{ min:'600px', max:'600px' }: undefined}
            alignSelf='center'
            fill
            background='background'
            round='small'
            pad='large'
            gap='medium'
          >

            <Box gap='small'>
              <Text weight='bold' size='small'> Buy and Pool (Recommended) </Text>
              <Text size='small'> This strategy is best for users that are adding smaller amounts of liquidity. 
                It minimizes gas costs while maximising the amount of pool tokens received. This is the strategy recommended for most users.       
              </Text>
              <Text size='xxsmall'>Note: This option may not be available if the liquidity added is larger than the pool can handle.</Text>
            </Box>

            <Box gap='small'>
              <Text weight='bold' size='small'>Borrow and Pool</Text>
              <Text size='small'>This strategy is best for users that are adding significant amounts of liquidity to a pool.
                Although it may use more gas, this strategy will not impact the current interest rate for the chosen series.
              </Text>
            </Box>

            <Box alignSelf='start' margin={{ top:'medium' }}>
              <FlatButton 
                onClick={()=>setExplainerOpen(false)}
                label={
                  <Box direction='row' gap='medium' align='center'>
                    <ArrowLeft color='text-weak' />
                    <Text size='xsmall' color='text-weak'> Got it. Take me back. </Text>
                  </Box>
                }
              />
            </Box>  
          </Box>
        </Layer>}

        { histOpen && 
        <HistoryWrap closeLayer={()=>setHistOpen(false)}>
          <History 
            filterTerms={[ 'Added', 'Removed' ]}
            series={activeSeries}
          />
        </HistoryWrap>}

        <SeriesDescriptor activeView='pool'> 
          <InfoGrid 
            alt
            entries={[
              {
                label: 'Your Pool Tokens',
                labelExtra: 'owned in this series',
                visible: 
                  (!!account && !activeSeries?.isMature()) || 
                  (activeSeries?.isMature() && activeSeries?.poolTokens_>0 ),
                active: true,
                loading: !activeSeries?.poolTokens_,     
                value: activeSeries?.poolTokens_,
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Your Pool share',
                labelExtra: ()=>(<Text size='xxsmall'> of the total tokens </Text>),
                visible: 
                    (!!account && !activeSeries?.isMature()) || 
                    (activeSeries?.isMature() && activeSeries?.poolTokens_>0 ),
                active: true,
                loading: !activeSeries?.poolPercent,           
                value: activeSeries?.poolPercent ?` ${activeSeries.poolPercent}%`: '',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Total Liquidity',
                labelExtra: ' staked in this series',
                visible: !activeSeries?.isMature(),
                active: true,
                loading: !activeSeries?.totalSupply_,   
                value: activeSeries?.totalSupply_ ?` ${nFormatter(activeSeries?.totalSupply_, 2)} tokens`: '',
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

        { (!txActive || txActive.type === 'REMOVE_LIQUIDITY') &&
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
          
            { !(activeSeries?.isMature()) && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
            <>
              <Box fill gap='medium'>
                <Text alignSelf='start' size='large' color='text' weight='bold'>Add liquidity</Text>
                <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                  <TextInput
                    ref={(el:any) => {el && !removeLiquidityOpen && !mobile && el.focus(); setInputRef(el);}} 
                    type="number"
                    placeholder={!mobile ? 'Enter the amount of Dai Liquidity to add': 'DAI'}
                    value={inputValue || ''}
                    plain
                    onChange={(event:any) => setInputValue( cleanValue(event.target.value, 6) )}
                    icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                  />
                  
                  {account &&
                  <FlatButton 
                    label={!mobile ? 'Add Maximum': 'Maximum'}
                    onClick={()=>setInputValue(cleanValue(ethers.utils.formatEther(daiBalance), 6))}
                  />}
                </InputWrap>

                <Box fill>
                  <Collapsible open={!!inputValue&&inputValue>0}>

                    <InfoGrid entries={[
                      {
                        label: 'Share of the Pool',
                        labelExtra: 'after adding liquidity',
                        visible: inputValue>0,
                        active: debouncedInput,
                        loading: false,           
                        value: newPoolShare? `${newPoolShare}%`: '',
                        valuePrefix: null,
                        valueExtra: null,
                      },

                      {
                        label: () => ( 
                          <Box fill='horizontal' justify='between' direction='row' alignSelf='end' onClick={() => setExplainerOpen(true)}>
                            <Text size='xsmall' weight='bold'>Liquidity supply strategy:</Text>
                            <Info size='20px' onClick={() => setExplainerOpen(true)} /> 
                          </Box>),
                        labelExtra:() => ( 
                          <Box pad={{ top:'small' }} gap='small' align='center' direction='row' justify='between'>

                            { 
                            forceBorrow ?
                              <Box pad={{ horizontal:'small', vertical: 'small' }} alignSelf='center'>
                                <Text size="xxsmall" color='text-xweak'>
                                  Buy and Pool 
                                </Text>
                              </Box> 
                              :
                              <StickyButton
                                onClick={() => userActions.updatePreferences({ useBuyToAddLiquidity: true })}
                                selected={useBuyToAddLiquidity && !forceBorrow}
                                disabled={forceBorrow}
                              >
                                <Box pad={{ horizontal:'small', vertical: 'small' }} alignSelf='center'>
                                  <Text size="xxsmall">
                                    Buy and Pool 
                                  </Text>
                                </Box>
                              </StickyButton>
                            }

                            <StickyButton
                              onClick={() => userActions.updatePreferences({ useBuyToAddLiquidity: false })}
                              selected={!useBuyToAddLiquidity || forceBorrow}
                            >
                              <Box pad={{ horizontal:'small', vertical: 'small' }} alignSelf='center'>
                                <Text size="xxsmall">
                                  Borrow and Pool
                                </Text>
                              </Box>
                            </StickyButton>                       
                          </Box>       
                        ),
                        visible: inputValue>0,
                        active: debouncedInput,
                        loading: false,           
                        value: null,
                        valuePrefix: null,
                        valueExtra: null
                      },
                    ]}
                    />
                    {
                      useBuyToAddLiquidity && 
                      !forceBorrow && 
                      <Box pad={{ horizontal:'medium' }}>
                        <Text size='xxsmall'> Note: When adding liquidity using the 'BUY & POOL' strategy, the App may use less Dai than requested to avoid transaction failure. </Text>
                      </Box>
                    } 

                  </Collapsible>
                </Box> 
              </Box> 

              <Box gap='small' fill='horizontal' align='center' pad={{ vertical:'small' }}>
                <ActionButton
                  onClick={()=>addLiquidityProcedure()} 
                  label={`Supply ${inputValue || ''} DAI`}
                  disabled={addLiquidityDisabled || !hasDsProxy}
                  hasPoolDelegatedProxy={activeSeries.hasPoolDelegatedProxy}
                  clearInput={()=>setInputValue(undefined)}
                  openConnectLayer={()=>openConnectLayer()}
                />
              </Box>
            </>}

            
            {/* { activeSeries?.isMature() &&
            <SeriesMatureBox />} */}
            
            { !txActive && 
            !!account && 
            activeSeries?.isMature() && 
            activeSeries?.poolTokens?.gt(ethers.constants.Zero) && 
            <RemoveLiquidity />}

            
            <Box direction='row' fill justify='between'>
              { 
                activeSeries?.poolTokens?.gt(ethers.constants.Zero) && 
                !mobile &&
                <Box alignSelf='start' margin={{ top:'medium' }}>
                  <FlatButton 
                    onClick={()=>setHistOpen(true)}
                    disabled={historyLoading}
                    label={
                      <Box direction='row' gap='small' align='center'>
                        <Text size='xsmall' color='text-weak'><HistoryIcon /></Text>                
                        <Text size='xsmall' color='text-weak'>
                          Series Pool History
                        </Text>              
                      </Box>
                }
                  />
                </Box>
              }

              { !activeSeries?.isMature() &&
                activeSeries?.poolTokens_>0 &&
                !mobile && 
                <Box alignSelf='end' margin={{ top:'medium' }}>
                  {
                  removeTxActive ?
                    <Box direction='row' gap='small'>
                      <Text size='xsmall' color='text-weak'>
                        <Text weight='bold' color={activeSeries?.seriesColor}>remove Liquidity</Text> pending
                      </Text>
                      <Loading condition={true} size='xxsmall'>.</Loading>
                    </Box>
                    : 
                    <FlatButton 
                      onClick={()=>setRemoveLiquidityOpen(true)}
                      label={
                        <Box direction='row' gap='small' align='center'>
                          <Text size='xsmall' color='text-weak'><Text weight='bold' color={activeSeries?.seriesColor}>remove Liquidity</Text> from this series</Text>
                          <ArrowRight color='text-weak' />
                        </Box>
                      }
                    />               
                  }
                </Box>}
            </Box>

          </Box>
        </Box>}

        { txActive && txActive.type !== 'REMOVE_LIQUIDITY' && <TxStatus tx={txActive} /> }
        
      </Keyboard>

      { mobile && 
      <YieldMobileNav>
        { !activeSeries?.isMature() &&
       activeSeries?.poolTokens_>0 &&
         <NavLink 
           to={`/removeLiquidity/${activeSeries?.maturity}`}
           style={{ textDecoration: 'none' }}
         >
           <Box direction='row' gap='small' align='center'>
             <Text weight='bold' size='xsmall' color={activeSeries?.seriesColor}>Remove Liquidity</Text>
             <ArrowRight color={activeSeries?.seriesColor} />
           </Box>
         </NavLink>}
      </YieldMobileNav>}

    </RaisedBox>
  );
};

export default Pool;