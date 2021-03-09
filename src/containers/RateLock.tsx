import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useHistory, useParams } from 'react-router-dom';
import { BigNumber, ethers } from 'ethers';
import { Box, Image, Keyboard, TextInput, Text, ResponsiveContext, Collapsible, ThemeContext } from 'grommet';
import styled, { css } from 'styled-components';
import { 
  FiArrowLeft as ArrowLeft,
  FiChevronLeft as ChevronLeft, 
  FiChevronRight as ChevronRight,
  FiSearch as Search,
  FiX as Close,
  FiLayers as ChangeSeries
} from 'react-icons/fi';

/* utils and support */
import { cleanValue, modColor, buildGradient, analyticsLogEvent } from '../utils';
import logoDark from '../assets/images/logo.svg';

/* contexts */
import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';

/* hooks */
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { useImportProxy } from '../hooks/importProxyHook';
import { useMaker } from '../hooks/makerHook';
import { useSignerAccount } from '../hooks/connectionHooks';

/* components */
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import EthMark from '../components/logos/EthMark';
import YieldMobileNav from '../components/YieldMobileNav';
import DaiMark from '../components/logos/DaiMark';
import MakerMark from '../components/logos/MakerMark';
import TxStatus from '../components/TxStatus';
import AprBadge from '../components/AprBadge';
import SeriesSelector from '../components/SeriesSelector';

interface IRateLockProps {
  close?: any; // close is also used as a indicator used as a layer (only a layer should have a closed)
  openConnectLayer?:any;
  asLayer?:boolean;
}

const InsetBox = styled(Box)`
border-radius: 8px;
${(props:any) => props.background && css`
    background: ${props.background};
    box-shadow: inset 6px 6px 11px ${modColor(props.background, -20)}, 
            inset -6px -6px 11px ${modColor(props.background, 10)};
`}
`;

const makerTextColor = '#48495f';
const makerBackColor = '#f6f8f9';

