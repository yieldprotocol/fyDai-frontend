import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Moment from 'moment';
import { Box, Button, Keyboard, TextInput, Text, ResponsiveContext } from 'grommet';

import { 
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { 
  useSignerAccount,
  useTxActive,
  useProxy,
  useToken,
  useDebounce
} from '../hooks';

import RemoveLiquidity from './RemoveLiquidity';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';
import SeriesDescriptor from '../components/SeriesDescriptor';

interface IPoolProps {
  // lendAmount?:any
}
  
const Pool = (props:IPoolProps) => {
  const { state: { deployedContracts } } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const { daiBalance_ } = userState.position;
  const screenSize = React.useContext(ResponsiveContext);

  const { addLiquidity, addLiquidityActive } = useProxy();
  const { getBalance } = useToken();

  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['ADD_LIQUIDITY', 'REMOVE_LIQUIDITY']);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const [ inputValue, setInputValue ] = React.useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = React.useState<any>(null);

  const [ removeLiquidityOpen, setRemoveLiquidityOpen ] = useState<boolean>(false);

  const [ addLiquidityDisabled, setAddLiquidityDisabled ] = React.useState<boolean>(true);
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
    debouncedInput&& ( async () => {
      // const bnInp = ethers.utils.parseEther(inputValue)
      // const daiReserves = await getBalance(deployedContracts.Dai, 'Dai', activeSeries.poolAddress);
      // const yDaiReserves = await getBalance(activeSeries.yDaiAddress, 'YDai', activeSeries.poolAddress);
      // const tokens = bnInp.mul(daiReserves).div(yDaiReserves.add(daiReserves));
    })();
  }, [debouncedInput]);
  
  /* Add liquidity disabling logic */
  useEffect(()=>{
    (
      !daiBalance_ ||
      inputValue > daiBalance_ ||  
      !account ||
      !hasDelegated ||
      !inputValue ||
      parseFloat(inputValue) === 0
    )? setAddLiquidityDisabled(true): setAddLiquidityDisabled(false);
  }, [ inputValue, hasDelegated ]);

  /* handle warnings input errors */
  useEffect(() => {
    if ( debouncedInput && ( debouncedInput > daiBalance_ ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you have'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> addLiquidityProcedure(inputValue)}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
      target='document'
    >
      { removeLiquidityOpen && <RemoveLiquidity close={()=>setRemoveLiquidityOpen(false)} /> }
      <SeriesDescriptor activeView='pool'> 
        <InfoGrid entries={[
          {
            label: 'Your Pool Tokens',
            visible: !!account && txActive?.type !== 'ADD_LIQUIDITY',
            active: true,
            loading: addLiquidityPending,     
            value: activeSeries?.poolTokens_.toFixed(2),
            valuePrefix: null,
            valueExtra: null, 
          },
          {
            label: 'Your Pool share',
            visible: !!account && txActive?.type !== 'ADD_LIQUIDITY',
            active: true,
            loading: addLiquidityPending,           
            value: activeSeries?.poolPercent_.toFixed(2),
            valuePrefix: null,
            valueExtra: null,
          },
          {
            label: 'Current Dai Balance',
            visible: !!account && txActive?.type !== 'ADD_LIQUIDITY',
            active: true,
            loading: addLiquidityPending,            
            value: daiBalance_?`${daiBalance_.toFixed(2)} DAI`: '0 DAI',
            valuePrefix: null,
            valueExtra: null,
          },
        ]}
        /> 
      </SeriesDescriptor>    

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
          
          <Box fill gap='medium'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Add liquidity</Text>
            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={addLiquidityDisabled}>
              <TextInput
                ref={(input:any) => input && !removeLiquidityOpen && input.focus()}
                type="number"
                placeholder={screenSize !== 'small' ? 'Enter the amount of Dai Liquidity to add': 'DAI'}
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
                label: 'Share of the Pool after adding liquidity',
                visible: true,
                active: inputValue,
                loading: false,           
                value: '0.04%',
                valuePrefix: null,
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
  
          { account && !activeSeries?.isMature() && 
          <Box gap='small' fill='horizontal' align='center'>
            <Box
              fill='horizontal'
              round='small'
              background={addLiquidityDisabled ? 'brand-transparent' : 'brand'}
              onClick={()=>addLiquidityProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text 
                weight='bold'
                size='large'
                color={addLiquidityDisabled ? 'text-xweak' : 'text'}
              >
                {`Supply ${inputValue || ''} DAI`}
              </Text>
            </Box>

            { activeSeries?.poolTokens_>0 &&
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
            </Box> }
          </Box>}
        </Box>
      </Box>}

      { addLiquidityActive && !txActive && <ApprovalPending /> } 
      { txActive && <TransactionPending msg={`You are adding ${inputValue} DAI liquidity to the pool.`} tx={txActive} /> }
    </Keyboard>
  );
};

Pool.defaultProps={ lendAmount:null };

export default Pool;