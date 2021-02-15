import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { useParams, useHistory, NavLink } from 'react-router-dom';
import { Keyboard, Box, TextInput, Text, ThemeContext, ResponsiveContext, Collapsible, Layer } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';
import { VscHistory as HistoryIcon } from 'react-icons/vsc';

/* utils and support */
import { abbreviateHash, cleanValue, genTxCode } from '../utils';

/* contexts */
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
import { HistoryContext } from '../contexts/HistoryContext';

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';
import { useUSDCProxy } from '../hooks/USDCProxyHook';

/* containers */
import Repay from './Repay';
import RateLock from './RateLock';
import History from './History';

/* components */
import DaiMark from '../components/logos/DaiMark';
import MakerMark from '../components/logos/MakerMark';
import SeriesDescriptor from '../components/SeriesDescriptor';
import InputWrap from '../components/InputWrap';
import TxStatus from '../components/TxStatus';
import InfoGrid from '../components/InfoGrid';
import ActionButton from '../components/ActionButton';
import RaisedButton from '../components/RaisedButton';
import FlatButton from '../components/FlatButton';
import SeriesMatureBox from '../components/SeriesMatureBox';
import HistoryWrap from '../components/HistoryWrap';
import RaisedBox from '../components/RaisedBox';
import YieldMobileNav from '../components/YieldMobileNav';
import Loading from '../components/Loading';
import Selector from '../components/Selector';
import USDCMark from '../components/logos/USDCMark';

interface IBorrowProps {
  openConnectLayer:any;
}

