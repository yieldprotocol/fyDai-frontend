import React, { useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { Box, Button, TextInput, Text, ResponsiveContext, Keyboard } from 'grommet';

import DaiMark from '../components/logos/DaiMark';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import {
  usePool,
  useProxy,
  useTxActive,
  useSignerAccount
} from '../hooks';

import SeriesDescriptor from '../components/SeriesDescriptor';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';

interface IRepayProps {
  repayAmount?:any
}

function Repay({ repayAmount }:IRepayProps) {
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance_ } = userState.position;
  const screenSize = React.useContext(ResponsiveContext);

  const [ hasDelegated, setHasDelegated ] = React.useState<boolean>(true);

  const { previewPoolTx }  = usePool(); 
  const { repayDaiDebt, repayActive } = useProxy();
  const [ txActive ] = useTxActive(['repay']);
  const { account } = useSignerAccount();

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ yDaiValue, setYDaiValue ] = React.useState<any>();

  const [ repayPending, setRepayPending ] = React.useState<boolean>(false);
  const [ repayDisabled, setRepayDisabled ] = React.useState<boolean>(true);

  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const repayProcedure = async (value:number) => {
    if (!repayDisabled) {
      setRepayPending(true); 
      /* repay using proxy */
      await repayDaiDebt(activeSeries, 'ETH-A', 1, value);
      setInputValue('');
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setRepayPending(false);
    }
  };

  /* Handle dai to yDai conversion  (needed to set a min yDai value for repayment) */
  useEffect(() => {
    activeSeries && inputValue > 0 && ( async () => {
      const preview = await previewPoolTx('sellDai', activeSeries.poolAddress, inputValue);
      if (!preview.isZero()) {
        setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('sellDai', activeSeries.poolAddress, 1);
        setYDaiValue(inputValue* parseFloat((ethers.utils.formatEther(rate))) );
        // setRepayDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [inputValue]);

  /* Repay disabling logic */
  useEffect(()=>{
    (
      !daiBalance_ ||
      !account ||
      !hasDelegated ||
      !inputValue ||
      parseInt(inputValue, 10) === 0
    )? setRepayDisabled(true): setRepayDisabled(false);
  }, [ inputValue, hasDelegated ]);

  /* Handle input warnings and errors */ 
  useEffect(() => {
    if ( inputValue  && daiBalance_ && ( inputValue > daiBalance_ ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai in your wallet'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  useEffect(() => {
    ( async ()=>{
    })();
  }, [ activeSeries ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> repayProcedure(inputValue)}
      target='document'
    >
      <>
        { !txActive &&
        <Box flex='grow' justify='between'>
          <Box gap='medium' align='center' fill='horizontal'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text>

            <SeriesDescriptor activeView='borrow' />

            <InfoGrid entries={[
              {
                label: 'Current Debt',
                visible: !!account,
                active: true,
                loading: repayPending,     
                value: activeSeries?.ethDebtYDai_? `${activeSeries.ethDebtYDai_.toFixed(2)} DAI`: 'O DAI',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Dai balance',
                visible: !!account,
                active: true,
                loading: repayPending,            
                value: daiBalance_?`${daiBalance_.toFixed(2)} DAI`: '-',
                valuePrefix: null,
                valueExtra: null,
              },
            ]}
            />

            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to Repay</Text>

            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={repayDisabled}>
              <TextInput
                type="number"
                placeholder={screenSize !== 'small' ? 'Enter the amount of Dai to Repay': 'DAI'}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<DaiMark />}
              />
              <Button 
                label={<Text size='xsmall' color='brand'> {screenSize !== 'small' ? 'Repay Maximum': 'Max'}</Text>}
                color='brand-transparent'
                onClick={()=>setInputValue(daiBalance_)}
                hoverIndicator='brand-transparent'
              />
            </InputWrap>
      
            <> 
              <Box
                fill='horizontal'
                round='small'
                background={repayDisabled ? 'brand-transparent' : 'brand'}
                onClick={()=>repayProcedure(inputValue)}
                align='center'
                pad='small'
              >
                <Text 
                  weight='bold'
                  size='large'
                  color={repayDisabled ? 'text-xweak' : 'text'}
                >
                  {`Repay ${inputValue || ''} DAI`}
                </Text>
              </Box>
            </>            
          </Box>
        </Box>}
        { repayActive && !txActive && <ApprovalPending /> } 
        { txActive && <TransactionPending msg={`You made a repayment of ${inputValue} DAI.`} tx={txActive} /> }
      </>
    </Keyboard>
  );
}

Repay.defaultProps = { repayAmount:null };

export default Repay;
