import React, { useState, useContext, useEffect } from 'react';
import ethers, { BigNumber } from 'ethers';

import { 
  Box,
  Keyboard,
  TextInput, 
  Text,
  ResponsiveContext,
} from 'grommet';

import {
  FiArrowRight as ArrowRight,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import EthMark from '../components/logos/EthMark';

import { cleanValue } from '../utils';

import { UserContext } from '../contexts/UserContext';

import { 
  useProxy, 
  useTxActive, 
  useMath, 
  useSignerAccount, 
  useDebounce,
  useIsLol
} from '../hooks';

import WithdrawEth from './WithdrawEth';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import ApprovalPending from '../components/ApprovalPending';
import TxPending from '../components/TxPending';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';

interface DepositProps {
  /* deposit amount prop is for quick linking into component */
  setActiveView: any;
  modalView?:boolean;
  depositAmount?:string|BigNumber;
}

const Deposit = ({ setActiveView, modalView, depositAmount }:DepositProps) => {
  const { state: userState, actions: userActions } = useContext(UserContext);
  const {
    ethBalance,
    ethPosted,
    ethPosted_,
    collateralPercent_,
    debtValue,
  } = userState.position;

  const screenSize = useContext(ResponsiveContext);

  const { postEth, postEthActive }  = useProxy();
  const { estCollRatio: estimateRatio } = useMath();
  const [ txActive ] = useTxActive(['DEPOSIT', 'WITHDRAW']);
  const { account } = useSignerAccount();

  const [ inputValue, setInputValue ] = useState<any>(depositAmount || undefined);
  const debouncedInput = useDebounce(inputValue, 500);

  const [inputRef, setInputRef] = useState<any>(null);

  const [ estRatio, setEstRatio ] = useState<any>(0);

  const [ withdrawOpen, setWithdrawOpen ] = useState<boolean>(false);
  const [ depositPending, setDepositPending ] = useState<boolean>(false);
  const [ depositDisabled, setDepositDisabled ] = useState<boolean>(true);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);
  const isLol = useIsLol(inputValue);

  /* Steps required to deposit and update values */
  const depositProcedure = async () => {
    if (inputValue && !depositDisabled ) {
      setDepositPending(true);
      await postEth(inputValue);
      setInputValue(undefined);
      await userActions.updatePosition();
      setDepositPending(false);
    }
  };

  /* Handle debounced input value changes */
  useEffect(()=>{
    /* 1. Adjust estimated ratio based on input changes */
    if (debouncedInput && ethPosted && debtValue) {
      const newRatio = estimateRatio((ethPosted.add(ethers.utils.parseEther(debouncedInput) )), debtValue); 
      newRatio && setEstRatio(parseFloat(newRatio.toString()).toFixed(0));
    }
  }, [debouncedInput]);

  /* Handle deposit disabling deposits */
  useEffect(()=>{
    (
      (account && ethBalance.eq(ethers.constants.Zero)) ||
      (account && inputValue && ethers.utils.parseEther(inputValue).gt(ethBalance)) ||
      txActive ||
      !account ||
      !inputValue ||
      parseFloat(inputValue) <= 0    
    ) ? setDepositDisabled(true) : setDepositDisabled(false);
  }, [inputValue]);

  /* Handle input exceptions and warnings */
  useEffect(()=>{   
    if ( ethBalance && debouncedInput && ( ethers.utils.parseEther(debouncedInput).gt(ethBalance) ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds your available ETH balance'); 
    } else if (ethBalance && debouncedInput && (ethers.utils.parseEther(debouncedInput).eq(ethBalance)) ) {
      setErrorMsg(null);
      setWarningMsg('If you deposit all your ETH you may not be able to make any further transactions!');
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [debouncedInput]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> depositProcedure()}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.slice(0, -1))}
      target='document'
    >
      { withdrawOpen && <WithdrawEth close={()=>setWithdrawOpen(false)} /> }    
      { (!txActive || txActive?.type === 'WITHDRAW') &&
        <Box
          alignSelf="center"
          fill
          background="background-front"
          round='small'
          pad='large'
          gap='medium'
        >
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to deposit</Text>

          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={depositDisabled}>
            <TextInput
              ref={(el:any) => {el && !withdrawOpen && el.focus(); setInputRef(el);}} 
              type='number'
              placeholder={(screenSize !== 'small' && !modalView) ? 'Enter the ETH amount to deposit': 'ETH'}
              value={inputValue || ''}
              disabled={postEthActive}
              plain
              onChange={(event:any) => setInputValue( cleanValue(event.target.value) )}
              icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <EthMark />}
            />
            <RaisedButton
              label={(screenSize !== 'small' && !modalView) ? 'Deposit Maximum': 'Max'}
              onClick={()=>account && setInputValue(ethers.utils.formatEther(ethBalance))}
            />
          </InputWrap>

          <InfoGrid entries={[
            {
              label: 'Current Collateral',
              visible: !!account,
              active: true,
              loading: depositPending || txActive?.type ==='WITHDRAW',     
              value: ethPosted_ ? `${ethPosted_} Eth` : '0 Eth',
              valuePrefix: null,
              valueExtra: null,
            },
            {
              label: 'Collateralization Ratio',
              visible: !!account && collateralPercent_ > 0,
              active: collateralPercent_ > 0,
              loading: !ethPosted_ && depositPending && ethPosted_ !== 0,            
              value: (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '',
              valuePrefix: null,
              valueExtra: null, 
            },
            {
              label: 'Ratio after Deposit',
              visible: !!account && collateralPercent_ > 0,
              active: inputValue,
              loading: !ethPosted_ && depositPending && ethPosted_ !== 0,           
              value: (estRatio && estRatio !== 0)? `${estRatio}%`: collateralPercent_ || '',
              valuePrefix: 'Approx.',
              valueExtra: () => (
                <Text color='green' size='medium'> 
                  { inputValue && collateralPercent_ && ( (estRatio-collateralPercent_) !== 0) && `(+ ${(estRatio-collateralPercent_).toFixed(0)}%)` }
                </Text>
              )
            },
            {
              label: 'First connect a wallet!',
              visible: !account && inputValue,
              active: inputValue,
              loading: false,            
              value: '',
              valuePrefix: null,
              valueExtra: () => (
                <RaisedButton
                  label={<Text size='small'>Connect a wallet</Text>}
                  onClick={()=>console.log('still to implement')}
                /> 
              )
            },
          ]}
          />

          {account &&  
            <ActionButton
              onClick={()=>depositProcedure()}
              label={`Deposit ${inputValue || ''} Eth`}
              disabled={depositDisabled}
            /> }

          { ethPosted_ > 0 &&

          <Box 
            direction='row'
            fill='horizontal'
            justify='between' 
            margin={{ top:'medium' }}
          >
            <FlatButton 
              onClick={()=>setActiveView(1)}
              label={
                <Box direction='row' gap='small' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Box><Text size='xsmall' color='text-weak'>back to borrow</Text></Box>   
                </Box>}
            />
            <FlatButton 
              onClick={()=>setWithdrawOpen(true)}
              label={
                <Box direction='row' gap='small' align='center'>
                  <Box><Text size='xsmall' color='text-weak'><Text weight='bold'>withdraw</Text> collateral</Text></Box>
                  <ArrowRight color='text-weak' />
                </Box> }
            />
          </Box>}
       
        </Box>}
      { postEthActive && !txActive && <ApprovalPending /> } 
      { txActive && txActive.type !== 'WITHDRAW' && <TxPending msg={`You are depositing ${inputValue} ETH`} tx={txActive} /> }
    </Keyboard>
  );
};

Deposit.defaultProps = { depositAmount: null, modalView: false };

export default Deposit;
