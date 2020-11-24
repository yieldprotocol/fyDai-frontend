import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { useParams, useHistory, NavLink } from 'react-router-dom';
import { Keyboard, Box, TextInput, Text, ThemeContext, ResponsiveContext, Collapsible, Layer } from 'grommet';
import { FiArrowRight as ArrowRight } from 'react-icons/fi';
import { VscHistory as History } from 'react-icons/vsc';

import { abbreviateHash, cleanValue, genTxCode } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { usePool } from '../hooks/poolHook';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

import Repay from './Repay';

import DaiMark from '../components/logos/DaiMark';
import SeriesDescriptor from '../components/SeriesDescriptor';
import InputWrap from '../components/InputWrap';
import TxStatus from '../components/TxStatus';
import InfoGrid from '../components/InfoGrid';
import ActionButton from '../components/ActionButton';
import RaisedButton from '../components/RaisedButton';
import FlatButton from '../components/FlatButton';
import SeriesMatureBox from '../components/SeriesMatureBox';
import TxHistory from '../components/TxHistory';
import HistoryWrap from '../components/HistoryWrap';
import RaisedBox from '../components/RaisedBox';
import YieldMobileNav from '../components/YieldMobileNav';

interface IBorrowProps {
  borrowAmount?:number|null;
  openConnectLayer:any;
}