const Borrow = ({ openConnectLayer }:IBorrowProps) => {

  const navHistory = useHistory();
  const { amnt }:any = useParams(); /* check if the user sent in any requested amount in the url (deep-linking) */ 
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const theme = useContext<any>(ThemeContext);

  /* state from context */
  const { state: { activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);

  const { state: { historyLoading } } = useContext(HistoryContext);
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { position, makerVaults, userLoading, preferences } = userState;
  const { 
    ethPosted,
    ethPosted_,
    maxDaiBorrow,
    maxDaiBorrow_,
    debtValue_,
    collateralPercent_,
    daiBalance_,
  } = position;

  /* local state */
  const [ repayOpen, setRepayOpen ] = useState<boolean>(false);
  const [ rateLockOpen, setRateLockOpen ] = useState<boolean>(false);
  const [ histOpen, setHistOpen ] = useState<boolean>(false);
  const [ borrowDisabled, setBorrowDisabled ] = useState<boolean>(true);
  const [ fyDaiValue, setFYDaiValue ] = useState<number>(0);
  const [ APR, setAPR ] = useState<string>();
  const [ estPercent, setEstPercent ] = useState<string|undefined>(undefined);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|any>(null);
  const [ inputValue, setInputValue ] = useState<any|undefined>(amnt || undefined);

  const [inputRef, setInputRef] = useState<any>(null);
  const [ currency, setCurrency ] = useState<string>('DAI');

  /* init hooks */
  const { borrowDai } = useBorrowProxy();
  const { borrowUSDC } = useUSDCProxy();
  const { calculateAPR, estCollateralRatio, estTrade } = useMath();
  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['BORROW']); /* txs to watch for */
  const [ repayTxActive ] = useTxActive(['REPAY']); /* txs to watch for */
  const debouncedInput = useDebounce(inputValue, 500);
  const [ rollDebtTxActive ] = useTxActive(['ROLL_DEBT']); /* txs to watch for */
  // const isLol = useIsLol(inputValue);

  /* 
   * execution procedure
   */
  const borrowProcedure = async () => {
    if (inputValue && !borrowDisabled) {

      currency === 'DAI' && await borrowDai(activeSeries, 'ETH-A', inputValue);
      currency === 'USDC' && await borrowUSDC(activeSeries, 'ETH-A', inputValue);

      /* clean up and refresh */               
      setInputValue(undefined);
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateSeries([activeSeries]),
      ]);
    }
  };

  /* show txs that are pending (tx matching the current series and borrow) */
  const [showTxPending, setShowTxPending] = useState<boolean>(false);
  useEffect(()=>{
    setShowTxPending( txActive?.txCode === genTxCode('BORROW', activeSeries?.maturity.toString()));
  }, [txActive, activeSeries]);

  /* Handle input (debounced input) changes: */
  useEffect(() => {

    /* Calculate expected collateralization ratio based on the input */
    position?.debtValue && debouncedInput>0 && ( async () => {
      const newPercent = estCollateralRatio(
        position.ethPosted, 
        ( position.debtValue.add(ethers.utils.parseEther(debouncedInput)) ),
        true
      );
      setEstPercent( cleanValue(newPercent, 2) || undefined );
    })();

    /* Calculate the expected APR based on input and set fyDai value */
    activeSeries && debouncedInput>0 && ( async () => {
      const preview = estTrade('buyDai', activeSeries, debouncedInput);
      if (!(preview instanceof Error)) {
        setFYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        const _apr = calculateAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries.maturity );
        setAPR(cleanValue(_apr.toString(), 2) );
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = estTrade('buyDai', activeSeries, 1);
        !(rate instanceof Error) && setFYDaiValue(debouncedInput*parseFloat((ethers.utils.formatEther(rate))));
        (rate instanceof Error) && setFYDaiValue(0);
        setBorrowDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }     
    })();

  }, [position, debouncedInput, activeSeries]);
    
  /* Handle borrow disabling deposits - disable if any of the conditions are met */
  useEffect(()=>{
    (
      (ethPosted && ethPosted.eq(ethers.constants.Zero) ) ||
      (inputValue && maxDaiBorrow && ethers.utils.parseEther(inputValue).gte(maxDaiBorrow)) ||
      !account ||
      !inputValue ||
      parseFloat(inputValue) <= 0
    ) ? setBorrowDisabled(true): setBorrowDisabled(false);
  }, [ inputValue ]);


  /* Handle input exception logic (using debouncedInput to allow for small mistakes/corrections) */
  useEffect(() => {
    if ( 
      debouncedInput &&
      maxDaiBorrow &&
      ethers.utils.parseEther(debouncedInput).gte(maxDaiBorrow) &&
      !(ethPosted.isZero())
    ) {
      setWarningMsg(null);
      setErrorMsg(
        <Box direction='row-responsive' gap='small'>
          <Text size='xsmall'>That amount exceeds the amount you can borrow based on your collateral.</Text>
          <RaisedButton 
            label={<Box pad={{ horizontal:'small' }}><Text size='xsmall'>Manage Collateral</Text></Box>}
            onClick={()=>navHistory.push('/post/')}
          />
        </Box>
      );
    } else if (
      debouncedInput && 
        ( debouncedInput > Math.round(maxDaiBorrow_- maxDaiBorrow_*0.05 ) && 
        !(ethPosted.isZero())
        ) ) {
      setErrorMsg(null);
      setWarningMsg('If you borrow right up to your maximum allowance, there is high probability you will be liquidated!');
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput ]);


  return (
    <RaisedBox>
      <Keyboard 
        onEsc={() => setInputValue(undefined)}
        onEnter={()=> borrowProcedure()}
        onBackspace={()=> {
          inputValue && 
          (document.activeElement !== inputRef) && 
          setInputValue(debouncedInput.toString().slice(0, -1));
        }}
        target='document'
      >
        { 
        repayOpen && !activeSeries?.isMature() &&
        <Layer
          onClickOutside={()=>setRepayOpen(false)}
          responsive={true}
        >
          <Repay close={()=>setRepayOpen(false)} />      
        </Layer>
        }

        { 
        rateLockOpen && 
        makerVaults.length>0 &&
        <Layer 
          onClickOutside={()=>setRateLockOpen(false)}
          responsive={true}       
        >
          <RateLock close={()=>setRateLockOpen(false)} asLayer />
        </Layer>
        }

        { 
        histOpen && 
        <HistoryWrap closeLayer={()=>setHistOpen(false)}>
          <History 
            filterTerms={['Borrowed', 'Deposited', 'Withdrew', 'Repaid', 'Imported', 'Rolled' ]}
            series={activeSeries}
          />
        </HistoryWrap>
        }

        <SeriesDescriptor activeView='borrow'>
          <InfoGrid
            alt={true}
            entries={[
              {
                label: null,
                visible: !!account && !mobile,
                active: true,
                loading: false,
                value:null,
                valuePrefix: null,
                valueExtra: ()=>(
                  <>
                    <Box
                      width={{ min:'175px' }}
                      margin={!mobile?{ left:'-52px' }: { left:'-25px' }}
                      background='#555555FA' 
                      pad='small'
                      round={{ corner:'right', size:'xsmall' }}
                      elevation='small'
                    >
                      <FlatButton            
                        onClick={()=>navHistory.push('/post/')}
                        label={<Text size='xsmall' color='#DDDDDD'>Manage Collateral</Text>}
                        background='#55555580'
                      />
                    </Box>
                    <Box
                      background='#555555FA'
                      margin={{ left:'-52px' }}
                      width='2px'
                      height='2px'
                    />             
                  </>)
              },
              {
                label: null,
                labelExtra: null,
                visible:
                  !mobile &&
                  !!account &&
                  parseFloat(ethPosted_) === 0,
                active: true,
                loading: false,    
                value: null,
                valuePrefix: null,
                valueExtra: ()=>(
                  <Box width={{ min:'300px' }} direction='row' align='center' gap='small'> 
                    <Box align='center'> 
                      {!mobile &&
                      // eslint-disable-next-line jsx-a11y/accessible-emoji
                      <Text size='xxlarge'>👈</Text>}
                    </Box>
                    <Box gap='xsmall'>
                      <Box> 
                        <Text weight='bold' color={activeSeries?.seriesTextColor}> Deposit Collateral </Text>
                      </Box>
                      <Text size='xxsmall' color={activeSeries?.seriesTextColor}>
                        Use the 'manage collateral' button to post some ETH
                      </Text>
                    </Box>
                  </Box>)
              },
              /* dummy placeholder */
              {
                label: null,
                labelExtra: null,
                visible:
                  !!account &&
                  parseFloat(ethPosted_) === 0,
                active: true,
                loading: false,    
                value: null,
                valuePrefix: null,
                valueExtra:null,
              },
              {
                label: 'DAI Debt + Interest',
                labelExtra: 'owed at maturity',
                visible:
                  !!account &&
                  !activeSeries?.isMature() || 
                  (activeSeries?.isMature() && activeSeries?.ethDebtDai_ > 0 ),
                active: true,
                loading: false,    
                value: activeSeries?.ethDebtDai_? `${activeSeries.ethDebtDai_} DAI`: '0 DAI',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Borrowing Power',
                labelExtra: 'based on collateral posted',
                visible: 
                  activeSeries && 
                  !activeSeries.isMature() && 
                  !!account && 
                  parseFloat(ethPosted_) > 0,
                active: maxDaiBorrow_,
                loading: false,
                value: maxDaiBorrow_? `${maxDaiBorrow_} ${currency}`: `0 ${currency}`,           
                valuePrefix: currency === 'USDC'? '~': null,
                valueExtra: null,
              },
              {
                label: 'Total Debt',
                labelExtra: 'across all yield series',
                visible: !txActive && activeSeries && !activeSeries.isMature() && !!account,
                active: true,
                loading: false,        
                value: debtValue_? `${debtValue_} DAI`: '0 DAI', 
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Collateralization Ratio',
                labelExtra: 'based on ETH posted',
                visible:
                  activeSeries && 
                  !activeSeries.isMature() && 
                  !!account && 
                  parseFloat(ethPosted_) > 0,
                active: collateralPercent_ > 0,
                loading: false,            
                value: (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '0%',
                valuePrefix: null,
                valueExtra: null,  
              },
              {
                label: 'Dai Balance',
                labelExtra: abbreviateHash('0x6b175474e89094c44da98b954eedeac495271d0f'),
                visible: 
                  (!!account && !activeSeries?.isMature()) || 
                  (activeSeries?.isMature() && activeSeries?.fyDaiBalance_>0),
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
   
        { 
        /* If no transaction in progress : */
        !showTxPending && 
        <Box
          width={{ max: '600px' }}
          alignSelf="center"
          fill
          background="background"
          round='small'
          pad="large"
          gap='small'
        > 
          <Box gap='small' align='center' fill='horizontal'>             
            { 
            !activeSeries?.isMature() && 
            Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&

            <Box gap='medium' align='center' fill='horizontal'>
              <Box direction='row' justify='between' fill>
                <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to borrow</Text>
                { 
                  !mobile &&  !userLoading &&
                  <RaisedButton
                    animation='slideRight'
                    disabled={!!inputValue || makerVaults.length===0}
                    label={
                      <Box pad='xsmall' gap='small' direction='row' align='center'>
                        <Box><MakerMark /></Box>
                        <Text size='xsmall'>Import a Maker vault</Text>
                      </Box>
                    }
                    onClick={()=>setRateLockOpen(true)}
                  />
                }
              </Box>

              <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                <Box basis='25%'>
                  <Selector
                    selectedIndex={0} 
                    selectItemCallback={(x:any) => setCurrency(x === 0 ? 'DAI' : 'USDC')}             
                    items={[
                      <Box 
                        key='DAI' 
                        direction='row' 
                        gap='xsmall' 
                        align='center' 
                        pad={{ left:'small', vertical:'xsmall' }}
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

                <TextInput
                  ref={(el:any) => {el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el);}} 
                  type="number"
                  placeholder={!mobile ? `Enter the amount of ${currency} to borrow`: currency} 
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue( cleanValue(event.target.value) )}
                  // icon={
                  //   isLol ? 
                  //     <span role='img' aria-label='lol'>😂</span> :
                  //     <DaiMark />                   
                  // }
                />

              </InputWrap>

              <Box fill>
                <Collapsible open={!!inputValue&&inputValue>0}>
                  <InfoGrid entries={[
                    {
                      label: 'Estimated APR',
                      labelExtra: `if ${inputValue && cleanValue(inputValue, 2)} ${currency} are borrowed`,
                      visible: !!inputValue,
                      active: !!inputValue&&inputValue>0,
                      loading: false,    
                      value: APR?`${APR}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                      valuePrefix: null,
                      valueExtra: null, 
                    },
                    {
                      label: 'Amount owed',
                      labelExtra: 'at maturity',
                      visible: !!inputValue,
                      active: !!inputValue&&inputValue>0,
                      loading: false,          
                      value: `${fyDaiValue.toFixed(2)} DAI`,
                      valuePrefix: '',
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
                            label={<Box pad='xsmall'><Text size='xsmall'>Connect a wallet</Text></Box>}
                            onClick={() => openConnectLayer()}
                          /> 
                        </Box>
                      )
                    },
                    {
                      label: 'Collateralization Ratio',
                      labelExtra: `after borrowing ${inputValue && cleanValue(inputValue, 2)} ${currency} `,
                      visible: !!inputValue && !!account && position.ethPosted_>0,
                      active: true,
                      loading: false,        
                      value: estPercent ? `${estPercent}%`: collateralPercent_ || '',
                      valuePrefix: '',
                      valueExtra: () => (
                        <Text color='red' size='small'> 
                          {/* { inputValue &&
                        estRatio &&
                        ( (collateralPercent_-estRatio) > 0) &&
                        `(-${(collateralPercent_-estRatio).toFixed(0)}%)` } */}
                        </Text>
                      )
                    },
                    {
                      label: 'Want to borrow DAI or USDC?',
                      labelExtra: '',
                      visible: !!inputValue&&inputValue>0 && !!account && position.ethPosted <= 0,
                      active: !!inputValue,
                      loading: false,            
                      value: '',
                      valuePrefix: null,
                      valueExtra: () => (
                        <Box pad={{ top:'small' }}>
                          <RaisedButton
                            // color={inputValue? 'brand': 'brand-transparent'}
                            label={<Box pad='xsmall'><Text size='xsmall'>Deposit collateral</Text></Box>}
                            onClick={()=>navHistory.push('/post/')}
                          /> 
                        </Box>
                      )
                    },

                  ]}
                  />
                </Collapsible>
              </Box>

              { 
              account &&  
              <ActionButton
                onClick={()=>borrowProcedure()}
                label={`Borrow ${inputValue || ''} ${currency}`}
                disabled={borrowDisabled}
                hasPoolDelegatedProxy={activeSeries.hasPoolDelegatedProxy}
                clearInput={()=>setInputValue(undefined)}
              />
              }
            </Box>
            }
            
            { 
            !txActive && 
            !!account && 
            activeSeries?.isMature() &&
            activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) &&
            <Repay />
            }

            <Box direction='row' fill justify='between'>
              { 
              activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) && 
              !mobile &&
              <Box alignSelf='start' margin={{ top:'medium' }}>
                <FlatButton 
                  onClick={()=>setHistOpen(true)}
                  disabled={historyLoading}
                  label={
                    <Box direction='row' gap='small' align='center'>
                      <Text size='xsmall' color='text-weak'><HistoryIcon /></Text>                
                      <Text size='xsmall' color='text-weak'>
                        Series Borrow History
                      </Text>              
                    </Box>
                }
                />
              </Box>
              }
            
              { 
              !activeSeries?.isMature() &&
              activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) &&
              !mobile &&
              <Box alignSelf='end' margin={{ top:'medium' }}>
                  {
                  repayTxActive || rollDebtTxActive ?
                    <Box direction='row' gap='small'>
                      <Text size='xsmall' color='text-weak'>
                        <Text weight='bold' color={activeSeries?.seriesColor}>{ repayTxActive? 'repay': 'roll' }</Text> pending
                      </Text>
                      <Loading condition={true} size='xxsmall'>.</Loading>
                    </Box>
                    : 
                    <FlatButton 
                      onClick={()=>setRepayOpen(true)}
                      label={
                        <Box direction='row' gap='xsmall' align='center'>
                          <Text weight='bold' size='small' color={activeSeries?.seriesColor}>repay</Text> 
                          <Text size='xsmall' color='text-weak'>or</Text>
                          <Text weight='bold' size='small' color={activeSeries?.seriesColor}>roll</Text>
                          <Text size='xsmall' color='text-weak'>debt</Text>
                          <ArrowRight color='text-weak' />
                        </Box>
                    }
                    />                
                  }
              </Box>
              }
            </Box>

          </Box>
        </Box>
        }

        { 
        showTxPending && 
        <TxStatus tx={txActive} />
        }

      </Keyboard>

      {
      mobile && 
      <YieldMobileNav>
        <NavLink 
          to='/post/'
          activeStyle={{ transform: 'scale(1.1)', fontWeight: 'bold', color: `${theme?.global.colors.active}` }}
          style={{ textDecoration: 'none' }}
        >
          <Box>
            <Text size='xxsmall' color='text-weak'>Manage Collateral</Text>
          </Box>
        </NavLink>

          {
          !activeSeries?.isMature() &&
          activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) &&
          <NavLink 
            to={`/repay/${activeSeries?.maturity}`}
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='small' align='center'>
              <Text size='xxsmall' color='text-weak'> 
                <Text weight='bold' size='xsmall' color={activeSeries?.seriesColor}>repay </Text> 
                or 
                <Text weight='bold' size='xsmall' color={activeSeries?.seriesColor}>roll </Text> 
                debt 
              </Text>
              <ArrowRight color={activeSeries?.seriesColor} />
            </Box>
          </NavLink>
          }
      </YieldMobileNav>
      }
    </RaisedBox>
  );
};

export default Borrow;
