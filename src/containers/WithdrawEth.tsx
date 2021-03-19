import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Keyboard, TextInput, Text, ResponsiveContext, Collapsible } from 'grommet';
import ethers from 'ethers';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';

/* utils and support */
import { cleanValue, analyticsLogEvent, ZERO } from '../utils';

/* contexts */
import { UserContext } from '../contexts/UserContext';

/* hooks */
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

/* components */
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import EthMark from '../components/logos/EthMark';
import YieldMobileNav from '../components/YieldMobileNav';
import { useSignerAccount } from '../hooks/connectionHooks';

interface IWithDrawProps {
  close?: any;
}

const WithdrawEth = ({ close }:IWithDrawProps) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  /* state from contexts */
  const { state: { position }, actions: userActions } = useContext(UserContext);
  const {
    ethPosted,
    ethLocked,
    collateralPercent_,
    debtValue,
    debtValue_,
  } = position;

  /* local state */ 
  const [ inputValue, setInputValue ] = useState<any>();
  const [inputRef, setInputRef] = useState<any>(null);
  const [ estPercent, setEstPercent ] = useState<string| undefined>(undefined);
  const [ maxWithdraw, setMaxWithdraw ] = useState<string>();
  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  /* init hooks */
  const { withdrawEth } = useBorrowProxy();
  const { estCollateralRatio } = useMath();
  const [ txActive ] = useTxActive(['WITHDRAW']);
  const debouncedInput = useDebounce(inputValue, 500);
  const isLol = useIsLol(inputValue);
  const { account } = useSignerAccount();

  /* execution procedure */
  const withdrawProcedure = async () => {
    if (inputValue && !withdrawDisabled ) {

      analyticsLogEvent(
        'Withdraw_initiated', 
        {
          value: inputValue,
          series: null,
          maturity: null, 
          time_to_maturity: null,
          account: account?.substring(2),
        });
        
      close(); // close immediately, no need to track withdrawPending
      await withdrawEth(inputValue);

      /* clean up and refresh */ 
      setInputValue(undefined);
      userActions.updateUser();
    }
  };

  /* Calculate maximum available to withdraw */
  useEffect(()=>{
    ethPosted && ethLocked && setMaxWithdraw( ethers.utils.formatEther(ethPosted.sub(ethLocked) )) ;
  }, [ethPosted, ethLocked]);

  /* Calculate collateralization Ratio based on input */ 
  useEffect(()=>{
    const parsedInput = ethers.utils.parseEther(debouncedInput || '0');
    if ( debouncedInput && ethPosted.gt(parsedInput) && debtValue_) {
      const newPercent = estCollateralRatio((ethPosted.sub( parsedInput )), debtValue, true); 
      setEstPercent(cleanValue(newPercent, 10)); 
    }
  }, [ debouncedInput ]);

  /* Withdraw disabled logic */
  useEffect(()=>{

    if (debtValue.lte(ZERO) && parseFloat(inputValue) > 0 && !txActive) {
      setWithdrawDisabled(false);
    } else {
      ( !estPercent ||
        parseFloat(estPercent) < 150 ||
        txActive ||
        !inputValue ||
        parseFloat(inputValue) <= 0
      ) ? setWithdrawDisabled(true) : setWithdrawDisabled(false);
    }

  }, [ inputValue, estPercent ]);

  /* show warnings and errors with collateralization ratio levels and inputs */
  useEffect(()=>{
    if ( debouncedInput && maxWithdraw && (debouncedInput > maxWithdraw) ) {
      setWarningMsg(null);
      setErrorMsg('That exceeds the amount of ETH you can withdraw right now.');
    } else if ( estPercent && parseFloat(estPercent) >= 150 && parseFloat(estPercent) < 200 ) {
      setErrorMsg(null);
      setWarningMsg('A collateralization ratio of close to 150% will put you at risk of liquidation');
    } else {   
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ estPercent, debouncedInput ]);

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
      { !txActive &&
      <Box 
        width={!mobile?{ min:'620px', max:'620px' }: undefined}
        alignSelf='center'
        fill
        background='background'
        round='small'
        pad='large'
        gap='medium'
        justify='between'
      >        
        <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to withdraw</Text>

        <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
          <TextInput
            ref={(el:any) => {el && !mobile && el.focus(); setInputRef(el);}} 
            type="number"
            placeholder='ETH'
            value={inputValue || ''}
            plain
            onChange={(event:any) => setInputValue(cleanValue(event.target.value))}
            icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <EthMark />}
          />
          <FlatButton 
            label='Withdraw maximum'
            onClick={()=>maxWithdraw && setInputValue(cleanValue(maxWithdraw))}
          />
        </InputWrap>

        <Box fill>
          <Collapsible open={!!inputValue&&inputValue>0}>
            <InfoGrid entries={[
              {
                label: 'Max withdraw',
                visible: true,
                active: true,
                loading: false, 
                value: maxWithdraw? `${parseFloat(maxWithdraw).toFixed(4)} Eth` : '-',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Ratio after Withdraw',
                visible: collateralPercent_ > 0,
                active: !!inputValue,
                loading: false,           
                value: estPercent ? `${cleanValue(estPercent, 2)}%`: collateralPercent_ || '',
                valuePrefix: '~',
                valueExtra: null,
              },
            ]}
            />
          </Collapsible>
        </Box>

        <ActionButton
          onClick={() => withdrawProcedure()}
          label={`Withdraw ${inputValue || ''} Eth`}
          disabled={withdrawDisabled}
          hasPoolDelegatedProxy={true}
          clearInput={()=>setInputValue(undefined)}
        />
          
        <Box alignSelf='start' margin={{ top:'medium' }}>
          <FlatButton 
            onClick={()=>close()}
            label={
              <Box direction='row' gap='medium' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='xsmall' color='text-weak'> cancel, and go back. </Text>
              </Box>
                }
          />
        </Box>        
      </Box>}

      {mobile && 
        <YieldMobileNav noMenu={true}>
          <NavLink 
            to="/post"
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='xsmall'>
              <Text size='xxsmall' color='text-weak'><ArrowLeft /></Text>
              <Text size='xxsmall' color='text-weak'>back</Text>
            </Box>
          </NavLink>
        </YieldMobileNav>}

    </Keyboard>
  );
};

WithdrawEth.defaultProps={ close:null };

export default WithdrawEth;