const Borrow = ({ openConnectLayer, borrowAmount }:IBorrowProps) => {

  const navHistory = useHistory();
  const { state: { activeSeries }, actions: seriesActions } = useContext(SeriesContext);

  /* check if the user sent in any requested amount in the url */ 
  const { amnt }:any = useParams();

  const { state: userState, actions: userActions } = useContext(UserContext);
  const { position } = userState;
  const { 
    ethPosted,
    ethPosted_,
    maxDaiAvailable,
    maxDaiAvailable_,
    ethTotalDebtDai_,
    collateralPercent_,
    daiBalance_,
  } = position;

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const theme = useContext<any>(ThemeContext);

  /* hooks init */
  const { previewPoolTx }  = usePool();
  const { borrowDai } = useBorrowProxy();
  const { calcAPR, estCollRatio: estimateRatio } = useMath();
  const { account } = useSignerAccount();

  const [ txActive ] = useTxActive(['BORROW']);

  /* flags */
  const [ repayOpen, setRepayOpen ] = useState<boolean>(false);
  const [ histOpen, setHistOpen ] = useState<boolean>(false);

  const [showTxPending, setShowTxPending] = useState<boolean>(false);
  useEffect(()=>{
    setShowTxPending( txActive?.txCode === genTxCode('BORROW', activeSeries));
  }, [txActive, activeSeries]);

  /* input values */
  const [ inputValue, setInputValue ] = useState<any|undefined>(amnt || undefined);
  const debouncedInput = useDebounce(inputValue, 500);

  /* internal component state */
  const [ borrowPending, setBorrowPending ] = useState<boolean>(false);
  const [ borrowDisabled, setBorrowDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const isLol = useIsLol(inputValue);

  const [inputRef, setInputRef] = useState<any>(null);

  /* token balances and calculated values */
  const [ fyDaiValue, setFYDaiValue ] = useState<number>(0);
  const [ APR, setAPR ] = useState<number>();
  const [ estRatio, setEstRatio ] = useState<number>(0);

  /* Borrow execution flow */
  const borrowProcedure = async () => {
    if (inputValue && !borrowDisabled) {
      setBorrowPending(true);
      await borrowDai(activeSeries, 'ETH-A', inputValue);
      setInputValue(undefined);
      userActions.updateHistory();
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateSeries([activeSeries])
      ]);
      setBorrowPending(false);
    }
  };

  /* 
  * Handle input (debounced input) changes:
  * 1. dai to fyDai conversion and get APR (fyDai needed to compare with the approved allowance)
  * 2. calcalute yield APR
  * 3. calculate estimated collateralization ratio
  */
  useEffect(() => {

    account && position && position.debtValue && debouncedInput>0 && ( async () => {
      const newRatio = estimateRatio(
        position.ethPosted, 
        ( position.debtValue.add(ethers.utils.parseEther(debouncedInput)) )
      ); 
      newRatio && setEstRatio(parseFloat(newRatio.toString()));
    })();

    activeSeries && debouncedInput>0 && ( async () => {
      const preview = await previewPoolTx('buyDai', activeSeries, debouncedInput);
      if (!(preview instanceof Error)) {
        setFYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        setAPR( calcAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries.maturity ) );      
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('buyDai', activeSeries, 1);
        !(rate instanceof Error) && setFYDaiValue(debouncedInput*parseFloat((ethers.utils.formatEther(rate))));
        (rate instanceof Error) && setFYDaiValue(0);
        setBorrowDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [debouncedInput, activeSeries ]);
    
  /* Handle borrow disabling deposits */
  useEffect(()=>{
    (
      (ethPosted && ethPosted.eq(ethers.constants.Zero) ) ||
      (inputValue && maxDaiAvailable && ethers.utils.parseEther(inputValue).gte(maxDaiAvailable)) ||
      !account ||
      !inputValue ||
      parseFloat(inputValue) <= 0
    )? setBorrowDisabled(true): setBorrowDisabled(false);
  }, [ inputValue ]);

  /* Handle input exception logic */
  useEffect(() => {
    if ( 
      debouncedInput && 
      maxDaiAvailable && 
      ethers.utils.parseEther(debouncedInput).gte(maxDaiAvailable) &&
      !(ethPosted.isZero())
    ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you can borrow based on your collateral'); 
    } else if (
      debouncedInput && 
        ( debouncedInput > Math.round(maxDaiAvailable_- maxDaiAvailable_*0.05 ) &&
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
        { repayOpen && 
        <Layer
          onClickOutside={()=>setRepayOpen(false)}
          responsive={true}
        >
          <Repay close={()=>setRepayOpen(false)} />      
        </Layer>}

        { histOpen && 
        <HistoryWrap closeLayer={()=>setHistOpen(false)}>
          <TxHistory 
            filterTerms={['Borrowed', 'Deposited', 'Withdrew', 'Repaid' ]}
            series={activeSeries}
          />
        </HistoryWrap>}

        <SeriesDescriptor activeView='borrow'>
          <InfoGrid
            alt
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
                        label={<Text size='xsmall' color='#DDDDDD'> Manage Collateral</Text>}
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
                label: 'Dai Debt + Interest',
                labelExtra: 'owed at maturity',
                visible:
                  !!account &&
                  (!activeSeries?.isMature() && !txActive)  || 
                  (activeSeries?.isMature() && activeSeries?.ethDebtDai_ > 0 ),
                active: true,
                loading: borrowPending,    
                value: activeSeries?.ethDebtDai_? `${activeSeries.ethDebtDai_} DAI`: '0 DAI',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Borrowing Power',
                labelExtra: 'based on collateral posted',
                visible: 
                  !txActive && 
                  activeSeries && 
                  !activeSeries.isMature() && 
                  !!account && 
                  parseFloat(ethPosted_) > 0,
                active: maxDaiAvailable_,
                loading: borrowPending,
                value: maxDaiAvailable_? `${maxDaiAvailable_} DAI`: '0 DAI',           
                valuePrefix: null,
                valueExtra: null,
              },

              {
                label: 'Total Debt',
                labelExtra: 'across all yield series',
                visible: !txActive && activeSeries && !activeSeries.isMature() && !!account,
                active: true,
                loading: false,        
                value: ethTotalDebtDai_? `${ethTotalDebtDai_} DAI`: '0 DAI', 
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Collateralization Ratio',
                labelExtra: 'based on ETH posted',
                visible: 
                  !txActive && 
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
                  (!!account && !txActive && !activeSeries?.isMature()) || 
                  (activeSeries?.isMature() && activeSeries?.fyDaiBalance_>0),
                active: true,
                loading: borrowPending,            
                value: daiBalance_?`${daiBalance_} DAI`: '0 DAI',
                valuePrefix: null,
                valueExtra: null,
              },
            ]}
          />
        </SeriesDescriptor>
   
        { !showTxPending && 
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
            
            { !activeSeries?.isMature() && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
            <Box gap='medium' align='center' fill='horizontal'>
              <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to borrow</Text>

              <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                <TextInput
                  ref={(el:any) => {el && !repayOpen && !mobile && el.focus(); setInputRef(el);}} 
                  type="number"
                  placeholder={!mobile ? 'Enter the amount of Dai to borrow': 'DAI'} 
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue( cleanValue(event.target.value) )}
                  icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                />
              </InputWrap>

              <Box fill>
                <Collapsible open={!!inputValue&&inputValue>0}>
                  <InfoGrid entries={[
                    {
                      label: 'Estimated APR',
                      labelExtra: `if ${inputValue && cleanValue(inputValue, 2)} Dai are borrowed`,
                      visible: !!inputValue,
                      active: !!inputValue&&inputValue>0,
                      loading: false,    
                      value: APR?`${APR.toFixed(2)}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                      valuePrefix: null,
                      valueExtra: null, 
                    },
                    {
                      label: 'Dai that will be owed',
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
                      labelExtra: `after borrowing ${inputValue && cleanValue(inputValue, 2)} Dai`,
                      visible: !!inputValue && !!account && position.ethPosted_>0,
                      active: true,
                      loading: false,        
                      value: (estRatio && estRatio !== 0)? `${estRatio}%`: collateralPercent_ || '',
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
                      label: 'Want to borrow Dai?',
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

              { account &&  
              <ActionButton
                onClick={()=>borrowProcedure()}
                label={`Borrow ${inputValue || ''} DAI`}
                disabled={borrowDisabled}
                hasPoolDelegatedProxy={activeSeries.hasPoolDelegatedProxy}
                clearInput={()=>setInputValue(undefined)}
              />}
            </Box>}

            { activeSeries?.isMature() &&
            <SeriesMatureBox />}
            
            { !txActive && 
            !!account && 
            activeSeries?.isMature() &&
            activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) &&
            <Repay />}

            <Box direction='row' fill justify='between'>
              { activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) && !mobile &&
              <Box alignSelf='start' margin={{ top:'medium' }}>
                <FlatButton 
                  onClick={()=>setHistOpen(true)}
                  label={
                    <Box direction='row' gap='small' align='center'>
                      <Text size='xsmall' color='text-xweak'><History /></Text>                
                      <Text size='xsmall' color='text-xweak'>
                        Series Borrow History
                      </Text>              
                    </Box>
                }
                />
              </Box>}
            
              { !activeSeries?.isMature() &&
                activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) &&
                !mobile &&
                <Box alignSelf='end' margin={{ top:'medium' }}>
                  <FlatButton 
                    onClick={()=>setRepayOpen(true)}
                    label={
                      <Box direction='row' gap='small' align='center'>
                        <Box>
                          <Text size='xsmall' color='text-weak'>
                            <Text weight='bold' color={activeSeries?.seriesColor}>repay</Text> series debt
                          </Text>
                        </Box>
                        <ArrowRight color='text-weak' />
                      </Box>
                }
                  />
                </Box>}
            </Box>

          </Box>
        </Box>}

        { showTxPending && <TxStatus tx={txActive} />}

      </Keyboard>

      {mobile && 
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

          {!activeSeries?.isMature() &&
            activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) &&
            <NavLink 
              to={`/repay/${activeSeries?.maturity}`}
              style={{ textDecoration: 'none' }}
            >
              <Box direction='row' gap='small' align='center'>
                <Text size='xxsmall' color='text-weak'> <Text weight='bold' size='xsmall' color={activeSeries?.seriesColor}>repay </Text> debt </Text>
                <ArrowRight color={activeSeries?.seriesColor} />
              </Box>
            </NavLink>}
        </YieldMobileNav>}

    </RaisedBox>
    
  );
};

Borrow.defaultProps = { borrowAmount: null };

export default Borrow;
