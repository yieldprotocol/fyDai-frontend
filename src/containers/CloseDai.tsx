import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { Box, TextInput, Text, Keyboard, ResponsiveContext } from 'grommet';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';

import { cleanValue } from '../utils';
import { logEvent } from '../utils/analytics';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useTxActive } from '../hooks/txHooks';
import { usePool } from '../hooks/poolHook';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

import InputWrap from '../components/InputWrap';
import TxStatus from '../components/TxStatus';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import DaiMark from '../components/logos/DaiMark';
import YieldMobileNav from '../components/YieldMobileNav';
import SeriesDescriptor from '../components/SeriesDescriptor';

interface ICloseDaiProps {
  close: any;
}

const CloseDai = ({ close }:ICloseDaiProps) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const { actions: userActions } = useContext(UserContext);
  const { state: { activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);

  const [ closeDisabled, setCloseDisabled ] = useState<boolean>(true);

  const { previewPoolTx }  = usePool();
  const { buyDai }  = useBorrowProxy();
  const { account, fallbackProvider } = useSignerAccount();
  const [ txActive ] = useTxActive(['BUY_DAI', 'AUTH']);

  const [ inputValue, setInputValue ] = useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);
  const isLol = useIsLol(inputValue);

  const [ maxWithdraw, setMaxWithdraw ] = useState<string>();
  
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  
  const withdrawProcedure = async () => {
    if ( !closeDisabled ) {

      !activeSeries?.isMature() && close();
      await buyDai(
        activeSeries,
        inputValue,
      );
      logEvent({
        category: 'ClosePosition',
        action: inputValue,
        label: activeSeries.displayName || activeSeries.poolAddress,
      });
      
      /* clean up and refresh */ 
      setInputValue(undefined);
      userActions.updateUser();
      seriesActions.updateSeries([activeSeries]);
    }
  };

  useEffect(()=> {
    fallbackProvider && account && activeSeries.fyDaiBalance && (async () => {
      const preview = await previewPoolTx('sellFYDai', activeSeries, activeSeries.fyDaiBalance);
      if (!(preview instanceof Error)) {
        setMaxWithdraw(cleanValue(ethers.utils.formatEther(preview), 6));
      }
    })();
  }, [account, activeSeries.fyDaiBalance, fallbackProvider]);

  /* Withdraw DAi button disabling logic */
  useEffect(()=>{
    (
      !account ||
      !inputValue || 
      parseFloat(inputValue) <= 0
    ) ? setCloseDisabled(true): setCloseDisabled(false);
  }, [ inputValue ]);

  /* show warnings and errors with collateralization ratio levels and inputs */
  useEffect(()=>{
    if ( debouncedInput && maxWithdraw && (debouncedInput > maxWithdraw) ) {
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
      onEnter={()=> withdrawProcedure()}
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

          <ActionButton
            onClick={()=> withdrawProcedure()}
            label={`Reclaim ${inputValue || ''} Dai`}
            disabled={closeDisabled}
            hasPoolDelegatedProxy={activeSeries.hasPoolDelegatedProxy}
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
