import React, { useState, useContext, useEffect } from 'react';
import { BigNumber } from 'ethers';

import { 
  Box, 
  TextInput, 
  Text, 
  ThemeContext,
} from 'grommet';

import { ScaleLoader } from 'react-spinners';

import { 
  FiInfo as Info,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';

import WithdrawEth from './WithdrawEth';

import InlineAlert from '../components/InlineAlert';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';

import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useProxy, useTxActive, useMath } from '../hooks';

interface DepositProps {
  /* deposit amount prop is for quick linking into component */
  depositAmount?:number|BigNumber|null;
}

const Deposit = ({ depositAmount }:DepositProps) => {

  const [ inputValue, setInputValue ] = useState<any>(depositAmount || undefined);
  const [ estRatio, setEstRatio ] = useState<any>(0);
  
  const [ withdrawOpen, setWithdrawOpen ] = useState<boolean>(false);

  const [ depositPending, setDepositPending ] = useState<boolean>(false);

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

  const { postEth, postEthActive }  = useProxy();
  const { estCollRatio: estimateRatio } = useMath();
  const [ txActive ] = useTxActive(['Deposit']);

  /* Steps required to deposit and update values */
  const depositProcedure = async (value:number) => {
    setDepositPending(true);
    await postEth(deployedContracts.EthProxy, value);

    await userActions.updatePosition();
    setInputValue('');
    setDepositPending(false);
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
      <Box
        gap='large'         
      >
        <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to deposit</Text>

        <Box gap='medium' justify='between' align='center' fill='horizontal'>       
          <Box
            direction='row-responsive'
            fill='horizontal'
            gap='small'
            align='center'
          >
            <Box 
              round='medium'
              // background='brand-transparent'
              border='all'
              direction='row'
              fill='horizontal'
              pad='small'
              flex
            >
              <TextInput
                type='number'
                placeholder='Enter the ETH amount to deposit'
                value={inputValue || ''}
                disabled={postEthActive}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
              // icon={<Text alignSelf='start' size='xsmall'>Eth</Text>}
                icon={<Ethereum />}
              />
              
            </Box>
            <Box justify='center'>
              <Box
                round
                onClick={()=>setInputValue(ethBalance_)}
                hoverIndicator='brand-transparent'
                border='all'
                // border={{ color:'brand' }}
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Text size='xsmall'>Use max</Text>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box fill direction='row-responsive' justify='evenly'>
          <Box gap='small'>
            <Text color='text-weak' size='xsmall'>Current Collateral</Text>
            { depositPending ?    
              <ScaleLoader color={theme?.global?.colors['brand-transparent'].dark} height='13' /> 
              :
              <Text color='brand' weight='bold' size='medium'> { ethPosted_ ? 
                `${ethPosted_.toFixed(4)} Eth` 
                : '0 Eth' }
              </Text>}
          </Box>       

          <Box gap='small'>
            <Text color='text-weak' size='xsmall'>Collateralization Ratio</Text>
            <Text color='brand' weight='bold' size='medium'>
              { (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '' }
            </Text>
            { collateralPercent_ === 0 && 
            <Box direction='row'>
              <Text color='brand-transparent' size='xxsmall'>
                'No Dai has been borrowed yet.'
              </Text>
            </Box>}
          </Box>

          <Box gap='small' alignSelf='start' align='center'>
            <Text color='text-weak' size='xsmall'>Collateralization Ratio after Deposit</Text>
            <Box direction='row' gap='small'>
              <Text color={!inputValue? 'brand-transparent': 'brand'} size='xxsmall'>approx.</Text> 
              <Text color={!inputValue? 'brand-transparent': 'brand'} weight='bold' size='medium'> 
                {(estRatio && estRatio !== 0)? `${estRatio}%`: collateralPercent_ || '' }
              </Text>
              { true &&
                <Text color='green' size='medium'> 
                  { inputValue && collateralPercent_ && ( (estRatio-collateralPercent_) !== 0) && `(+ ${(estRatio-collateralPercent_).toFixed(0)}%)` }
                </Text>}
            </Box>
          </Box>           
        </Box>

        <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />

        <Box
          fill='horizontal'
          round='medium'
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
