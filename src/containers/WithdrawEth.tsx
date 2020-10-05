import React, { useState, useContext, useEffect } from 'react';
import { Box, Layer, Keyboard, TextInput, Text, ResponsiveContext, Collapsible } from 'grommet';
import ethers from 'ethers';

import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import EthMark from '../components/logos/EthMark';

import { cleanValue } from '../utils';

import { UserContext } from '../contexts/UserContext';
import { useProxy, useMath, useTxActive, useDebounce, useIsLol } from '../hooks';

import ApprovalPending from '../components/ApprovalPending';
import TxStatus from '../components/TxStatus';
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

interface IWithDrawProps {
  close?: any;
}

const WithdrawEth = ({ close }:IWithDrawProps) => {

  const screenSize = useContext(ResponsiveContext);

  const { state: { position, authorizations }, actions: userActions } = useContext(UserContext);
  const { hasDelegatedProxy } = authorizations;
  const {
    ethPosted,
    ethPosted_,
    ethLocked,
    ethLocked_,
    collateralPercent_,
    debtValue,
    debtValue_,
  } = position;
  
  const { withdrawEth, withdrawEthActive }  = useProxy();
  const { estCollRatio: estimateRatio } = useMath();
  const [ txActive ] = useTxActive(['WITHDRAW']);

  const [ inputValue, setInputValue ] = useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);

  const [ estRatio, setEstRatio ] = useState<any>();
  const [ estDecrease, setEstDecrease ] = useState<any>();
  const [ maxWithdraw, setMaxWithdraw ] = useState<string>();

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(true);
  const [ withdrawPending, setWithdrawPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const isLol = useIsLol(inputValue);

  /* Withdraw execution flow */
  const withdrawProcedure = async () => {
    if (inputValue && !withdrawDisabled ) {
      setWithdrawPending(true);
      await withdrawEth(inputValue);
      setInputValue(undefined);
      userActions.updatePosition();
      setWithdrawPending(false);
      close();
    }
  };

  /* Calculate maximum available to withdraw */
  useEffect(()=>{
    setMaxWithdraw( ethers.utils.formatEther(ethPosted.sub(ethLocked) )) ;
  }, [ethPosted_, ethLocked_]);

  /* Calculate collateralization Ratio based on input */ 
  useEffect(()=>{
    const parsedInput = ethers.utils.parseEther(debouncedInput || '0');
    if ( debouncedInput && ethPosted.gt(parsedInput) && debtValue_) {
      const newRatio = estimateRatio((ethPosted.sub( parsedInput )), debtValue); 
      // const newRatio = estimateRatio((ethPosted_ - parseFloat(inputValue)).toString(), debtValue_);
      if (newRatio) {
        console.log('new ratio', newRatio);
        setEstRatio(parseFloat(newRatio.toString()).toFixed(2));
        const newDecrease = collateralPercent_ - parseFloat(newRatio.toString());
        setEstDecrease(newDecrease.toFixed(2));
      }
    }
  }, [ debouncedInput ]);

  /* Withdraw disabled logic */
  useEffect(()=>{
    ( estRatio < 150 ||
      txActive ||
      !inputValue ||
      !hasDelegatedProxy ||
      parseFloat(inputValue) <= 0
    )? setWithdrawDisabled(true) : setWithdrawDisabled(false);
  }, [ inputValue, estRatio, hasDelegatedProxy ]);

  /* show warnings and errors with collateralization ratio levels and inputs */
  useEffect(()=>{

    if ( debouncedInput && maxWithdraw && (debouncedInput > maxWithdraw) ) {
      setWarningMsg(null);
      setErrorMsg('That exceeds the amount of ETH you can withdraw right now.');
    } else if (estRatio >= 150 && estRatio < 200 ) {
      setErrorMsg(null);
      setWarningMsg('A collateralization ratio of close to 150% will put you at risk of liquidation');
    } else {   
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ estRatio, debouncedInput ]);

  return (
    <Layer 
      onClickOutside={()=>close()}
    >
      <Keyboard 
        onEsc={() => { inputValue? setInputValue(undefined): close();}}
        onEnter={()=> withdrawProcedure()}
        onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
        target='document'
      >
        { !txActive && !withdrawPending && 
          <Box 
            width={screenSize!=='small'?{ min:'600px', max:'600px' }: undefined}
            alignSelf='center'
            fill
            background='background-front'
            round='small'
            pad='large'
            gap='medium'
            justify='between'
          >        
            <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to withdraw</Text>

            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={withdrawDisabled}>
              <TextInput
                ref={(el:any) => {el && el.focus(); setInputRef(el);}} 
                type="number"
                placeholder='ETH'
                disabled={!hasDelegatedProxy}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(cleanValue(event.target.value))}
                icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <EthMark />}
              />
              <RaisedButton 
                label='Withdraw maximum'
                disabled={!hasDelegatedProxy}
                onClick={()=>maxWithdraw && setInputValue(cleanValue(maxWithdraw))}
              />
            </InputWrap>

            <Box fill>
              <Collapsible open={!!inputValue&&inputValue>0}>
                <InfoGrid entries={[
                  {
                    label: 'Max withdraw',
                    visible: true,
                    active: hasDelegatedProxy,
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
                    value: (estRatio && estRatio !== 0)? `${estRatio}%`: collateralPercent_ || '',
                    valuePrefix: '~',
                    valueExtra: null,
                    // valueExtra: () => (
                    //   <Text color='green' size='medium'> 
                    //     { inputValue && collateralPercent_ && ( (estRatio-collateralPercent_) !== 0) && `(+ ${(estRatio-collateralPercent_).toFixed(0)}%)` }
                    //   </Text>
                    // )
                  },
                ]}
                />
              </Collapsible>
            </Box>

            <ActionButton
              onClick={()=> withdrawProcedure()}
              label={`Withdraw ${inputValue || ''} Eth`}
              disabled={withdrawDisabled}
              hasDelegatedPool={true}
            />  
          
            <Box alignSelf='start' margin={{ top:'medium' }}>
              <FlatButton 
                onClick={()=>close()}
                label={
                  <Box direction='row' gap='medium' align='center'>
                    <ArrowLeft color='text-weak' />
                    <Text size='small' color='text-weak'> { !withdrawPending? 'cancel, and go back.': 'go back'}</Text>
                  </Box>
                }
              />
            </Box>
            
          </Box>}

        { withdrawPending && !txActive && <ApprovalPending /> }
          
        { txActive && 
        <Box 
          width={{ max:'600px' }}
          alignSelf='center'
          fill
          background='background-front'
          round='small'
          pad='large'
          gap='medium'
          justify='between'
        > 
          <TxStatus msg={`You are withdrawing ${inputValue} ETH`} tx={txActive} />

          <Box alignSelf='start'>
            <Box
              round
              onClick={()=>close()}
              hoverIndicator='brand-transparent'
              pad={{ horizontal:'small', vertical:'small' }}
              justify='center'
            >
              <Box direction='row' gap='small' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='xsmall' color='text-weak'> { !withdrawPending? 'cancel, and go back.': 'go back'}  </Text>
              </Box>
            </Box>
          </Box>
        </Box>}
      </Keyboard>
    </Layer>
  );
};

WithdrawEth.defaultProps={ close:null };

export default WithdrawEth;
