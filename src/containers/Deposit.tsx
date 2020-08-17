import React, { useState, useContext, useEffect } from 'react';
import { BigNumber } from 'ethers';

import { 
  Box, 
  Button,
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

import { useProxy, useTxActive, useMath } from '../hooks';
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';

import EthMark from '../components/logos/EthMark';

interface DepositProps {
  /* deposit amount prop is for quick linking into component */
  setActiveView: any;
  depositAmount?:number|BigNumber|null;
}

const Deposit = ({ setActiveView, depositAmount }:DepositProps) => {

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
  const [ txActive ] = useTxActive(['Deposit']);

  /* Steps required to deposit and update values */
  const depositProcedure = async (value:number) => {
    setDepositPending(true);
    await postEth(deployedContracts.EthProxy, value);
    await userActions.updatePosition();
    setDepositPending(false);
    setActiveView('BORROW');
  };

  /* Handle input value changes (warnings errors etc.) */
  useEffect(()=>{
    /* 1. Adjust estimated ratio based on input changes */
    if (inputValue && ethPosted_ && debtValue_) {
      const newRatio = estimateRatio((ethPosted_+ parseFloat(inputValue)), debtValue_); 
      newRatio && setEstRatio(newRatio.toFixed(0));
    }

    /* 2. Input errors and warnings */
    if ( inputValue && ( inputValue > ethBalance_) ) {
      setDepositDisabled(true);
      setWarningMsg(null);
      setErrorMsg('That amount exceeds your available ETH balance'); 
    } else if (inputValue && (inputValue === ethBalance_) ) {
      setErrorMsg(null);
      setWarningMsg('If you deposit all your ETH you may not be able to make any further transactions!');
    } else {
      setDepositDisabled(false);
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [inputValue]);

  return (
    <>
      { withdrawOpen && <WithdrawEth close={()=>setWithdrawOpen(false)} /> }
        
      { !txActive &&
      <Box gap='small'>
        <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to deposit</Text>

        <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={depositDisabled}>
          <TextInput
            type='number'
            placeholder='Enter the ETH amount to deposit'
            value={inputValue || ''}
            disabled={postEthActive}
            plain
            onChange={(event:any) => setInputValue(event.target.value)}
            icon={<EthMark />}
          />
          <Button
            secondary
            label={<Box>Max</Box>}
            onClick={()=>setInputValue(ethBalance_)}
            hoverIndicator='brand-transparent'
          />
        </InputWrap>

        <InfoGrid entries={[
          {
            label: 'Current Collateral',
            visible: true,
            active: true,
            loading: !ethPosted_ && depositPending && ethPosted_ !== 0,     
            value: ethPosted_ ? `${ethPosted_.toFixed(4)} Eth` : '0 Eth',
            valuePrefix: null,
            valueExtra: null, 
          },

          {
            label: 'Collateralization Ratio',
            visible: true,
            active: collateralPercent_ > 0,
            loading: !ethPosted_ && depositPending && ethPosted_ !== 0,            
            value: (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '',
            valuePrefix: null,
            valueExtra: null, 
          },
          {
            label: 'Ratio after Deposit',
            visible: true,
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
        ]}
        />

        <Box
          fill='horizontal'
          round='small'
          background={( !(inputValue>0) || depositDisabled) ? 'brand-transparent' : 'brand'}
          onClick={(!(inputValue>0) || depositDisabled)? ()=>{}:()=>depositProcedure(inputValue)}
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
        </Box>

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
        </Box>
       
      </Box>}   
      { postEthActive && !txActive && <ApprovalPending /> } 
      { txActive && <TransactionPending msg={`You deposited ${inputValue} Eth.`} tx={txActive} /> }
    </>
  );
};

Deposit.defaultProps = { depositAmount: null };

export default Deposit;
