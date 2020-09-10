import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Keyboard, Box, Button, TextInput, Text, ResponsiveContext } from 'grommet';

import { FiClock as Clock } from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { YieldContext } from '../contexts/YieldContext';
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
import TransactionPending from '../components/TransactionPending';
import InfoGrid from '../components/InfoGrid';
import Authorization from '../components/Authorization';

interface IBorrowProps {
  borrowAmount?:number|null;
  setActiveView?:any; 
}

const Borrow = ({ setActiveView, borrowAmount }:IBorrowProps) => {
  const { state: yieldState } = React.useContext(YieldContext);
  const { deployedContracts } = yieldState;
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState; 
  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const { position, authorizations: { hasDelegatedProxy } } = userState;
  const { 
    maxDaiAvailable_,
    collateralPercent_,
  } = position;

  const screenSize = React.useContext(ResponsiveContext);

  const { borrow }  = useController();
  const { previewPoolTx, callActive }  = usePool();
  const { 
    borrowDai, 
    borrowActive 
  } = useProxy();
  const { 
    yieldAPR, 
    estCollRatio: estimateRatio
  } = useMath();
  const { account } = useSignerAccount();

  /* internal component state */
  const [ borrowPending, setBorrowPending ] = React.useState<boolean>(false);
  const [ borrowDisabled, setBorrowDisabled ] = React.useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  /* input values */
  const [ inputValue, setInputValue ] = React.useState<any|undefined>(borrowAmount || undefined);
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = React.useState<any>(null);

  /* token balances and calculated values */
  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);
  const [ APR, setAPR ] = React.useState<number>();
  const [ estRatio, setEstRatio ] = React.useState<any>(0);

  const [ txActive ] = useTxActive(['BORROW', 'BUY' ]);

  // const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(()=> { console.log(document.activeElement === inputRef); }, [inputRef]);

  /* Borrow execution flow */
  const borrowProcedure = async (value:number|undefined, autoSell:boolean=true) => {
    if (value&&value>0 && !borrowDisabled) {
      setBorrowPending(true);
      autoSell && await borrowDai(activeSeries, 'ETH-A', yDaiValue, value);
      !autoSell && await borrow('ETH-A', activeSeries.maturity, value);
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
  * 1. dai to yDai conversion and get APR (yDai needed to compare with the approved allowance)
  * 2. calcalute yield APR
  * 3. calculate estimated collateralisation ration
  */
  useEffect(() => {   
    activeSeries && debouncedInput>0 && ( async () => {
      const newRatio = estimateRatio(position.ethPosted_, ( position.debtValue_+ parseFloat(debouncedInput)) ); 
      newRatio && setEstRatio(newRatio.toFixed(0));
      const preview = await previewPoolTx('buyDai', activeSeries, debouncedInput);
      if (preview && !preview.isZero()) {
        setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        setAPR( yieldAPR( ethers.utils.parseEther(debouncedInput.toString()), preview, activeSeries.maturity ) );      
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('buyDai', activeSeries, 1);
        rate && setYDaiValue(debouncedInput* parseFloat((ethers.utils.formatEther(rate))));
        setBorrowDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [debouncedInput, activeSeries]);
    
  /* Handle borrow disabling deposits */
  useEffect(()=>{
    (
      !account ||
      !hasDelegatedProxy ||
      position.ethPosted_ <= 0 ||
      estRatio <= 2 ||
      inputValue >= maxDaiAvailable_||
      inputValue<=0
    )? setBorrowDisabled(true): setBorrowDisabled(false);
  }, [ callActive, inputValue, hasDelegatedProxy, estRatio ]);

  /* Handle input exception logic */
  useEffect(() => {
    if ( debouncedInput && debouncedInput >= maxDaiAvailable_ ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you can borrow based on your collateral'); 
    } else if (debouncedInput && ( debouncedInput > Math.round(maxDaiAvailable_- maxDaiAvailable_*0.05 ) ) ) {
      setErrorMsg(null);
      setWarningMsg('If you borrow right up to your maximum allowance, there is high probability you will be liquidated!');
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> borrowProcedure(inputValue)}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
      target='document'   
    >
      <SeriesDescriptor activeView='borrow'>

        { hasDelegatedProxy &&
          <InfoGrid entries={[
            {
              label: 'Current Debt',
              visible: !txActive && !!account && activeSeries && !activeSeries?.isMature() || (activeSeries?.isMature() && activeSeries?.ethDebtYDai_ > 0 ),
              active: true,
              loading: borrowPending,    
              value: activeSeries?.ethDebtYDai_? `${activeSeries.ethDebtYDai_.toFixed(2)} DAI`: '0 DAI',
              valuePrefix: null,
              valueExtra: null, 
            },
            {
              label: 'Max Borrowing Power',
              visible: !txActive && activeSeries && !activeSeries.isMature()  && !!account,
              active: maxDaiAvailable_,
              loading: borrowPending,
              value: maxDaiAvailable_ ? `${maxDaiAvailable_.toFixed(2)} DAI`: '',           
              valuePrefix: 'Approx.',
              valueExtra: null,
            },
            {
              label: 'Repay Debt',
              visible: !txActive && !!account && activeSeries?.isMature() && activeSeries?.ethDebtYDai_ > 0,
              active: true,
              loading: false,    
              value: '',
              valuePrefix: null,
              valueExtra: () => (
                <Button
                  color='brand-transparent'
                  label={<Text size='xsmall' color='brand'>Repay debt</Text>}
                  onClick={() => setActiveView(2)}
                  hoverIndicator='brand-transparent'
                /> 
              ),
            },
          ]}
          /> }
      </SeriesDescriptor>

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
          { activeSeries && !activeSeries?.isMature() && 
            <Box gap='medium' align='center' fill='horizontal'>
              <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to borrow</Text>

              <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={borrowDisabled}>
                <TextInput
                  ref={(el:any) => {el && el.focus(); setInputRef(el);}} 
                  type="number"
                  placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to borrow': 'DAI'} 
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
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
                  value: `${yDaiValue.toFixed(2)} DAI`,
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
                        ( (collateralPercent_- estRatio) > 0) &&
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
                      <Button
                        color={inputValue? 'brand': 'brand-transparent'}
                        label={<Text size='xsmall' color='brand'>Connect a wallet</Text>}
                        onClick={()=>console.log('still to implement')}
                        hoverIndicator='brand-transparent'
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
                    <Button
                      color={inputValue? 'brand': 'brand-transparent'}
                      label={<Text size='xsmall' color='brand'>Deposit collateral</Text>}
                      onClick={() => setActiveView(0)}
                      hoverIndicator='brand-transparent'
                    /> 
                  )
                },
              ]}
              />

              { account &&          
              <Box
                fill='horizontal'
                round='small' 
                background={borrowDisabled ? 'brand-transparent' : 'brand'} 
                onClick={()=>borrowProcedure(inputValue)} 
                align='center'
                pad='small'
              >
                <Text 
                  weight='bold'
                  size='large'
                  color={borrowDisabled ? 'text-xweak' : 'text'}
                >
                  {`Borrow ${inputValue || ''} DAI`}
                </Text>
              </Box>}
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
      { txActive && <TransactionPending msg={`You are borrowing ${inputValue} DAI`} tx={txActive} /> }
    </Keyboard>
  );
};

Borrow.defaultProps = { borrowAmount: null, setActiveView: 1 };

export default Borrow;
