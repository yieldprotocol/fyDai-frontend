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
  useSignerAccount
} from '../hooks';

import SeriesDescriptor from '../components/SeriesDescriptor';
import InputWrap from '../components/InputWrap';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';
import InfoGrid from '../components/InfoGrid';
import Authorization from '../components/Authorization';

interface IBorrowProps {
  borrowAmount?:number|null;
}

const Borrow = ({ borrowAmount }:IBorrowProps) => {
  const { state: yieldState } = React.useContext(YieldContext);
  const { deployedContracts } = yieldState;
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState; 
  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const { position, authorizations: { hasDelegatedProxy } } = userState;
  const { 
    maxDaiAvailable_,
    // ethBorrowingPower_,
    collateralPercent_,
  } = position;

  const screenSize = React.useContext(ResponsiveContext);

  const { borrow }  = useController();
  const { previewPoolTx }  = usePool();
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

  /* token balances and values */
  const [ inputValue, setInputValue ] = React.useState<any>(borrowAmount || undefined);
  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);
  const [ APR, setAPR ] = React.useState<number>();
  const [ estRatio, setEstRatio ] = React.useState<any>(0);

  const [ txActive ] = useTxActive(['BORROW', 'BUY', 'DELEGATION']);

  // const inputRef = React.useRef<HTMLInputElement>(null);
  // React.useEffect(()=> { inputRef.current && inputRef.current.focus(); }, []);

  /* Borrow execution flow */
  const borrowProcedure = async (value:number, autoSell:boolean=true) => {
    if (!borrowDisabled) {
      setBorrowPending(true);
      autoSell && await borrowDai(activeSeries, 'ETH-A', yDaiValue, value);
      !autoSell && await borrow('ETH-A', activeSeries.maturity, value);
      setInputValue('');
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setBorrowPending(false);
    }
  };

  /* 
  * Handle input changes:
  * 1. dai to yDai conversion and get APR (yDai needed to compare with the approved allowance)
  * 2. calcalute yield APR
  * 3. calculate estimated collateralisation ration
  */
  useEffect(() => {   
    activeSeries && parseFloat(inputValue) > 0 && ( async () => {
      const newRatio = estimateRatio(position.ethPosted_, ( position.debtValue_+ parseFloat(inputValue)) ); 
      newRatio && setEstRatio(newRatio.toFixed(0));
      const preview = await previewPoolTx('buyDai', activeSeries, inputValue);
      if (preview && !preview.isZero()) {
        setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
        setAPR( yieldAPR( ethers.utils.parseEther(inputValue.toString()), preview, activeSeries.maturity ) );      
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('buyDai', activeSeries, 1);
        rate && setYDaiValue(inputValue* parseFloat((ethers.utils.formatEther(rate))));
        setBorrowDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [inputValue, activeSeries]);

  /* check delegation status on series change */
  useEffect(() => {
    activeSeries && ( async ()=>{
      // setHasDelegated(activeSeries.hasDelegatedController);
    })();
  }, [ activeSeries ]);
    
  /* Handle borrow disabling deposits */
  useEffect(()=>{
    (
      position.ethPosted_ <= 0 ||
      estRatio <= 2 ||
      inputValue >= maxDaiAvailable_ ||
      !account ||
      !hasDelegatedProxy ||
      !inputValue ||
      parseFloat(inputValue) === 0
    )? setBorrowDisabled(true): setBorrowDisabled(false);
  }, [ inputValue, hasDelegatedProxy, estRatio ]);

  /* Handle collateralisation ratio exceptions and warnings */
  // useEffect(()=>{
  //   if (estRatio && estRatio <= 2) {
  //     setErrorMsg('That amount exceeds the amount of Dai you can borrow based on your collateral');
  //     setWarningMsg(null);
  //   } else if (estRatio > 2 && estRatio < 2.5 ) {
  //     setWarningMsg('Borrowing that much will put you at risk of liquidation');
  //     setErrorMsg(null);
  //   } else {
  //     setWarningMsg(null);
  //     setErrorMsg(null);
  //   }
  // }, [ estRatio ]);

  /* Handle input exception logic */
  useEffect(() => {
    if ( inputValue && parseFloat(inputValue) >= maxDaiAvailable_ ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you can borrow based on your collateral'); 
    } else if (inputValue && ( inputValue > Math.round(maxDaiAvailable_- maxDaiAvailable_*0.05 ) ) ) {
      setErrorMsg(null);
      setWarningMsg('If you borrow right up to your maximum allowance, there is high probability you will be liquidated!');
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> borrowProcedure(inputValue)}
      onBackspace={()=> inputValue && setInputValue(inputValue.toString().slice(0, -1))}
      target='document'   
    >
      <>
        {/* If there is no applicable transaction active, show the lending page */}
        { txActive?.type !== 'BORROW' && txActive?.type !== 'BUY' &&       
        <Box flex='grow' justify='between'>
          <Box gap='medium' align='center' fill='horizontal'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text>

            <SeriesDescriptor activeView='borrow' />

            { hasDelegatedProxy &&
              <InfoGrid entries={[
                {
                  label: 'Current Debt',
                  visible: !!account && activeSeries && !activeSeries?.isMature() || (activeSeries?.isMature() && activeSeries?.ethDebtYDai_ > 0 ),
                  active: true,
                  loading: borrowPending,    
                  value: activeSeries?.ethDebtYDai_? `${activeSeries.ethDebtYDai_.toFixed(2)} DAI`: '0 DAI',
                  valuePrefix: null,
                  valueExtra: null, 
                },
                {
                  label: 'Max Borrowing Power',
                  visible: activeSeries && !activeSeries.isMature()  && !!account,
                  active: maxDaiAvailable_,
                  loading: borrowPending,
                  value: maxDaiAvailable_ ? `${maxDaiAvailable_.toFixed(2)} DAI`: '',           
                  valuePrefix: 'Approx.',
                  valueExtra: null,
                },
                {
                  label: 'Repay Debt',
                  visible: !!account && activeSeries?.isMature() && activeSeries?.ethDebtYDai_ > 0,
                  active: true,
                  loading: false,    
                  value: '',
                  valuePrefix: null,
                  valueExtra: () => (
                    <Button
                      color='brand-transparent'
                      label={<Text size='xsmall' color='brand'>Repay debt</Text>}
                      onClick={()=>console.log('still to implement')}
                      hoverIndicator='brand-transparent'
                    /> 
                  ),
                },
              ]}
              /> }

            { activeSeries && !activeSeries?.isMature() && 
              <Box gap='medium' align='center' fill='horizontal'>
                <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to borrow</Text>

                <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={borrowDisabled}>
                  <TextInput
                    ref={(input:any) => input && input.focus()}
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
                    active: inputValue,
                    loading: false,     
                    value: APR?`${APR.toFixed(2)}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                    valuePrefix: null,
                    valueExtra: null, 
                  },
                  {
                    label: 'Approx. Dai owed at maturity',
                    visible: true,
                    active: inputValue,
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
                    active: inputValue,
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
                    visible: !account && inputValue,
                    active: inputValue,
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
                    visible: inputValue>0 && !!account && position.ethPosted <= 0,
                    active: inputValue,
                    loading: false,            
                    value: '',
                    valuePrefix: null,
                    valueExtra: () => (
                      <Button
                        color={inputValue? 'brand': 'brand-transparent'}
                        label={<Text size='xsmall' color='brand'>Deposit collateral</Text>}
                        onClick={()=>console.log('still to implement')}
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
        { txActive && <TransactionPending msg={`You borrowed ${inputValue} DAI.`} tx={txActive} /> }
      </>
    </Keyboard>
  );
};

Borrow.defaultProps = { borrowAmount: null };

export default Borrow;
