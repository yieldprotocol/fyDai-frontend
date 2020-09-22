import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { Keyboard, Box, Button, TextInput, Text, ResponsiveContext, Collapsible } from 'grommet';

import { 
  FiClock as Clock,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';

import DaiMark from '../components/logos/DaiMark';

import { cleanValue } from '../utils';

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
} from '../hooks';

import SeriesDescriptor from '../components/SeriesDescriptor';
import InputWrap from '../components/InputWrap';
import ApprovalPending from '../components/ApprovalPending';
import TxPending from '../components/TxPending';
import InfoGrid from '../components/InfoGrid';
import ActionButton from '../components/ActionButton';
import RaisedButton from '../components/RaisedButton';
import FlatButton from '../components/FlatButton';
import Repay from './Repay';

interface IBorrowProps {
  borrowAmount?:number|null;
  setActiveView?:any; 
}

const Borrow = ({ setActiveView, borrowAmount }:IBorrowProps) => {

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { position, authorizations: { hasDelegatedProxy } } = userState;
  const { 
    ethPosted,
    maxDaiAvailable,
    maxDaiAvailable_,
    collateralPercent_,
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

  /* internal component state */
  const [ borrowPending, setBorrowPending ] = useState<boolean>(false);
  const [ borrowDisabled, setBorrowDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  /* input values */
  const [ inputValue, setInputValue ] = useState<any|undefined>(borrowAmount || undefined);
  const debouncedInput = useDebounce(inputValue, 500);

  const [inputRef, setInputRef] = useState<any>(null);

  /* token balances and calculated values */
  const [ eDaiValue, setEDaiValue ] = useState<number>(0);
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
  * 1. dai to eDai conversion and get APR (eDai needed to compare with the approved allowance)
  * 2. calcalute yield APR
  * 3. calculate estimated collateralisation ration
  */
  useEffect(() => {

    account && position && debouncedInput>0 && ( async () => {
      const newRatio = estimateRatio(
        position.ethPosted, 
        ( position.debtValue.add(ethers.utils.parseEther(debouncedInput)) )
      ); 
      newRatio && setEstRatio(parseFloat(newRatio.toString()));
    })();

    activeSeries && debouncedInput>0 && ( async () => {
      const preview = await previewPoolTx('buyDai', activeSeries, debouncedInput);
      if (!(preview instanceof Error)) {
        setEDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        setAPR( yieldAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries.maturity ) );      
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('buyDai', activeSeries, 1);
        !(rate instanceof Error) && setEDaiValue(debouncedInput*parseFloat((ethers.utils.formatEther(rate))));
        (rate instanceof Error) && setEDaiValue(0);
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
      parseFloat(inputValue) === 0
    )? setBorrowDisabled(true): setBorrowDisabled(false);
  }, [ inputValue, hasDelegatedProxy ]);

  /* Handle input exception logic */
  useEffect(() => {

    if ( debouncedInput && maxDaiAvailable && ethers.utils.parseEther(debouncedInput).gte(maxDaiAvailable) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you can borrow based on your collateral'); 
    } else if (debouncedInput && ( debouncedInput > Math.round(maxDaiAvailable_- maxDaiAvailable_*0.05 ) ) ) {
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

      { repayOpen && <Repay close={()=>setRepayOpen(false)} /> }

      <Collapsible open={!!activeSeries}>
        <SeriesDescriptor activeView='borrow'>
          { hasDelegatedProxy &&
          <InfoGrid
            alt
            entries={[
              {
                label: 'Current Debt',
                visible: (!activeSeries?.isMature() && !txActive)  || (activeSeries?.isMature() && activeSeries?.ethDebtEDai_ > 0 ),
                active: true,
                loading: borrowPending,    
                value: activeSeries?.ethDebtEDai_? `${activeSeries.ethDebtEDai_} DAI`: '0 DAI',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Max Borrowing Power',
                visible: !txActive && activeSeries && !activeSeries.isMature()  && !!account,
                active: maxDaiAvailable_,
                loading: borrowPending,
                value: maxDaiAvailable_? `${maxDaiAvailable_} DAI`: '0 DAI',           
                valuePrefix: 'Approx.',
                valueExtra: null,
              },
              {
                label: 'Repay Debt',
                visible: !txActive && !!account && activeSeries?.isMature() && activeSeries?.ethDebtEDai_ > 0,
                active: true,
                loading: false,    
                value: '',
                valuePrefix: null,
                valueExtra: () => (
                  <RaisedButton
                    label={<Text size='xsmall' color='brand'>Repay debt</Text>}
                    onClick={() => setActiveView(2)}
                  /> 
                ),
              },
            ]} 
          /> }
        </SeriesDescriptor>
      </Collapsible>

      { txActive?.type !== 'BORROW' && txActive?.type !== 'BUY' &&   
      <Box
        width={{ max: '750px' }}
        alignSelf="center"
        fill
        background="background-front"
        round='small'
        pad="large"
      >

        <Box gap='medium' align='center' fill='horizontal'>
          { !activeSeries?.isMature() && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
            <Box gap='medium' align='center' fill='horizontal'>
              <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to borrow</Text>

              <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={borrowDisabled}>
                <TextInput
                  ref={(el:any) => {el && !repayOpen && el.focus(); setInputRef(el);}} 
                  type="number"
                  placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to borrow': 'DAI'} 
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue( cleanValue(event.target.value) )}
                  icon={<DaiMark />}
                />
              </InputWrap>

              <InfoGrid entries={[
                {
                  label: 'Estimated APR',
                  visible: true,
                  active: !!inputValue&&inputValue>0,
                  loading: false,    
                  value: APR?`${APR.toFixed(2)}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                  valuePrefix: null,
                  valueExtra: null, 
                },
                {
                  label: 'Approx. Dai owed at maturity',
                  visible: true,
                  active: !!inputValue&&inputValue>0,
                  loading: false,          
                  value: `${eDaiValue.toFixed(2)} DAI`,
                  valuePrefix: null,
                  // valueExtra: () => (
                  //   <Text size='xxsmall'>
                  //     {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                  //   </Text>
                  // ),
                },

                {
                  label: 'Ratio after Borrow',
                  visible: !!account && position.ethPosted_>0,
                  active: !!inputValue&&inputValue>0,
                  loading: false,        
                  value: (estRatio && estRatio !== 0)? `${estRatio}%`: collateralPercent_ || '',
                  valuePrefix: 'Approx.',
                  valueExtra: () => (
                    <Text color='red' size='small'> 
                      { inputValue &&
                        estRatio &&
                        ( (collateralPercent_-estRatio) > 0) &&
                        `(-${(collateralPercent_-estRatio).toFixed(0)}%)` }
                    </Text>
                  )
                },
                {
                  label: 'Like what you see?',
                  visible: !account && !!inputValue&&inputValue>0,
                  active: !!inputValue&&inputValue>0,
                  loading: false,            
                  value: '',
                  valuePrefix: null,
                  valueExtra: () => (
                    <Box>
                      <RaisedButton
                        label={<Text size='xsmall' color='brand'>Connect a wallet</Text>}
                        onClick={()=>console.log('still to implement')}
                      /> 
                    </Box>
                  )
                },
                {
                  label: 'Want to borrow Dai?',
                  visible: !!inputValue&&inputValue>0 && !!account && position.ethPosted <= 0,
                  active: !!inputValue,
                  loading: false,            
                  value: '',
                  valuePrefix: null,
                  valueExtra: () => (
                    <RaisedButton
                      color={inputValue? 'brand': 'brand-transparent'}
                      label={<Text size='xsmall' color='brand'>Deposit collateral</Text>}
                      onClick={() => setActiveView(0)}
                    /> 
                  )
                },
              ]}
              />
              { account &&  
              <ActionButton
                onClick={()=>borrowProcedure()}
                label={`Borrow ${inputValue || ''} DAI`}
                disabled={borrowDisabled}
              />}
            </Box>}
       
          { activeSeries?.ethDebtEDai_ > 0 &&
            <Box alignSelf='end'>
              <FlatButton 
                onClick={()=>setRepayOpen(true)}
                label={
                  <Box direction='row' gap='small' align='center'>
                    <Box><Text size='xsmall' color='text-weak'>alternatively, <Text weight='bold'>repay</Text> series debt</Text></Box>
                    <ArrowRight color='text-weak' />
                  </Box>
                }
              />
            </Box>}

          { activeSeries && activeSeries.isMature() &&
            <Box 
              gap='medium' 
              margin={{ vertical:'large' }}  
              pad='medium'     
              round='small'
              fill='horizontal'
              border='all'
            >    
              <Box direction='row' gap='small' align='center' fill>          
                <Box>
                  <Clock />
                </Box>
                <Box> 
                  <Text size='small' color='brand'> This series has matured.</Text>         
                </Box>
              </Box>             
            </Box>}

        </Box>
      </Box> }

      {/* If there is a transaction active, show the applicable view */}
      { borrowActive && !txActive && <ApprovalPending /> } 
      { txActive && <TxPending msg={`You are borrowing ${inputValue} DAI`} tx={txActive} /> }
    </Keyboard>
  );
};

Borrow.defaultProps = { borrowAmount: null, setActiveView: 1 };

export default Borrow;
