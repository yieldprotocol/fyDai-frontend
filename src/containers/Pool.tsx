import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Moment from 'moment';
import { Box, Button, Keyboard, TextInput, Text, ResponsiveContext } from 'grommet';

import { 
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { 
  useSignerAccount,
  useTxActive,
  useProxy
} from '../hooks';

import RemoveLiquidity from './RemoveLiquidity';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';

interface IPoolProps {
  // lendAmount?:any
}
  
const Pool = (props:IPoolProps) => {
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const { daiBalance_ } = userState.position;
  const screenSize = React.useContext(ResponsiveContext);

  const { addLiquidity, addLiquidityActive } = useProxy();
  // const { getPoolTokens,  } = usePool();

  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['SELL']);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const [ inputValue, setInputValue ] = React.useState<any>();

  const [ removeLiquidityOpen, setRemoveLiquidityOpen ] = useState<boolean>(false);

  const [ addLiquidityDisabled, setAddLiquidityDisabled ] = React.useState<boolean>(false);
  const [ addLiquidityPending, setAddLiquidityPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);
  
  /* Add Liquidity sequence */ 
  const addLiquidityProcedure = async (value:number) => { 
    if (!addLiquidityDisabled ) {
      setAddLiquidityPending(true);
      await addLiquidity( activeSeries, value );
      setInputValue('');
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setAddLiquidityPending(false);
    }   
  };

  /* handle value calculations based on input changes */
  useEffect(() => {
    inputValue && ( async () => {

    })();
  }, [inputValue]);
  
  /* Add liquidity disabling logic */
  useEffect(()=>{
    (
      !daiBalance_ ||
      inputValue > daiBalance_ ||  
      !account ||
      !hasDelegated ||
      !inputValue ||
      parseInt(inputValue, 10) === 0
    )? setAddLiquidityDisabled(true): setAddLiquidityDisabled(false);
  }, [ inputValue, hasDelegated ]);

  /* handle warnings input errors */
  useEffect(() => {
    if ( inputValue && ( inputValue > daiBalance_ ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of DAI you have'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> addLiquidityProcedure(inputValue)}
      target='document'
    >
      <>
        { removeLiquidityOpen && <RemoveLiquidity close={()=>setRemoveLiquidityOpen(false)} /> }
        { txActive?.type !== 'SELL' &&
        <Box flex='grow' gap='small' align='center' fill='horizontal'>
          <InfoGrid entries={[
            {
              label: 'Your Pool Tokens',
              visible: !!account,
              active: true,
              loading: addLiquidityPending,     
              value: activeSeries?.poolTokens_.toFixed(2),
              valuePrefix: null,
              valueExtra: null, 
            },
            {
              label: 'Your Pool share',
              visible: !!account,
              active: true,
              loading: addLiquidityPending,           
              value: activeSeries?.poolPercent_.toFixed(2),
              valuePrefix: null,
              valueExtra: null,
            },
            {
              label: 'Current DAI value',
              visible: !!account,
              active: true,
              loading: addLiquidityPending,            
              value: daiBalance_?`${daiBalance_.toFixed(2)} DAI`: '0 DAI',
              valuePrefix: null,
              valueExtra: null,
            },
          ]}
          />

          <Box fill gap='medium'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Add liquidity</Text>
            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={addLiquidityDisabled}>
              <TextInput
                type="number"
                placeholder={screenSize !== 'small' ? 'Enter the amount of DAI to add': 'DAI'}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<DaiMark />}
              />
              {account &&
                <Button 
                  label={<Text size='xsmall' color='brand'> {screenSize !== 'small' ? 'Add Maximum': 'Max'}</Text>}
                  color='brand-transparent'
                  onClick={()=>setInputValue(daiBalance_)}
                  hoverIndicator='brand-transparent'
                />}
            </InputWrap>

            <InfoGrid entries={[
              {
                label: 'Current Rate',
                visible: true,
                active: inputValue,
                loading: false,     
                value: '5%',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Share of the Pool',
                visible: true,
                active: inputValue,
                loading: false,           
                value: '0.04%',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Like what you see?',
                visible: !account,
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
          </Box> 
  
          { account && !activeSeries?.isMature && 
          <Box gap='small' fill='horizontal' align='center'>
            <Box
              fill='horizontal'
              round='small'
              background={( !(inputValue>0) || addLiquidityDisabled) ? 'brand-transparent' : 'brand'}
              onClick={(!(inputValue>0) || addLiquidityDisabled)? ()=>{}:()=>addLiquidityProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text 
                weight='bold'
                size='large'
                color={( !(inputValue>0) || addLiquidityDisabled) ? 'text-xweak' : 'text'}
              >
                {`Supply ${inputValue || ''} DAI`}
              </Text>
            </Box>

            <Box alignSelf='end'>
              <Box
                round
                onClick={()=>setRemoveLiquidityOpen(true)}
                hoverIndicator='brand-transparent'
                // border='all'
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Box direction='row' gap='small'>
                  <Text size='xsmall' color='text-weak'> alternatively, Remove Liquidity from this series</Text>
                  <ArrowRight color='text-weak' />
                </Box>
              </Box>
            </Box> 
          </Box>}
        </Box>}

        { addLiquidityActive && !txActive && <ApprovalPending /> } 
        { txActive && <TransactionPending msg={`You added ${inputValue} DAI to the pool.`} tx={txActive} /> }
      </>
    </Keyboard>
  );
};

Pool.defaultProps={ lendAmount:null };

export default Pool;