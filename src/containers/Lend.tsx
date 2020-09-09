import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Keyboard, TextInput, Text, ResponsiveContext } from 'grommet';

import { 
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
  
import { 
  usePool, 
  useMath,
  useSignerAccount, 
  useTxActive, 
  useProxy,
} from '../hooks';

import WithdrawDai from './WithdrawDai';
import Redeem from './Redeem';

import InputWrap from '../components/InputWrap';
import InfoGrid from '../components/InfoGrid';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';
import SeriesDescriptor from '../components/SeriesDescriptor';

interface ILendProps {
  lendAmount?:any
}
  
const Lend = ({ lendAmount }:ILendProps) => {
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState;

  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const { daiBalance_ } = userState.position;

  const screenSize = React.useContext(ResponsiveContext);

  const { previewPoolTx } = usePool();
  const { sellDai, sellActive } = useProxy();
  const { yieldAPR } = useMath();
  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['SELL_DAI']);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const [ withdrawDaiOpen, setWithdrawDaiOpen ] = useState<boolean>(false);
  
  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ lendDisabled, setLendDisabled ] = React.useState<boolean>(true);
  const [ lendPending, setLendPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const [ APR, setAPR ] = React.useState<number>();
  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);
  const [ currentValue, setCurrentValue ] = React.useState<number>(0);
  
  /* Lend execution flow */
  const lendProcedure = async (value:number) => {
    if (!lendDisabled ) {
      setLendPending(true);
      await sellDai(
        activeSeries,
        value
      );
      setInputValue('');
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setLendPending(false);
    }  
  };

  /* Handle input changes */
  useEffect(() => {
    activeSeries && !(activeSeries.isMature()) && inputValue && ( async () => {
      const preview = await previewPoolTx('sellDai', activeSeries, inputValue);
      preview && setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
      preview && setAPR( yieldAPR( ethers.utils.parseEther(inputValue.toString()), preview, activeSeries.maturity ) );
    })();
  }, [inputValue]);

  /* handle active series loads and changes */
  useEffect(() => {
    account && activeSeries?.yDaiBalance_ && !(activeSeries.isMature()) && ( async () => {
      const preview = await previewPoolTx('SellYDai', activeSeries, activeSeries.yDaiBalance_);
      preview && setCurrentValue( parseFloat(ethers.utils.formatEther(preview)));
    })();
  }, [ activeSeries, account ]);
  
  /* Lend button disabling logic */
  useEffect(()=>{
    (
      inputValue > daiBalance_ ||
      !account ||
      !hasDelegated ||
      !inputValue || 
      parseFloat(inputValue) === 0
    )? setLendDisabled(true): setLendDisabled(false);
  }, [ inputValue, hasDelegated ]);


  /* handle exceptions, errors and warnings */
  useEffect(() => {
    if ( !!account && inputValue && inputValue > daiBalance_  ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you have'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> lendProcedure(inputValue)}
      onBackspace={()=> inputValue && setInputValue(inputValue.toString().slice(0, -1))}
      target='document'
    >
      { withdrawDaiOpen && <WithdrawDai close={()=>setWithdrawDaiOpen(false)} /> }
      <SeriesDescriptor activeView='lend'>
        <InfoGrid entries={[
          {
            label: 'Portfolio Value at Maturity',
            visible: !!account && !txActive,
            active: true,
            loading: lendPending,     
            value: activeSeries && `${activeSeries?.yDaiBalance_.toFixed(2)} DAI` || '-',
            valuePrefix: null,
            valueExtra: null, 
          },
          {
            label: 'Current Value',
            visible: !!account && !txActive,
            active: true,
            loading: lendPending,           
            value: currentValue!==0?`${currentValue.toFixed(2)} DAI`: '-',
            valuePrefix: null,
            valueExtra: null,
          },

          {
            label: 'Dai balance',
            visible: !!account && !txActive,
            active: true,
            loading: lendPending,            
            value: daiBalance_?`${daiBalance_.toFixed(2)} DAI`: '0 DAI',
            valuePrefix: null,
            valueExtra: null,
          },
        ]}
        />
      </SeriesDescriptor>
      
      {/* If there is no applicable transaction active, show the lending page */}
      { !txActive &&
      <Box
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
        pad='large'
        gap='medium'
      >
        <Box flex='grow' gap='small' align='center' fill='horizontal'>
          {/* If the series has NOT matured, show the lending input */}
          { !activeSeries?.isMature() &&
          <Box fill gap='medium'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to lend</Text>
            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={lendDisabled}>
              <TextInput
                ref={(input:any) => input && !withdrawDaiOpen && input.focus()}
                type="number"
                placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to lend': 'DAI'}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<DaiMark />}
              />
              {account &&
              <Button 
                label={<Text size='xsmall' color='brand'> {screenSize !== 'small' ? 'Lend Maximum': 'Max'}</Text>}
                color='brand-transparent'
                onClick={()=>setInputValue(daiBalance_)}
                hoverIndicator='brand-transparent'
              />}
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
                label: 'Approx. Dai received at maturity',
                visible: true,
                active: inputValue,
                loading: false,           
                value: `${yDaiValue.toFixed(2)} DAI`,
                valuePrefix: null,
                valueExtra: null,
                //   valueExtra: () => (
                //   <Text size='xxsmall'>
                //     {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                //   </Text>
                // ),
              },
              {
                label: 'Like what you see?',
                visible: !account && inputValue>0,
                active: inputValue,
                loading: false,            
                value: '',
                valuePrefix: null,
                valueExtra: () => (
                  <Button
                    color='brand-transparent'
                    label={<Text size='xsmall' color='brand'>Connect a wallet</Text>}
                    onClick={()=>console.log('still to implement')}
                    hoverIndicator='brand-transparent'
                  /> 
                )
              },
            ]}
            />
          </Box>}
  
          { account && !activeSeries?.isMature() && 
          <Box gap='small' fill='horizontal' align='center'>

            <Box
              fill='horizontal'
              round='small'
              background={lendDisabled ? 'brand-transparent' : 'brand'}
              onClick={()=>lendProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text 
                weight='bold'
                size='large'
                color={lendDisabled ? 'text-xweak' : 'text'}
              >
                {`Lend ${inputValue || ''} DAI`}
              </Text>
            </Box>

            { activeSeries?.yDaiBalance_ > 0 &&
            <Box alignSelf='end'>
              <Box
                round
                onClick={()=>setWithdrawDaiOpen(true)}
                hoverIndicator='brand-transparent'
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Box direction='row' gap='small'>
                  <Text size='xsmall' color='text-weak'> Alternatively, close your position in this series</Text>
                  <ArrowRight color='text-weak' />
                </Box>
              </Box>
            </Box> }         
          </Box>}

          {/* If the series is mature show the redeem view */}
          { activeSeries?.isMature() &&
          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Redeem />
          </Box>}
        </Box>
      </Box>}

      {/* If there is a transaction active, show the applicable view */}
      { sellActive && !txActive && <ApprovalPending /> } 
      { txActive && <TransactionPending msg={`You are lending ${inputValue} DAI`} tx={txActive} /> }
    </Keyboard>
  );
};

Lend.defaultProps={ lendAmount:null };

export default Lend;