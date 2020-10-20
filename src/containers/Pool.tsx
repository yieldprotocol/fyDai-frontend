import React, { useEffect, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { Box, Keyboard, TextInput, Text, ResponsiveContext, Collapsible, Layer } from 'grommet';

import { FiArrowRight as ArrowRight } from 'react-icons/fi';
import { VscHistory as History } from 'react-icons/vsc';

import { NavLink, useParams } from 'react-router-dom';
import { cleanValue, nFormatter } from '../utils';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { 
  useSignerAccount,
  useTxActive,
  useProxy,
  useToken,
  useDebounce,
  useIsLol,
  useMath
} from '../hooks';

import RemoveLiquidity from './RemoveLiquidity';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ApprovalPending from '../components/ApprovalPending';
import TxStatus from '../components/TxStatus';
import SeriesDescriptor from '../components/SeriesDescriptor';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import SeriesMatureBox from '../components/SeriesMatureBox';
import TxHistory from '../components/TxHistory';
import HistoryWrap from '../components/HistoryWrap';
import RaisedBox from '../components/RaisedBox';

import DaiMark from '../components/logos/DaiMark';
import YieldMobileNav from '../components/YieldMobileNav';


interface IPoolProps {
  openConnectLayer:any;
}
  
const Pool = ({ openConnectLayer }:IPoolProps) => {

  /* check if the user sent in any requested amount in the url */ 
  const { amnt }:any = useParams();

  const { state: { deployedContracts } } = useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance } = userState.position;
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const { addLiquidity, addLiquidityActive } = useProxy();
  const { getBalance } = useToken();
  const { poolPercent, calcTokensMinted } = useMath();

  const [newShare, setNewShare] = useState<string>();
  const [calculating, setCalculating] = useState<boolean>(false);

  const { account } = useSignerAccount();
  const [ txActive ] = useTxActive(['ADD_LIQUIDITY', 'REMOVE_LIQUIDITY']);

  const [ hasDelegated ] = useState<boolean>(true);

  const [ inputValue, setInputValue ] = useState<any>(amnt || undefined);
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);

  const [ removeLiquidityOpen, setRemoveLiquidityOpen ] = useState<boolean>(false);
  const [ histOpen, setHistOpen ] = useState<boolean>(false);

  const [ addLiquidityDisabled, setAddLiquidityDisabled ] = useState<boolean>(true);

  const [ addLiquidityPending, setAddLiquidityPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const isLol = useIsLol(inputValue);
  
  /* Add Liquidity sequence */ 
  const addLiquidityProcedure = async () => { 
    if (inputValue && !addLiquidityDisabled ) {
      setAddLiquidityPending(true);
      await addLiquidity( activeSeries, inputValue );
      setInputValue(undefined);
      userActions.updateHistory();
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
    const fyDaiReserves = await getBalance(activeSeries.fyDaiAddress, 'FYDai', activeSeries.poolAddress);
    const newTokens = calcTokensMinted(
      daiReserves, 
      fyDaiReserves, 
      activeSeries.totalSupply, 
      ethers.utils.parseEther(debouncedInput)
    );
    const newBalance = newTokens.add(activeSeries.poolTokens);
    const newTotalSupply = activeSeries.totalSupply.add(newTokens);
    const percent = poolPercent(newTotalSupply, newBalance); 
    setNewShare(percent.toFixed(4));
    setCalculating(false);
  };

  /* handle value calculations based on input changes */
  useEffect(()=>{
    activeSeries && debouncedInput && calculateNewShare();
  }, [debouncedInput]);
  
  /* Add liquidity disabling logic */
  useEffect(()=>{
    (
      ( inputValue && daiBalance && ethers.utils.parseEther(inputValue).gt(daiBalance) ) ||  
      !account ||
      !hasDelegated ||
      !inputValue ||
      parseFloat(inputValue) <= 0
    )? setAddLiquidityDisabled(true): setAddLiquidityDisabled(false);
  }, [ account, daiBalance, inputValue, hasDelegated]);

  /* handle warnings input errors */
  useEffect(() => {
    if ( daiBalance && debouncedInput && ( ethers.utils.parseEther(debouncedInput).gt(daiBalance))) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai you have'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ debouncedInput, daiBalance ]);

  return (
    <RaisedBox>
      <Keyboard 
        onEsc={() => setInputValue(undefined)}
        onEnter={()=> addLiquidityProcedure()}
        onBackspace={()=> {
          inputValue && 
        (document.activeElement !== inputRef) && 
        setInputValue(debouncedInput.toString().slice(0, -1));
        }}
        target='document'
      >
        { removeLiquidityOpen && 
        <Layer onClickOutside={()=>setRemoveLiquidityOpen(false)}>
          <RemoveLiquidity close={()=>setRemoveLiquidityOpen(false)} openConnectLayer={openConnectLayer} /> 
        </Layer>}

        { histOpen && 
        <HistoryWrap closeLayer={()=>setHistOpen(false)}>
          <TxHistory 
            filterTerms={[ 'Added', 'Removed' ]}
            series={activeSeries}
          />
        </HistoryWrap>}

        <SeriesDescriptor activeView='pool'> 
          <InfoGrid 
            alt
            entries={[
              {
                label: 'Your Pool Tokens',
                labelExtra: 'owned in this series',
                visible: 
                  (!!account && txActive?.type !== 'ADD_LIQUIDITY' && !activeSeries?.isMature()) || 
                  (activeSeries?.isMature() && activeSeries?.poolTokens_>0 ),
                active: true,
                loading: addLiquidityPending,     
                value: activeSeries?.poolTokens_,
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Your Pool share',
                labelExtra: ()=>(<Text size='xxsmall'> of the total <Text size='xxsmall' color='text'>{nFormatter(activeSeries?.totalSupply_, 0)}</Text> tokens </Text>),
                visible: 
                    (!!account && txActive?.type !== 'ADD_LIQUIDITY' && !activeSeries?.isMature()) || 
                    (activeSeries?.isMature() && activeSeries?.poolTokens_>0 ),
                active: true,
                loading: addLiquidityPending,           
                value: activeSeries?` ${activeSeries?.poolPercent}%`: '',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Total Liquidity',
                labelExtra: ' staked in this series',
                visible: (txActive?.type !== 'ADD_LIQUIDITY' && !activeSeries?.isMature()),
                active: true,
                loading: addLiquidityPending,           
                value: activeSeries?` ${nFormatter(activeSeries?.totalSupply_, 2)} tokens`: '',
                valuePrefix: null,
                valueExtra: null,
              },
            ]}
          /> 
        </SeriesDescriptor>   

        { (!txActive || txActive.type === 'REMOVE_LIQUIDITY') &&
        <Box
          width={{ max:'600px' }}
          alignSelf='center'
          fill='horizontal'
          background='background-front'
          round='small'
          pad='large'
          gap='medium'
        >
          <Box flex='grow' gap='small' align='center' fill='horizontal'>
          
            { !(activeSeries?.isMature()) && Number.isFinite(parseFloat(activeSeries?.yieldAPR_)) &&
            <>
              <Box fill gap='medium'>
                <Text alignSelf='start' size='large' color='text' weight='bold'>Add liquidity</Text>
                <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
                  <TextInput
                    ref={(el:any) => {el && !removeLiquidityOpen && !mobile && el.focus(); setInputRef(el);}} 
                    type="number"
                    placeholder={!mobile ? 'Enter the amount of Dai Liquidity to add': 'DAI'}
                    value={inputValue || ''}
                    plain
                    onChange={(event:any) => setInputValue( cleanValue(event.target.value, 6) )}
                    icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                  />
                  
                  {account &&
                  <RaisedButton 
                    label={!mobile ? 'Add Maximum': 'Maximum'}
                    onClick={()=>setInputValue(cleanValue(ethers.utils.formatEther(daiBalance), 6))}
                  />}
                </InputWrap>

                <Box fill>
                  <Collapsible open={!!inputValue&&inputValue>0}>

                    <InfoGrid entries={[
                      {
                        label: 'Share of the Pool after adding liquidity',
                        visible: inputValue>0,
                        active: debouncedInput,
                        loading: calculating,           
                        value: newShare? `${newShare}%`: '',
                        valuePrefix: null,
                        valueExtra: null,
                      },
                      {
                        label: 'Like what you see?',
                        visible: !account && inputValue>0,
                        active: true,
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
                    ]}
                    />
                  </Collapsible>
                </Box>
              </Box> 
            
              <Box gap='small' fill='horizontal' align='center' pad={{ vertical:'small' }}>
                <ActionButton
                  onClick={()=>addLiquidityProcedure()} 
                  label={`Supply ${inputValue || ''} DAI`}
                  disabled={addLiquidityDisabled}
                  hasDelegatedPool={activeSeries.hasDelegatedPool}
                  clearInput={()=>setInputValue(undefined)}
                />
              </Box>
            </>}

            { activeSeries?.isMature() &&
            <SeriesMatureBox />}
            
            { !txActive && 
            !!account && 
            activeSeries?.isMature() && 
            activeSeries?.poolTokens?.gt(ethers.constants.Zero) && 
            <RemoveLiquidity />}

            
            <Box direction='row' fill justify='between'>
              { activeSeries?.poolTokens?.gt(ethers.constants.Zero) && 
                !mobile &&
                <Box alignSelf='start' margin={{ top:'medium' }}>
                  <FlatButton 
                    onClick={()=>setHistOpen(true)}
                    label={
                      <Box direction='row' gap='small' align='center'>
                        <Text size='xsmall' color='text-xweak'><History /></Text>                
                        <Text size='xsmall' color='text-xweak'>
                          Series Pool History
                        </Text>              
                      </Box>
                }
                  />
                </Box>}

              { !activeSeries?.isMature() &&
                activeSeries?.poolTokens_>0 &&
                !mobile && 
                <Box alignSelf='end' margin={{ top:'medium' }}>
                  <FlatButton 
                    onClick={()=>setRemoveLiquidityOpen(true)}
                    label={
                      <Box direction='row' gap='small' align='center'>
                        <Text size='xsmall' color='text-weak'><Text weight='bold' color={activeSeries?.seriesColor}>Remove Liquidity</Text> from this series</Text>
                        <ArrowRight color='text-weak' />
                      </Box>
                }
                  />
                </Box>}
            </Box>

          </Box>
        </Box>}

        { addLiquidityActive && !txActive && <ApprovalPending /> } 
        { txActive && txActive.type !== 'REMOVE_LIQUIDITY' && <TxStatus msg={`You are adding ${inputValue} DAI liquidity to the pool.`} tx={txActive} /> }
      </Keyboard>

      { mobile && 
      <YieldMobileNav>
        { !activeSeries?.isMature() &&
       activeSeries?.poolTokens_>0 &&
         <NavLink 
           to={`/removeLiquidity/${activeSeries?.maturity}`}
           style={{ textDecoration: 'none' }}
         >
           <Box direction='row' gap='small' align='center'>
             <Text weight='bold' size='xsmall' color={activeSeries?.seriesColor}>Remove Liquidity</Text>
             <ArrowRight color={activeSeries?.seriesColor} />
           </Box>
         </NavLink>}
      </YieldMobileNav>}

    </RaisedBox>
  );
};

export default Pool;