import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { Keyboard, Box, TextInput, Text, ResponsiveContext, Collapsible, Layer, Stack } from 'grommet';

import { 
  FiClock as Clock,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';

import DaiMark from '../components/logos/DaiMark';

import { cleanValue, modColor } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { 
  useController,
  usePool,
  useMath,
  useProxy, 
  useTxActive, 
  useSignerAccount, 
  useDebounce,
  useIsLol,
} from '../hooks';

import SeriesDescriptor from '../components/SeriesDescriptor';
import InputWrap from '../components/InputWrap';
import ApprovalPending from '../components/ApprovalPending';
import TxStatus from '../components/TxStatus';
import InfoGrid from '../components/InfoGrid';
import ActionButton from '../components/ActionButton';
import RaisedButton from '../components/RaisedButton';
import FlatButton from '../components/FlatButton';
import Repay from './Repay';
import Loading from '../components/Loading';
import SeriesMatureBox from '../components/SeriesMatureBox';
import Authorization from '../components/Authorization';

interface IBorrowProps {
  borrowAmount?:number|null;
  openConnectLayer:any;
  setActiveView?:any; 
}

const Borrow = ({ openConnectLayer, setActiveView, borrowAmount }:IBorrowProps) => {

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { position, authorizations: { hasDelegatedProxy } } = userState;
  const { 
    ethPosted,
    ethPosted_,
    maxDaiAvailable,
    maxDaiAvailable_,
    ethTotalDebtDai_,
    collateralPercent_,
    daiBalance_,
  } = position;

  const screenSize = useContext(ResponsiveContext);

  /* hooks init */
  const { borrow }  = useController();
  const { previewPoolTx, callActive }  = usePool();
  const { borrowDai, borrowActive } = useProxy();
  const { yieldAPR, estCollRatio: estimateRatio } = useMath();
  const { account } = useSignerAccount();

  const [ txActive ] = useTxActive(['BORROW', 'BUY' ]);

  const [ repayOpen, setRepayOpen ] = useState<boolean>(false);

  /* input values */
  const [ inputValue, setInputValue ] = useState<any|undefined>(borrowAmount || undefined);
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
  const borrowProcedure = async (autoSell:boolean=true) => {
    if (inputValue && !borrowDisabled) {
      setBorrowPending(true);
      autoSell && await borrowDai(activeSeries, 'ETH-A', inputValue);
      !autoSell && await borrow('ETH-A', activeSeries.maturity, inputValue);
      setInputValue(undefined);
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
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
        setAPR( yieldAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries.maturity ) );      
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
      !hasDelegatedProxy ||  
      !inputValue ||
      parseFloat(inputValue) <= 0
    )? setBorrowDisabled(true): setBorrowDisabled(false);
  }, [ inputValue, hasDelegatedProxy ]);

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
  }, [ debouncedInput]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> borrowProcedure(inputValue)}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
      target='document'   
    >
      
      { repayOpen && 
        <Layer onClickOutside={()=>setRepayOpen(false)}>
          <Repay close={()=>setRepayOpen(false)} />      
        </Layer>}

      {/* <Stack anchor='top-left'> */}

      <SeriesDescriptor activeView='borrow'>


        <InfoGrid
          alt
          entries={[
            {
              label: null,
              visible: true,
              active: true,
              loading: false,
              value:null,
              valuePrefix: null,
              valueExtra: ()=>(
                <>
                  <Box
                    width={{ min:'175px' }}
                    margin={screenSize!=='small'?{ left:'-52px' }: { left:'-25px' }}
                    background='#555555FA' 
                    pad='small'
                    round={{ corner:'right', size:'xsmall' }}
                    elevation='small'
                  >
                    <FlatButton            
                      onClick={()=>setActiveView(0)}
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
                  !!account &&
                  parseFloat(ethPosted_) === 0,
              active: true,
              loading: false,    
              value: null,
              valuePrefix: null,
              valueExtra: ()=>(
                <Box width={{ min:'300px' }} direction='row' align='center' gap='small'> 
                  <Box align='center'> 
                    {screenSize==='small'? 
                      <Text size='xxlarge'>👆</Text>
                      :
                      <Text size='xxlarge'>👈</Text>}
                  </Box>
                  <Box gap='xsmall'>
                    <Box> 
                      <Text color='text-weak'> Before borrowing</Text>
                      <Text weight='bold' color='text-weak'> Deposit Collateral </Text>
                    </Box>
                    <Text size='xxsmall' color='text-weak'>
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
              visible: !txActive && activeSeries && !activeSeries.isMature() && !!account && parseFloat(ethPosted_) > 0,
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
              visible: !txActive && activeSeries && !activeSeries.isMature() && !!account && parseFloat(ethPosted_) > 0,
              active: collateralPercent_ > 0,
              loading: false,            
              value: (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '0%',
              valuePrefix: null,
              valueExtra: null,  
            },
            {
              label: 'Dai Balance',
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

      
      { txActive?.type !== 'BORROW' && txActive?.type !== 'BUY' &&  
      <Box
        width={{ max: '600px' }}
        alignSelf="center"
        fill
        background="background-front"
        round='small'
        pad="large"
        gap='small'
      >
        
        <Box gap='small' align='center' fill='horizontal'>

          { !activeSeries?.isMature() && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
          <Box gap='medium' align='center' fill='horizontal'>
            <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to borrow</Text>

            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={borrowDisabled}>
              <TextInput
                ref={(el:any) => {el && !repayOpen && el.focus(); setInputRef(el);}} 
                type="number"
                placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to borrow': 'DAI'} 
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
                    // valueExtra: () => (
                    //   <Text size='xsmall'>
                    //     {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                    //   </Text>
                    // ),
                  },
                  {
                    label: 'Like what you see?',
                    // labelExtra: 'the first step is to:',
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
                          color={inputValue? 'brand': 'brand-transparent'}
                          label={<Box pad='xsmall'><Text size='xsmall' color='brand'>Deposit collateral</Text></Box>}
                          onClick={() => setActiveView(0)}
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
              hasDelegatedPool={activeSeries.hasDelegatedPool}
            />}
          </Box>}

          { !activeSeries?.isMature() &&
            activeSeries?.ethDebtFYDai?.gt(ethers.constants.Zero) &&
            <Box alignSelf='end' margin={{ top:'medium' }}>
              <FlatButton 
                onClick={()=>setRepayOpen(true)}
                label={
                  <Box direction='row' gap='small' align='center'>
                    <Box>
                      <Text size='xsmall' color='text-weak'>
                        <Text weight='bold' color={activeSeries.seriesColor}>repay</Text> series debt
                      </Text>
                    </Box>
                    <ArrowRight color='text-weak' />
                  </Box>
                }
              />
            </Box>}

          { activeSeries?.isMature() &&
            <SeriesMatureBox />}
            
          { !txActive && 
            !!account && 
            activeSeries?.isMature() && 
            activeSeries?.ethDebtFYDai.gt(ethers.constants.Zero) && 
            <Repay />}
        </Box>
      </Box>}


      {/* If there is a transaction active, show the applicable view */}
      { borrowActive && !txActive && <ApprovalPending /> } 
      { txActive && <TxStatus msg={`You are borrowing ${inputValue} DAI`} tx={txActive} /> }


    </Keyboard>
  );
};

Borrow.defaultProps = { borrowAmount: null, setActiveView: 1 };

export default Borrow;
