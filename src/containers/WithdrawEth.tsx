import React, { useState, useContext, useEffect } from 'react';
import { Box, Layer, Keyboard, TextInput, Text, ResponsiveContext } from 'grommet';
import ethers from 'ethers';

import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import EthMark from '../components/logos/EthMark';

import { cleanValue } from '../utils';

import { UserContext } from '../contexts/UserContext';
import { useProxy, useMath, useTxActive, useDebounce } from '../hooks';

import ApprovalPending from '../components/ApprovalPending';
import TxPending from '../components/TxPending';
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

  const { state: { position }, actions: userActions } = useContext(UserContext);
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

  const [ inputValue, setInputValue ] = useState<string>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = useState<any>(null);

  const [ estRatio, setEstRatio ] = useState<any>();
  const [ estDecrease, setEstDecrease ] = useState<any>();
  const [ maxWithdraw, setMaxWithdraw ] = useState<string>();

  const [ hasDelegated, setHasDelegated ] = useState<boolean>( true );

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(true);
  const [ withdrawPending, setWithdrawPending ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  /* Withdraw execution flow */
  const withdrawProcedure = async () => {
    if (inputValue && !withdrawDisabled ) {
      setWithdrawPending(true);
      await withdrawEth(inputValue);
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
        console.log('new ratio', newRatio)
        setEstRatio(parseFloat(newRatio.toString()).toFixed(2));
        const newDecrease = collateralPercent_ - parseFloat(newRatio.toString());
        setEstDecrease(newDecrease.toFixed(2));
      }
    }
  }, [ debouncedInput ]);

  /* Withdraw disabled logic */
  useEffect(()=>{
    ( 
      estRatio < 150 ||
      txActive ||
      !inputValue ||
      parseFloat(inputValue) === 0
    )? setWithdrawDisabled(true) : setWithdrawDisabled(false);
  }, [ inputValue, estRatio ]);

  /* show warnings and errors with collateralisation ratio levels and inputs */
  useEffect(()=>{
    if (estRatio < 150 || (maxWithdraw && (debouncedInput > maxWithdraw) )) {
      setWarningMsg(null);
      setErrorMsg('You are not allowed to withdraw below the collateralization ratio'); 
    } else if (estRatio >= 150 && estRatio < 200 ) {
      setErrorMsg(null);
      setWarningMsg('Your collateralisation ration will put you at risk of liquidation');
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
            width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
            alignSelf='center'
            fill
            background='background-front'
            round='small'
            pad='large'
            gap='medium'
            justify='between'
          >        
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to withdraw</Text>

            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={withdrawDisabled}>
              <TextInput
                ref={(el:any) => {el && el.focus(); setInputRef(el);}} 
                type="number"
                placeholder='ETH'
                disabled={!hasDelegated}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(( cleanValue(event.target.value) ))}
                icon={<EthMark />}
              />
              <RaisedButton 
                label='Maximum'
                disabled={!hasDelegated}
                onClick={()=>setInputValue(maxWithdraw)}
              />
            </InputWrap>
        
            <InfoGrid entries={[
              {
                label: 'Max withdraw',
                visible: true,
                active: hasDelegated,
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
                valuePrefix: 'Approx.',
                valueExtra: null,
                // valueExtra: () => (
                //   <Text color='green' size='medium'> 
                //     { inputValue && collateralPercent_ && ( (estRatio-collateralPercent_) !== 0) && `(+ ${(estRatio-collateralPercent_).toFixed(0)}%)` }
                //   </Text>
                // )
              },
            ]}
            />

            <ActionButton
              onClick={()=> withdrawProcedure()}
              label={`Withdraw ${inputValue || ''} Eth`}
              disabled={withdrawDisabled}
            />  
          
            <Box alignSelf='start'>
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
          width={{ max:'750px' }}
          alignSelf='center'
          fill
          background='background-front'
          round='small'
          pad='large'
          gap='medium'
          justify='between'
        > 
          <TxPending msg={`You are withdrawing ${inputValue} ETH`} tx={txActive} />

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
