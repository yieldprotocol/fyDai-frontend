import React, { useState, useContext, useEffect } from 'react';
import { BigNumber } from 'ethers';

import { 
  Box, 
  Button,
  Keyboard,
  TextInput, 
  Text,
  ResponsiveContext,
} from 'grommet';

import { 
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import EthMark from '../components/logos/EthMark';

import { UserContext } from '../contexts/UserContext';

import { 
  useProxy, 
  useTxActive, 
  useMath, 
  useSignerAccount, 
  useDebounce
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
  depositAmount?:number|BigNumber|null;
}

const Deposit = ({ setActiveView, modalView, depositAmount }:DepositProps) => {
  const { state: userState, actions: userActions } = useContext(UserContext);
  const {
    ethBalance_,
    ethPosted_,
    collateralPercent_,
    debtValue_,
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

  /* Steps required to deposit and update values */
  const depositProcedure = async (value:number) => {
    if ( !depositDisabled ) {
      setDepositPending(true);
      await postEth(value);
      await userActions.updatePosition();
      setDepositPending(false);
    }
  };

  /* Handle input value changes */
  useEffect(()=>{
    /* 1. Adjust estimated ratio based on input changes */
    if (debouncedInput && ethPosted_ && debtValue_) {
      const newRatio = estimateRatio((ethPosted_+ parseFloat(debouncedInput)), debtValue_); 
      newRatio && setEstRatio(newRatio.toFixed(0));
    }
  }, [debouncedInput]);

  /* Handle deposit disabling deposits */
  useEffect(()=>{   
    (
      ethBalance_<= 0 ||
      inputValue > ethBalance_ ||
      txActive ||
      !account ||
      !inputValue ||
      parseFloat(inputValue) === 0    
    ) ? setDepositDisabled(true) : setDepositDisabled(false);
  }, [inputValue]);

  /* Handle input exceptions and warnings */
  useEffect(()=>{   
    if ( debouncedInput && ( debouncedInput > ethBalance_) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds your available ETH balance'); 
    } else if (debouncedInput && (debouncedInput === ethBalance_) ) {
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
      onEnter={()=> depositProcedure(inputValue)}
      onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
      target='document'
    >
      { withdrawOpen && <WithdrawEth close={()=>setWithdrawOpen(false)} /> }    
      { (!txActive || txActive?.type === 'WITHDRAW') &&
        <Box
          // width={{ max: '750px' }}
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
              onChange={(event:any) => setInputValue(event.target.value)}
              icon={<EthMark />}
            />

            <RaisedButton
              // color='brand-transparent'
              disabled={!account || ethBalance_=== 0}
              label={(screenSize !== 'small' && !modalView) ? 'Deposit Maximum': 'Max'}
              onClick={()=>setInputValue(ethBalance_)}
              // hoverIndicator='brand-transparent'
            />
            

          </InputWrap>

          <InfoGrid entries={[
            {
              label: 'Current Collateral',
              visible: !!account,
              active: true,
              loading: depositPending || txActive?.type ==='WITHDRAW',     
              value: ethPosted_ ? `${ethPosted_.toFixed(4)} Eth` : '0 Eth',
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

          {/* { account &&
            <Box
              fill='horizontal'
              round='small'
              background={depositDisabled ? 'brand-transparent' : 'brand'}
              onClick={()=>depositProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text
                weight='bold'
                size='large'
                color={depositDisabled ? 'text-xweak' : 'text'}
              >
                {`Deposit ${inputValue || ''} Eth`}
              </Text>
            </Box>} */}

          {account &&  
            <ActionButton
              onClick={()=>depositProcedure(inputValue)}
              label={`Deposit ${inputValue || ''} Eth`}
              disabled={depositDisabled}
            /> }

          { ethPosted_ > 0 &&

          <Box alignSelf='end'>

            <FlatButton 
              onClick={()=>setWithdrawOpen(true)}
              label={
                <Box direction='row' gap='small' align='center'>
                  <Box><Text size='xsmall' color='text-weak'>alternatively, withdraw collateral</Text></Box>
                  <ArrowRight color='text-weak' />
                </Box>}
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
