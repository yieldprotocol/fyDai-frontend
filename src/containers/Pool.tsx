import React, { useEffect, useState, useContext } from 'react';
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
import TxPending from '../components/TxPending';
import SeriesDescriptor from '../components/SeriesDescriptor';

interface IPoolProps {
  // lendAmount?:any
}
  
const Pool = (props:IPoolProps) => {
  const { state: { deployedContracts } } = useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance_ } = userState.position;
  const screenSize = useContext(ResponsiveContext);

  const { addLiquidity, addLiquidityActive } = useProxy();
  const { getBalance } = useToken();

  const [newShare, setNewShare] = useState<number>(activeSeries?.poolPercent);
  const [calculating, setCalculating] = useState<boolean>(false);

  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['ADD_LIQUIDITY', 'REMOVE_LIQUIDITY']);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const [ inputValue, setInputValue ] = useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);

  const [ removeLiquidityOpen, setRemoveLiquidityOpen ] = useState<boolean>(false);

  const [ addLiquidityDisabled, setAddLiquidityDisabled ] = useState<boolean>(true);
  const [ addLiquidityPending, setAddLiquidityPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  
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

  const calculateNewShare = async () => {
    setCalculating(true);
    const daiReserves = await getBalance(deployedContracts.Dai, 'Dai', activeSeries.poolAddress);
    const eDaiReserves = await getBalance(activeSeries.eDaiAddress, 'EDai', activeSeries.poolAddress);
    const tokens_ = ethers.utils.parseEther(debouncedInput).mul(daiReserves).div(eDaiReserves.add(daiReserves));
    const percent = (( parseFloat(ethers.utils.formatEther(tokens_)) + activeSeries?.poolTokens_ ) / activeSeries.totalSupply_ )*100;
    setNewShare(percent);
    setCalculating(false);
  };

  /* handle value calculations based on input changes */
  useEffect(() => {
    debouncedInput && calculateNewShare();
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
            value: activeSeries?.poolTokens_.toFixed(4),
            valuePrefix: null,
            valueExtra: null, 
          },
          {
            label: 'Your Pool share',
            visible: !!account && txActive?.type !== 'ADD_LIQUIDITY',
            active: true,
            loading: addLiquidityPending,           
            value: activeSeries?` ${activeSeries?.poolPercent.toFixed(4)}%`: '',
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
          { account && !(activeSeries?.isMature()) && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
          <>
            <Box fill gap='medium'>
              <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Add liquidity</Text>
              <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={addLiquidityDisabled}>
                <TextInput
                  ref={(el:any) => {el && !removeLiquidityOpen && el.focus(); setInputRef(el);}} 
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
                  loading: calculating,           
                  value: newShare? `${newShare.toFixed(4)}%`: '',
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
            {/* }
  
          { account && !(activeSeries?.isMature()) && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) && */}
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
            </Box>
          </>}
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
                  { !(activeSeries?.isMature()) ? 
                    <Box><Text size='xsmall' color='text-weak'>Remove exisiting Liquidity from this series</Text></Box>
                    :
                    <Text size='xsmall' color='text-weak'>alternatively, Remove Liquidity from this series</Text>}
                  <ArrowRight color='text-weak' />
                </Box>
              </Box>
            </Box>}

        </Box>
      </Box>}

      { addLiquidityActive && !txActive && <ApprovalPending /> } 
      { txActive && <TxPending msg={`You are adding ${inputValue} DAI liquidity to the pool.`} tx={txActive} /> }
    </Keyboard>
  );
};

Pool.defaultProps={ lendAmount:null };

export default Pool;