const RateLock = ({ openConnectLayer, close, asLayer }:IRateLockProps) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const history = useHistory();
  const { vault : vaultParam }:any = useParams();

  /* state from contexts */
  const { state: { makerVaults, userLoading }, actions: userActions } = useContext(UserContext);
  const { state: { activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { state:{ feedData } } = useContext(YieldContext);
  const { ilks:{ dust } } = feedData;

  /* local state: vaults and selected vaults variables */
  const [ selectedVaultIndex, setSelectedVaultIndex ] = useState<number>(0);
  const [ selectedVault, setSelectedVault ] = useState<any>(null);
  const [ filteredMakerVaults, setFilteredMakerVaults ] = useState<any>(makerVaults);
  const [ searchOpen, setSearchOpen ] = useState<boolean>(false);
  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);
  const [ advancedOpen, setAdvancedOpen ] = useState<boolean>(false);
  const [ advancedDisabled, setAdvancedDisabled ] = useState<boolean>(true);
  const [ allDisabled, setAllDisabled ] = useState<boolean>(true);
  
  /* local state: input variables and aux hooks */
  const [ collInputValue, setCollInputValue ] = useState<any>();
  const [ debtInputValue, setDebtInputValue ] = useState<any>();
  const [ searchInputValue, setSearchInputValue ] = useState<any>();
  const [collInputRef, setCollInputRef] = useState<any>(null);
  const [debtInputRef, setDebtInputRef] = useState<any>(null);

  /* local state: token balances and calculated values */
  const [ APR, setAPR ] = useState<string>();
  const [ maxAPR, setMaxAPR ] = useState<string>();
  const [ minCollateral, setMinCollateral ] = useState<string>();
  const [ minSafeCollateral, setMinSafeCollateral ] = useState<string>();
  const [ daiDust, setDaiDust ] = useState<BigNumber>();

  /* local state: warning and error variables */
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ collErrorMsg, setCollErrorMsg] = useState<string|null>(null);
  const [ debtErrorMsg, setDebtErrorMsg] = useState<string|null>(null);


  /* hooks */
  const { account } = useSignerAccount();
  const { importPosition, importVault,  } = useImportProxy();
  const { minWethForAmount } = useMaker();
  const { calculateAPR, estTrade } = useMath();
  const [ txActive ] = useTxActive(['IMPORT']);
  const debouncedCollInput = useDebounce(collInputValue, 500);
  const debouncedDebtInput = useDebounce(debtInputValue, 500);
  const debouncedSearchInput = useDebounce(searchInputValue, 1000);
  const isCollLol = useIsLol(collInputValue);
  const isDebtLol = useIsLol(debtInputValue);

  /* execution procedures */
  const importProcedure = async () => {
    if ( collInputValue || debtInputValue && !advancedDisabled ) {

      analyticsLogEvent(
        'import_initiated', 
        {
          value: debtInputValue,
          series: activeSeries ? activeSeries.displayName : null,
          maturity: activeSeries ? activeSeries.maturity: null, 
          time_to_maturity: activeSeries ? (new Date().getTime()/1000) - activeSeries?.maturity : null,
          account: account?.substring(2),
        });

      /* if  or, there is no dai, but there is collateral left, the collateral value needs to be exact */ 
      const valueColl = ( collInputValue >= selectedVault.vaultCollateral_ ) || parseFloat(selectedVault.vaultMakerDebt_)===0  ?
        selectedVault.vaultCollateral : 
        debouncedCollInput;
      /* if the value approximates the max value OR there appears to be no Dai, use the EXACT value of the MakerDebt */
      const valueDebt =  ( parseFloat(debouncedDebtInput) === parseFloat(selectedVault.vaultDaiDebt_ ) || parseFloat(selectedVault.vaultDaiDebt_)===0 ) ? 
        selectedVault.vaultMakerDebt :
        debouncedDebtInput;

      await importPosition(
        activeSeries,
        valueColl,
        valueDebt,
        selectedVault.vaultId);
      setCollInputValue(undefined);
      setDebtInputValue(undefined);

      close && close();
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateSeries([activeSeries]),
      ]);   
    }
  };
  
  const importAllProcedure = async (id:number) => {

    if (!allDisabled) {
      await importVault(activeSeries, id);
      analyticsLogEvent('import_position', {
        value_coll: String(selectedVault?.vaultCollateral_),
        type_coll: 'ETH-A',
        value_debt: String(selectedVault?.vaultDaiDebt_),
        type_debt: 'DAI',
        source: 'MAKER',
        one_click: true,
        label: activeSeries.displayName,
        maturity: activeSeries.maturity, 
        time_to_maturity: (new Date().getTime()/1000) - activeSeries.maturity, 
      });

      close && close();
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateSeries([activeSeries]),
      ]);
    }
  };

  /* change the selected vault */ 
  const selectVault = (prevOrNext:'next'|'prev') => {
    prevOrNext === 'prev' && selectedVaultIndex > 0 && setSelectedVaultIndex( selectedVaultIndex-1 );
    prevOrNext === 'next' && selectedVaultIndex < filteredMakerVaults.length-1 && setSelectedVaultIndex( selectedVaultIndex+1 );
    setDebtInputValue(undefined);
    setCollInputValue(undefined);
    setDebtErrorMsg(null);
    setCollErrorMsg(null);
    setAdvancedOpen(false);
  };

  /*
  * Handle debt Input (and debounced debt input) changes:
  */
  useEffect(()=>{
    activeSeries && 
    debouncedDebtInput>0 && 
    (async () => {
      if (
        debtInputValue &&
        parseFloat(debouncedDebtInput) > 0 &&
        parseFloat(debouncedDebtInput) < parseFloat(selectedVault.vaultDaiDebt_) &&    
        parseFloat(debouncedDebtInput) !== parseFloat(selectedVault.vaultDaiDebt_) &&
        selectedVault.vaultDaiDebt.sub(ethers.utils.parseEther(debouncedDebtInput)).lt(daiDust)
      ) {
        setDebtErrorMsg(`You cannot leave a vault with less Dai than the current Maker CDP minimum limit (${ daiDust && ethers.utils.formatEther(daiDust)} Dai). However, you can remove it ALL with max`);
      } else if (
        debtInputValue &&
        parseFloat(debouncedDebtInput) > parseFloat(selectedVault.vaultDaiDebt_)
      ) {
        setDebtErrorMsg('Amount exceeds the debt in the maker vault');
      } else (setDebtErrorMsg(null));
      setCollInputValue('');
      setMinCollateral(ethers.utils.formatEther(await minWethForAmount(debouncedDebtInput)));

      const preview = estTrade('buyDai', activeSeries, debouncedDebtInput);     
      if (!(preview instanceof Error)) {
        const _apr = calculateAPR( ethers.utils.parseEther(debouncedDebtInput.toString()), preview, activeSeries.maturity );
        setAPR(cleanValue(_apr.toString(), 2) );
      } else {
        setAllDisabled(true);
        setDebtErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
    !debouncedDebtInput && setDebtErrorMsg(null);
  }, [debouncedDebtInput, activeSeries]);

  /*
  * Handle collateral Input (debounced coll input) changes:
  */
  useEffect(()=>{
    if ( selectedVault && debouncedCollInput > parseFloat(selectedVault.vaultCollateral_) ) {
      setCollErrorMsg('Not enough collateral in the maker vault');
    } else (setCollErrorMsg(''));

    activeSeries && debouncedCollInput>0 && ( async () => { 
      if (minCollateral && (debouncedCollInput < parseFloat(minCollateral)) ) {
        setCollErrorMsg('That is not enough collateral to cover the debt you wish to migrate');
      }
    })();

    activeSeries && debouncedCollInput>0 && ( async () => { 
      if (debouncedCollInput <= 0.05) {
        setCollErrorMsg('Collateral amount to migrate should be GREATER than 0.05Eth');
      }
    })();

    !debouncedCollInput && setCollErrorMsg(null);
  }, [debouncedCollInput, activeSeries]);

  /* Filter vaults and set selected */ 
  useEffect(()=>{
    let _filteredVaults = [];
    if ( debouncedSearchInput ) { 
      _filteredVaults = makerVaults.filter((x:any)=> x.vaultId === debouncedSearchInput);
      setFilteredMakerVaults(_filteredVaults);
      setSelectedVault(_filteredVaults[0]);
    } else {
      _filteredVaults = makerVaults;
      setFilteredMakerVaults(_filteredVaults);
      setSelectedVault(_filteredVaults[selectedVaultIndex]);
    }
  }, [ makerVaults, debouncedSearchInput, selectedVaultIndex ]);

  /* set the initially shown vault as first one with debt OR from url vault param */
  useEffect(()=>{
    let startIndex;
    if (vaultParam) {
      startIndex = filteredMakerVaults.findIndex((x:any)=>x.vaultId===vaultParam);
    } else {
      startIndex = filteredMakerVaults.findIndex((x:any)=>x.vaultDaiDebt_>0);
    }
    filteredMakerVaults.length>0 && setSelectedVaultIndex( (startIndex>=0) ? startIndex : 0 );
  }, [filteredMakerVaults]);

  /* Handle minSafe collateral calculations minSafe must be > 0.05ETH */
  useEffect(()=>{
    minCollateral && 
    setMinSafeCollateral((parseFloat(minCollateral)/3)*5 > 0.05 ? ((parseFloat(minCollateral)/3)*5).toString(): '0.051' );
  }, [ minCollateral ]);
  
  /* Handle dust watch */
  useEffect(()=>{
    dust && setDaiDust(dust.div(BigNumber.from('1000000000000000000000000000')));
  }, [ dust ]);

  /* Get the Max APR for the selected Vault */
  useEffect(()=>{
    selectedVault?.vaultDaiDebt_> 0 && (async ()=>{
      const preview = estTrade('buyDai', activeSeries, selectedVault.vaultDaiDebt_);
      if (!(preview instanceof Error)) {
        const _apr = calculateAPR( ethers.utils.parseEther(selectedVault?.vaultDaiDebt_), preview, activeSeries.maturity);
        setMaxAPR( cleanValue(_apr.toString(), 2) );
      } else {
        setMaxAPR(undefined);
      }
    })();
  }, [selectedVault, activeSeries]);
    
  /* Handle ratelock disabling */
  useEffect(()=>{ 
    account && 
    filteredMakerVaults.length>0 && 
    !collErrorMsg &&
    !debtErrorMsg &&
    (debtInputValue > 0  && collInputValue > 0) ? 
      setAdvancedDisabled(false): setAdvancedDisabled(true);

    !account ||
    filteredMakerVaults.length<=0 ||
    (parseFloat(selectedVault?.vaultDaiDebt_) === 0 && parseFloat(selectedVault?.vaultCollateral_) === 0 ) ||
    selectedVault?.vaultCollateral.lt(ethers.utils.parseEther('0.050')) ||
    activeSeries?.isMature() ?
      setAllDisabled(true)
      : setAllDisabled(false);
  }, [ activeSeries, selectedVault, collInputValue, debtInputValue, collErrorMsg, debtErrorMsg ]);

  return (
    <>
      <Keyboard 
        onEsc={() => {
          if (collInputValue || debtInputValue) {
            document.activeElement === collInputRef && setCollInputValue(undefined);
            document.activeElement === debtInputRef && setDebtInputValue(undefined);
          } else {close && close();}
        }}
        onEnter={()=> importProcedure()}
        target='document'
      >

        <Box
          round='small'
          background={asLayer ? 'background' : activeSeries && buildGradient(activeSeries?.seriesFromColor, activeSeries?.seriesColor)}
          margin={{ bottom:'-24px' }}
          pad={asLayer? 'large' : { horizontal:'large', bottom:'large', top:'medium' }}
          justify='between'
          direction='row'
        > 

          <Box direction='row' align='center' gap='small' justify='start'>  
            <Box
              width='xsmall'
              pad={{ horizontal:'small', vertical:'xsmall' }} 
              background={activeSeries && asLayer? buildGradient( activeSeries?.seriesFromColor, activeSeries?.seriesColor): activeSeries?.seriesColor} 
              // background={activeSeries?.seriesColor}
              // border={{ color: !theme.dark? 'text':'white' }}
              onClick={()=>setSelectorOpen(true)}
              round
            >
              <Image src={logoDark} fit='contain' />
            </Box>
            <Text size={mobile?'large':'xxlarge'} weight='bold' color={asLayer? 'text' : activeSeries?.seriesTextColor}>RateLock</Text>   
          </Box>

          { !mobile &&
          <Box direction='row' align='center' gap='small'> 
            <Search 
              color={asLayer? 'text' : activeSeries?.seriesTextColor} 
              onClick={()=>{if(!searchOpen){setSearchOpen(true);} else {setSearchInputValue(undefined); setSearchOpen(false);}}} 
            />
            <Collapsible open={searchOpen} direction='horizontal'>
              <InsetBox
                background={asLayer? makerBackColor : activeSeries && modColor(activeSeries?.seriesColor, 50)}
                justify='between'
                direction='row'
                align='center'
                pad='xxsmall'
              >
                <TextInput
                  type='number'
                  placeholder='Search vault #'
                  value={searchInputValue || ''}
                  plain
                  onChange={(event:any) => setSearchInputValue(event.target.value)}
                />
                <Close onClick={()=>{setSearchInputValue(undefined); setSearchOpen(false);}} />
              </InsetBox>       
            </Collapsible>
          </Box>}

        </Box>

        {selectorOpen && <SeriesSelector activeView="Borrow" close={()=>setSelectorOpen(false)} /> }
        <Box 
          width={!mobile?{ min:'600px', max:'600px' }: undefined}
          alignSelf='center'
          fill
          background='background'
          round='small'
          pad='large'
          justify='between'  
        > 

          { 
          txActive && 
          <TxStatus tx={txActive} />
        }

          { 
        !txActive &&
          <Box gap='medium'>
            <Box gap='small'> 
              <Box direction='row' gap='small' align='center' justify='end'>
                {/* <Text size='xsmall' color='text'> Connected vaults: </Text> */} 
              </Box>

              <InsetBox background={makerBackColor} direction='row' justify='between'>   
                <Box onClick={()=>selectVault('prev')} justify='center' align='center' hoverIndicator={modColor(makerBackColor, -25)}>
                  {account && !userLoading && <ChevronLeft size='30px' color={selectedVaultIndex===0?makerBackColor:makerTextColor} />}
                </Box>
                {
                filteredMakerVaults.length>0 ?        
                  filteredMakerVaults.map( (x:any, i:number) => {
                    if (selectedVaultIndex === i) {
                      return (
                        <Box animation='fadeIn' key={x.vaultId} gap='small' pad='medium' fill>
                          <Box direction='row-responsive' justify='between' align='center' fill='horizontal'> 
                            <Box pad={{ horizontal:'medium' }} direction='row' gap='small'>
                              <MakerMark />
                              <Text color='text' size='small' weight='bold'> ETH-A Vault</Text>
                              <Text size='small'> #{x.vaultId}</Text>
                            </Box>             
                          </Box>
                          <Box pad='medium' border background='#ffffff' fill='horizontal'>
                            <Box pad='small' border='bottom' justify='between' direction='row'> 
                              <Text size='small' color={makerTextColor}>Eth Locked</Text> 
                              <Text size='small' color={makerTextColor}> {x.vaultCollateral_} ETH</Text>            
                            </Box>
                            <Box pad='small' justify='between' direction='row'> 
                              <Text size='small' color={makerTextColor}>Outstanding Dai debt</Text> 
                              <Text size='small' color={makerTextColor}> {x.vaultDaiDebt_} DAI</Text>            
                            </Box>
                          </Box>
                        </Box>
                      );
                    }
                  })
                  :
                  <Box pad='large'>
                    { account && ( userLoading ? 'Searching for Maker Vaults...' : 'No Maker Vaults found.') }
                    { 
                      !account &&
                      <RaisedButton
                        label={<Box pad='small'><Text size='small'>Connect a wallet</Text></Box>}
                        onClick={() => openConnectLayer()}
                      />
                    }
                  </Box>
              }
                <Box onClick={()=>selectVault('next')} justify='center' align='center' hoverIndicator={modColor(makerBackColor, -25)}>
                  {filteredMakerVaults.length>0 && <ChevronRight size='30px' color={selectedVaultIndex===filteredMakerVaults.length-1?makerBackColor:makerTextColor} />}
                </Box>
              </InsetBox>
            </Box>
           
            <Box direction='row' justify='between' align='center' pad='small'>
              <Text size='xsmall' color='text'> Selected Yield Series: </Text>
              <RaisedButton 
                onClick={()=>setSelectorOpen(true)}
                label={
                  <Box 
                    direction='row' 
                    gap='medium'
                    align='center'
                    pad='xsmall'
                    fill
                  >
                    {activeSeries && <AprBadge activeView='Borrow' series={activeSeries} animate />}
                    <Text size='small'>            
                      { mobile? activeSeries?.displayNameMobile : activeSeries?.displayName }
                    </Text>
                    <ChangeSeries />
                  </Box>                
                }
              />
            </Box>
                
            {
            !advancedOpen &&
              <Box
                gap='small'
                fill='horizontal'
              >
                <Box fill>
                  <RaisedButton 
                    onClick={()=>importAllProcedure(selectedVault.vaultId)}
                    disabled={
                      advancedOpen || 
                      allDisabled
                    }
                    label={
                      <Box pad='small' direction='row' gap='small'>
                        <Text size='small' weight='bold'> 1-Click RateLock</Text>
                        <Text size='small'>{selectedVault?.vaultDaiDebt_} Dai { maxAPR? ` @ ${maxAPR}%`: ''}</Text>
                      </Box>
                    }
                  />
                </Box>
              </Box>
            }

            <Collapsible open={advancedOpen}>
              { 
                /* Show if current vault collateral is less than the current dust level */
                selectedVault?.vaultMakerDebt.lt(daiDust) &&
                <Box gap='medium'>
                  <Box>
                    <Text size='xsmall'> Due to a minimum size limit imposed on Maker vaults, it's not practical to split your vault any further. However, you can still migrate your entire vault to Yield with the 1-Click RateLock.</Text>
                  </Box>
                  <RaisedButton 
                    onClick={()=>importAllProcedure(selectedVault.vaultId)}
                    disabled={allDisabled}
                    label={
                      <Box pad='small' direction='row' gap='small'>
                        <Text size='small' weight='bold'> 1-Click RateLock</Text>
                        <Text size='small'>{selectedVault?.vaultDaiDebt_} Dai { maxAPR? `@ ${ maxAPR }%`: ''}</Text>
                      </Box>
                    }
                  />
                </Box>
                }

              {
              /* Show if current vault collateral is more than the current dust level */
              selectedVault?.vaultMakerDebt.gt(daiDust) &&                      
              <Box gap='medium'>
                <Box gap='small'>
                  <Text size='small' color='text' weight='bold'> Advanced Options: </Text> 
                  <Text size='xxsmall' color='text-weak'> Set an amount of debt and collateral to lock in a fixed rate</Text> 
                </Box>

                <Box direction='row'>
                  <Box basis='50%' direction='row' align='center' gap='small' justify='start'>
                    <MakerMark /> 
                    <Text size='small'>Dai Debt</Text>
                  </Box>
                  <InputWrap errorMsg={debtErrorMsg} warningMsg={warningMsg}>
                    <TextInput
                      ref={(el1:any) => setDebtInputRef(el1)} 
                      type='number'
                      placeholder='DAI'
                      value={debtInputValue || ''}
                      disabled={selectedVault?.vaultDaiDebt.lte(ethers.constants.Zero)}
                      plain
                      onChange={(event:any) => setDebtInputValue(cleanValue(event.target.value))}
                      icon={isDebtLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
                    />
                    <FlatButton
                      label='max debt'
                      onClick={()=>selectedVault && setDebtInputValue(cleanValue(selectedVault.vaultDaiDebt_))}
                      disabled={selectedVault?.vaultDaiDebt.lte(ethers.constants.Zero)}
                    />
                  </InputWrap>
                </Box>


                <Box direction='row'>
                  <Box basis='50%' justify='center'>
                    <Text size='small'>Collateral</Text>
                  </Box>
                  <InputWrap errorMsg={collErrorMsg} warningMsg={warningMsg}>
                    <TextInput
                      ref={(el2:any)=>setCollInputRef(el2)} 
                      type='number'
                      placeholder='ETH'
                      value={collInputValue || ''}
                      plain
                      disabled={selectedVault?.vaultCollateral.lte(ethers.constants.Zero)}
                      onChange={(event:any) => setCollInputValue(cleanValue(event.target.value))}
                      icon={isCollLol ? <span role='img' aria-label='lol'>😂</span> : <EthMark />}
                    />
                    {
                minSafeCollateral && 
                collInputValue !== cleanValue(minSafeCollateral||'', 6) ? 
                  <FlatButton
                    label='use suggested collateral'
                    disabled={selectedVault?.vaultCollateral.lte(ethers.constants.Zero)}
                    onClick={() => minSafeCollateral >= selectedVault.vaultCollateral_ ? 
                      setCollInputValue( cleanValue(selectedVault.vaultCollateral_||'', 6) ) :
                      setCollInputValue( cleanValue(minSafeCollateral||'', 6))}                   
                  /> :
                  <FlatButton 
                    label='clear'
                    disabled={selectedVault?.vaultCollateral.lte(ethers.constants.Zero)}
                    onClick={() => setCollInputValue('')}
                  />
                } 
                  </InputWrap>
                </Box>

                <InfoGrid entries={[
                  {
                    label: 'Fixed Rate',
                    labelExtra: `if migrating ${debouncedDebtInput} debt`,
                    visible: !!debtInputValue,
                    active: true,
                    loading: false, 
                    value: APR?`${APR}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                    valuePrefix: null,
                    valueExtra: null, 
                  },
                  {
                    label: 'Mimimal Collateral',
                    labelExtra: `required for ${debouncedDebtInput} debt`,
                    visible: !!debtInputValue,
                    active: true,
                    loading: false,           
                    value: minCollateral ? `${minCollateral && cleanValue(minCollateral, 4)} Eth` : '',
                    valuePrefix: null,
                    valueExtra: null,
                  },
                  {
                    label: 'Suggested Collateral',
                    labelExtra: 'ratio of ~250% (min 0.051ETH)',
                    visible: !!debtInputValue,
                    active: true,
                    loading: false,           
                    value: minSafeCollateral ? `${minSafeCollateral && cleanValue(minSafeCollateral, 4)} Eth` : '',
                    valuePrefix: null,
                    valueExtra: null,
                  },
                ]}
                />

                <ActionButton
                  onClick={() => importProcedure()}
                  label={                  
                    <Box direction='row' gap='small'>
                      <Text size='small'>RateLock</Text>
                      <Text size='small' weight='normal'>{debouncedDebtInput} Dai @ {APR}% </Text>
                    </Box>             
                    }
                  disabled={advancedDisabled || allDisabled}
                  hasPoolDelegatedProxy={true}
                  clearInput={()=>{setCollInputValue(undefined); setDebtInputValue(undefined);}}
                />
              </Box>
              }   
            </Collapsible>
          </Box>
          }

          <Box direction='row' fill justify={close?'between':'end'}>
            { 
              asLayer && 
              <Box alignSelf='start' margin={{ top:'medium' }}>
                <FlatButton 
                  onClick={close? ()=>close(): ()=>history.push('/borrow')}
                  label={
                    <Box direction='row' gap='medium' align='center'>
                      <ArrowLeft color='text-weak' />
                      <Text size='xsmall' color='text-weak'> go back </Text>
                    </Box>
                }
                />
              </Box>
          }
            {
          !txActive &&
          <Box alignSelf='end' margin={{ top:'medium' }}>
            <FlatButton 
              onClick={()=>setAdvancedOpen(!advancedOpen)}
              disabled={allDisabled}
              label={
                <Box direction='row' gap='medium' align='center'>
                  <Text size='xsmall' color='text-weak'> { advancedOpen ? 'Use 1-Click RateLock':'Use advanced RateLock' }</Text>
                </Box>
                }
            />
          </Box> 
          } 
          </Box>  
        </Box>

      </Keyboard>

      {mobile && 
        <YieldMobileNav noMenu={true}>
          <NavLink 
            to="/borrow"
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='small'>
              <Text size='xxsmall' color='text-weak'><ArrowLeft /></Text>
              <Text size='xxsmall' color='text-weak'>back</Text>
            </Box>
          </NavLink>
        </YieldMobileNav>}
    </>

  );
};

RateLock.defaultProps={ close:null, openConnectLayer:null, asLayer:false };

export default RateLock;
