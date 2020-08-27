import React, { useState, useContext, useEffect } from 'react';
import { BigNumber } from 'ethers';

import { 
  Box, 
  Button,
  Keyboard,
  TextInput, 
  Text, 
  ThemeContext,
  ResponsiveContext,
  Collapsible,
} from 'grommet';

import { 
  FiInfo as Info,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';

import WithdrawEth from './WithdrawEth';

import InlineAlert from '../components/InlineAlert';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';
import Loading from '../components/Loading';

import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useProxy, useTxActive, useMath, useSignerAccount } from '../hooks';
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';

import EthMark from '../components/logos/EthMark';

interface DepositProps {
  /* deposit amount prop is for quick linking into component */
  setActiveView: any;
  modalView?:boolean;
  depositAmount?:number|BigNumber|null;
}

const Deposit = ({ setActiveView, modalView, depositAmount }:DepositProps) => {

  const [ inputValue, setInputValue ] = useState<any>(depositAmount || undefined);
  const [ estRatio, setEstRatio ] = useState<any>(0);
  const [ withdrawOpen, setWithdrawOpen ] = useState<boolean>(false);

  const [ depositPending, setDepositPending ] = useState<boolean>(true);
  const [ depositDisabled, setDepositDisabled ] = useState<boolean>(false);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const {  deployedContracts } = yieldState;

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);

  const { state: userState, actions: userActions } = useContext(UserContext);
  const {
    ethBalance_,
    ethPosted_,
    collateralPercent_,
    debtValue_,
  } = userState.position;

  const theme:any = useContext(ThemeContext);
  const screenSize = React.useContext(ResponsiveContext);

  const { postEth, postEthActive }  = useProxy();
  const { estCollRatio: estimateRatio } = useMath();
  const [ txActive ] = useTxActive(['DEPOSIT', 'WITHDRAW']);
  const { account } = useSignerAccount();

  /* Steps required to deposit and update values */
  const depositProcedure = async (value:number) => {
    if ( !depositDisabled ) {
      setDepositPending(true);
      await postEth(deployedContracts.YieldProxy, value);
      await userActions.updatePosition();
      setDepositPending(false);
      // setActiveView('BORROW');
    }
  };

  /* Handle input value changes (info, warnings errors etc.) */
  useEffect(()=>{
    /* 1. Adjust estimated ratio based on input changes */
    if (inputValue && ethPosted_ && debtValue_) {
      const newRatio = estimateRatio((ethPosted_+ parseFloat(inputValue)), debtValue_); 
      newRatio && setEstRatio(newRatio.toFixed(0));
    }
    /* 2. Input errors and warnings */
    if ( inputValue && ( inputValue > ethBalance_) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds your available ETH balance'); 
    } else if (inputValue && (inputValue === ethBalance_) ) {
      setErrorMsg(null);
      setWarningMsg('If you deposit all your ETH you may not be able to make any further transactions!');
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [inputValue]);

  /* Handle deposit disabling deposits */
  useEffect(()=>{   
    (
      !account || 
      ethBalance_ <= 0 || 
      txActive ||
      (inputValue && inputValue>0 && inputValue > ethBalance_)      
    ) ? setDepositDisabled(true) : setDepositDisabled(false);
  }, [inputValue]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> depositProcedure(inputValue)}
      target='document'
    >
      <>
        { withdrawOpen && <WithdrawEth close={()=>setWithdrawOpen(false)} /> }
        
        { (!txActive || txActive?.type === 'WITHDRAW') &&
        <Box gap='small'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to deposit</Text>

          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={depositDisabled}>
            <TextInput
              type='number'
              placeholder={(screenSize !== 'small' && !modalView) ? 'Enter the ETH amount to deposit': 'ETH'}
              value={inputValue || ''}
              disabled={postEthActive}
              plain
              onChange={(event:any) => setInputValue(event.target.value)}
              icon={<EthMark />}
            />
            <Button
              color='brand-transparent'
              disabled={!account || ethBalance_=== 0}
              label={<Text size='xsmall' color='brand'> { (screenSize !== 'small' && !modalView) ? 'Deposit Maximum': 'Max'}</Text>}
              onClick={()=>setInputValue(ethBalance_)}
              hoverIndicator='brand-transparent'
            />
          </InputWrap>

          <InfoGrid entries={[
            {
              label: 'Current Collateral',
              visible: !!account,
              active: true,
              loading: (!ethPosted_ && depositPending && ethPosted_ !== 0) || txActive?.type ==='WITHDRAW',     
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
              label: 'Want to deposit collateral?',
              visible: !account && inputValue,
              active: inputValue,
              loading: false,            
              value: '',
              valuePrefix: null,
              valueExtra: () => (
                <Button
                  color={inputValue? 'brand': 'brand-transparent'}
                  label={<Text size='xsmall' color='brand'>Connect a wallet</Text>}
                  onClick={()=>console.log('still to implement')}
                  hoverIndicator='brand-transparent'
                /> 
              )
            },
          ]}
          />

          { account &&
            <Box
              fill='horizontal'
              round='small'
              background={( !(inputValue>0) || depositDisabled) ? 'brand-transparent' : 'brand'}
              onClick={()=>depositProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text
                weight='bold'
                size='large'
                color={( !(inputValue>0) || depositDisabled) ? 'text-xweak' : 'text'}
              >
                {`Deposit ${inputValue || ''} Eth`}
              </Text>
            </Box>}

          { ethPosted_ > 0 &&
          <Box alignSelf='end'>
            <Box
              round
              onClick={()=>setWithdrawOpen(true)}
              hoverIndicator='brand-transparent'
              pad={{ horizontal:'small', vertical:'small' }}
              justify='center'
            >
              <Box direction='row' gap='small'>
                <Text size='xsmall' color='text-weak'> alternatively, withdraw collateral</Text>
                <ArrowRight color='text-weak' />
              </Box>
            </Box>
          </Box>}
       
        </Box>}   
        { postEthActive && !txActive && <ApprovalPending /> } 
        { txActive && txActive.type !== 'WITHDRAW' && <TransactionPending msg={`You deposited ${inputValue} Eth.`} tx={txActive} /> }
      </>
    </Keyboard>
  );
};

Deposit.defaultProps = { depositAmount: null, modalView: false };

export default Deposit;
