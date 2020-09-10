import React, { useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { Box, Button, TextInput, Text, ResponsiveContext, Keyboard } from 'grommet';

import { FiCheckCircle as Check } from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import {
  usePool,
  useProxy,
  useTxActive,
  useSignerAccount,
} from '../hooks';

import SeriesDescriptor from '../components/SeriesDescriptor';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';

interface IRepayProps {
  repayAmount?:any
  setActiveView?: any;
}

function Repay({ setActiveView, repayAmount }:IRepayProps) {
  const { state: { deployedContracts } } = React.useContext(YieldContext);
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
      await repayDaiDebt(activeSeries, 'ETH-A', value);
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
      const preview = await previewPoolTx('sellDai', activeSeries, inputValue);
      if (preview && !preview.isZero()) {
        setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('sellDai', activeSeries, 1);
        rate && setYDaiValue(inputValue* parseFloat((ethers.utils.formatEther(rate))) );
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
      parseFloat(inputValue) === 0
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
      onBackspace={()=> inputValue && setInputValue(inputValue.toString().slice(0, -1))}
      target='document'
    >
      <SeriesDescriptor activeView='borrow'> 
        <InfoGrid entries={[
          {
            label: 'Current Debt',
            visible: !!account && !txActive,
            active: true,
            loading: repayPending,     
            value: activeSeries?.ethDebtYDai_? `${activeSeries.ethDebtYDai_.toFixed(2)} DAI`: '0 DAI',
            valuePrefix: null,
            valueExtra: null, 
          },
          {
            label: 'Dai balance',
            visible: !!account && !txActive,
            active: true,
            loading: repayPending,            
            value: daiBalance_?`${daiBalance_.toFixed(2)} DAI`: '-',
            valuePrefix: null,
            valueExtra: null,
          },
        ]}
        />
      </SeriesDescriptor>

      { !txActive &&

      <Box
        width={{ max: '750px' }}
        alignSelf="center"
        fill
        background="background-front"
        round='small'
        pad="large"
      >
        <Box flex='grow' justify='between'>
          <Box gap='medium' align='center' fill='horizontal'>

            { (activeSeries?.ethDebtYDai_.toFixed(2) > 0) ?
             
              <Box gap='medium' align='center' fill='horizontal'>
                <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to Repay</Text>

                <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={repayDisabled}>
                  <TextInput
                    ref={(input:any) => input && input.focus()}
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
                    onClick={()=>setInputValue(activeSeries?.ethDebtYDai_)}
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
              </Box> :

              <Box 
                gap='medium' 
                margin={{ vertical:'large' }}  
                pad='medium'     
                round='small'
                fill='horizontal'
                border='all'
              >    
                <Box direction='row' justify='center' fill>          
                  <Box direction='row' gap='small' align='center'>
                    <Box>
                      <Check />
                    </Box>
                    <Box> 
                      <Text size='small' color='brand'>You do not have any debt in this series.</Text>         
                    </Box>
                  </Box>
                  {/* <Button label='borrow Dai from this series' /> */}
                </Box>             
              </Box>}            
          </Box>
        </Box>
      </Box>}
      { repayActive && !txActive && <ApprovalPending /> } 
      { txActive && <TransactionPending msg={`You are repaying ${inputValue} DAI`} tx={txActive} /> }
    </Keyboard>
  );
}

Repay.defaultProps = { repayAmount:null, setActiveView: 2 };

export default Repay;
