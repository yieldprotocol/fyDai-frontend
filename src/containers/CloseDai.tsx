import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { Box, TextInput, Text, Keyboard, ResponsiveContext } from 'grommet';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';

/* utils and support */
import { analyticsLogEvent, cleanValue } from '../utils';

/* contexts */
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

/* hooks */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useTxActive } from '../hooks/txHooks';
import { useMath } from '../hooks/mathHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

/* components */
import InputWrap from '../components/InputWrap';
import TxStatus from '../components/TxStatus';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import DaiMark from '../components/logos/DaiMark';
import YieldMobileNav from '../components/YieldMobileNav';
import SeriesDescriptor from '../components/SeriesDescriptor';
import InfoGrid from '../components/InfoGrid';

interface ICloseDaiProps {
  close: any;
}

const CloseDai = ({ close }:ICloseDaiProps) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  /* state from context */
  const { state: userState, actions: userActions } = useContext(UserContext);

  const { authorization :{ hasDsProxy } } = userState;

  const { state: { activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);

  /* local state */ 
  const [ inputValue, setInputValue ] = useState<any>();
  const [ inputRef, setInputRef ] = useState<any>(null);
  const [ closeDisabled, setCloseDisabled ] = useState<boolean>(true);
  const [ maxWithdraw, setMaxWithdraw ] = useState<string>();
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const [ interestEarned, setInterestEarned ] = useState<string>();

  /* init hooks */
  const { estTrade }  = useMath();
  const { buyDai }  = useBorrowProxy();
  const { account, fallbackProvider } = useSignerAccount();
  const [ txActive ] = useTxActive(['BUY_DAI', 'AUTH']);
  const debouncedInput = useDebounce(inputValue, 500);
  const isLol = useIsLol(inputValue);
 
  /* execution procedure */
  const closeProcedure = async () => {
    if ( !closeDisabled ) {

      try { 
        analyticsLogEvent(
          'Close_initiated', 
          {
            value: inputValue,
            series: activeSeries ? activeSeries.displayName : null,
            maturity: activeSeries ? activeSeries.maturity: null, 
            time_to_maturity: activeSeries ? (new Date().getTime()/1000) - activeSeries?.maturity : null,
            account: account?.substring(2),
          });
      } catch (e) {
        console.log('Analytics error');
      }

      !activeSeries?.isMature() && close();
      await buyDai(
        activeSeries,
        inputValue,
      );
          
      /* clean up and refresh */ 
      setInputValue(undefined);
      userActions.updateUser();
      seriesActions.updateSeries([activeSeries]);
    }
  };

  /* set maximum available to withdraw */
  useEffect(()=> {
    fallbackProvider && account && activeSeries?.fyDaiBalance && (async () => {
      const preview = estTrade('sellFYDai', activeSeries, activeSeries.fyDaiBalance);
      if (!(preview instanceof Error)) {
        setMaxWithdraw(cleanValue(ethers.utils.formatEther(preview), 6));
      }
    })();

  }, [account, activeSeries, fallbackProvider]);

  /* caluclate the percentage increase  */
  useEffect(()=> {
    inputValue && 
    inputValue > 0  && 
    activeSeries?.fyDaiBalance && 
    (async () => {
      const originalInWei = ethers.utils.parseEther(inputValue);
      const preview = estTrade('sellFYDai', activeSeries, originalInWei);
      if (!(preview instanceof Error)) {
        const previewEth = parseFloat(ethers.utils.formatEther(preview));
        const percent = (inputValue - previewEth)/inputValue * 100; 
        setInterestEarned((percent.toFixed(2)).toString());
      }
    })();
  }, [inputValue, activeSeries]);

  /* Withdraw DAi button disabling logic */
  /* Withdraw disabling logic */
  useEffect(()=>{
    (
      !account ||
      !inputValue ||
      parseFloat(inputValue) <= 0
    ) ? setCloseDisabled(true): setCloseDisabled(false);
  }, [ inputValue ]);

  /* show warnings and errors with collateralization ratio levels and inputs */
  useEffect(()=>{
    if (maxWithdraw &&  debouncedInput > parseFloat(maxWithdraw) ) {
      setWarningMsg(null);
      setErrorMsg('You are not allowed to reclaim more than you have lent'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }

  }, [ debouncedInput ]);

  return (
    <Keyboard 
      onEsc={() => { inputValue? setInputValue(undefined): close();}}
      onEnter={()=> closeProcedure()}
      onBackspace={()=> {
        inputValue && 
        (document.activeElement !== inputRef) && 
        setInputValue(debouncedInput.toString().slice(0, -1));
      }}
      target='document'
    >
      {
      !activeSeries?.isMature() && 
      !mobile && 
      <SeriesDescriptor activeView='lend' minimized />
      }

      <Box    
        width={!mobile?{ min:'620px', max:'620px' }: undefined}
        alignSelf='center'
        fill
        background='background'
        round='small'
        pad='large'
        gap='medium'
      >
        { 
        !txActive && 
        <Box gap='medium'>
          <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to close</Text>
          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
            <TextInput
              ref={(el:any) => {el && !mobile && el.focus(); setInputRef(el);}} 
              type="number"
              placeholder='DAI'
              value={inputValue || ''}
              plain
              onChange={(event:any) => setInputValue(( cleanValue(event.target.value, 6)))}
              icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
            />
            <FlatButton 
              label='Maximum'
              onClick={()=> setInputValue(maxWithdraw)}
            />
          </InputWrap>

          <Box fill>
            <InfoGrid entries={[
              {
                label: 'Max amount redeemable',
                labelExtra: 'if closing entire position now',
                visible: true,
                active: true,
                loading: false,
                value: maxWithdraw,
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Interest earned',
                labelExtra: `when closing ${inputValue} Dai `,
                visible: false, // !!interestEarned && !!inputValue && inputValue>0,
                active: false,
                loading: false,        
                value: interestEarned? `${interestEarned}%` : '',
                valuePrefix: '',
                valueExtra: null,
              },
            ]}
            />
          </Box>

          <ActionButton
            onClick={()=> closeProcedure()}
            label={`Reclaim ${inputValue || ''} Dai`}
            disabled={closeDisabled || !hasDsProxy}
            hasPoolDelegatedProxy={activeSeries?.hasPoolDelegatedProxy}
            clearInput={()=>setInputValue(undefined)}
          />
          
          {
          !mobile &&
          <Box alignSelf='start' margin={{ top:'medium' }}>
            <FlatButton 
              onClick={()=>close()}
              label={
                <Box direction='row' gap='medium' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Text size='xsmall' color='text-weak'> go back </Text>
                </Box>
                }
            />
          </Box>
          }
        </Box>
        }
        
        { 
        txActive?.type === 'BUY_DAI' &&
        <>
          <TxStatus tx={txActive} />
          <Box alignSelf='start'>
            <Box
              round
              onClick={() => close()}
              // hoverIndicator='brand-transparent'
              pad={{ horizontal: 'small', vertical: 'small' }}
              justify='center'
            >
              <Box direction='row' gap='small' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='xsmall' color='text-weak'> go back </Text>
              </Box>
            </Box>
          </Box>
        </>
        }

        {
        mobile && 
        <YieldMobileNav noMenu={true}>
          <NavLink 
            to={`/lend/${activeSeries?.maturity}`}
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='small'>
              <Text size='xxsmall' color='text-weak'><ArrowLeft /></Text>
              <Text size='xxsmall' color='text-weak'>back to lend</Text>
            </Box>
          </NavLink>
        </YieldMobileNav>
        }
      </Box>
    </Keyboard>
  );
};

export default CloseDai;
