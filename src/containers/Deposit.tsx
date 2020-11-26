import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useHistory, useParams } from 'react-router-dom';
import ethers from 'ethers';

import { 
  Box,
  Keyboard,
  TextInput, 
  Text,
  ResponsiveContext, 
  Collapsible,
  Layer
} from 'grommet';

import {
  FiArrowRight as ArrowRight,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import { cleanValue } from '../utils';

import { UserContext } from '../contexts/UserContext';
import { YieldContext } from '../contexts/YieldContext';

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

import WithdrawEth from './WithdrawEth';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import TxStatus from '../components/TxStatus';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import CollateralDescriptor from '../components/CollateralDescriptor';
import RaisedBox from '../components/RaisedBox';

import EthMark from '../components/logos/EthMark';
import YieldMobileNav from '../components/YieldMobileNav';
import Loading from '../components/Loading';

import { logEvent } from '../utils/analytics';

interface DepositProps {
  /* deposit amount prop is for quick linking into component */
  openConnectLayer:any;
  modalView?:boolean;
}

const Deposit = ({ openConnectLayer, modalView }:DepositProps) => {
  const history = useHistory();
  const { state: userState, actions: userActions } = useContext(UserContext);
  const {
    ethBalance,
    ethBalance_,
    ethPosted,
    ethPosted_,
    maxDaiAvailable_,
    collateralPercent_,
    debtValue,
  } = userState.position;

  const { state: yieldState } = useContext(YieldContext);
  const { ethPrice_ } = yieldState.feedData;

  /* check if the user sent in any requested amount in the url */ 
  const { amnt }:any = useParams();

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const { postEth }  = useBorrowProxy();
  const { estCollRatio: estimateRatio, collValue } = useMath();
  const [ txActive ] = useTxActive(['POST', 'WITHDRAW']);

  const { account } = useSignerAccount();

  const [ inputValue, setInputValue ] = useState<any>(amnt || undefined);
  const debouncedInput = useDebounce(inputValue, 500);

  const [inputRef, setInputRef] = useState<any>(null);

  const [ estRatio, setEstRatio ] = useState<any>(0);
  const [ estPower, setEstPower ] = useState<any>(0);
  const [ maxPower, setMaxPower ] = useState<any>(0);

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
      logEvent({
        category: 'Deposit',
        action: inputValue
      });
      
      /* clean up and refresh */
      setInputValue(undefined);
      await userActions.updateUser();
      setDepositPending(false);
    }
  };

  useEffect(()=>{
    /* Roughly estimate the nmaximum borrowing power based on ETH balance */
    const newPower = (ethBalance_*ethPrice_)/2;
    if (maxDaiAvailable_) {
      const pl = parseFloat(maxDaiAvailable_) + newPower;
      setMaxPower(pl.toFixed(2));
    }
  }, [ethBalance_, ethPrice_, maxDaiAvailable_]);

  /* Handle debounced input value changes */
  useEffect(()=>{
    /* 1. Adjust estimated ratio based on input changes */
    if (debouncedInput && ethPosted && debtValue) {
      const newRatio = estimateRatio((ethPosted.add(ethers.utils.parseEther(debouncedInput) )), debtValue); 
      newRatio && setEstRatio(cleanValue(newRatio, 0));
    }
    /* 2. Roughly estimate the new borrowing power */
    if (debouncedInput) {
      const val = collValue(ethers.utils.parseEther(debouncedInput));
      const newPower = parseFloat(ethers.utils.formatEther(val))/2;
      if (maxDaiAvailable_) {
        const pl = parseFloat(maxDaiAvailable_) + newPower;
        setEstPower(pl.toFixed(2));
      } else {
        setEstPower(newPower.toFixed(2));
      }
    }
  }, [debouncedInput]);

  /* Handle deposit disabling deposits */
  useEffect(()=>{
    (
      (account && ethBalance?.eq(ethers.constants.Zero)) ||
      (account && inputValue && ethBalance && ethers.utils.parseEther(inputValue).gt(ethBalance)) ||
      (ethBalance && inputValue && (parseFloat(inputValue)<0.05) ) ||
      txActive ||
      !account ||
      !inputValue ||
      parseFloat(inputValue) <= 0    
    ) ? setDepositDisabled(true) : setDepositDisabled(false);
  }, [inputValue, ethBalance]);

  /* Handle input exceptions and warnings */
  useEffect(()=>{ 
    if ( ethBalance && debouncedInput && ( ethers.utils.parseEther(debouncedInput).gt(ethBalance) ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds your available ETH balance'); 
    } else if (ethBalance && debouncedInput && (ethers.utils.parseEther(debouncedInput).eq(ethBalance)) ) {
      setErrorMsg(null);
      setWarningMsg('If you deposit all your ETH you may not be able to make any further transactions!');
    } else if (debouncedInput && debouncedInput<0.05) {
      setErrorMsg('Initial collateral balance must be larger than 0.05 ETH.');
      setWarningMsg(null);
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [debouncedInput, ethBalance]);

  return (
    <RaisedBox>
      <Keyboard 
        onEsc={() => setInputValue(undefined)}
        onEnter={()=> depositProcedure()}
        onBackspace={()=> { 
          inputValue && 
          (document.activeElement !== inputRef) && 
          setInputValue(debouncedInput.slice(0, -1));
        }}
        target='document'
      >
        <CollateralDescriptor backToBorrow={()=>history.push('/borrow')}>
           
          <InfoGrid
            alt
            entries={[
              {
                label: 'Max Borrowing Power',
                labelExtra: 'based on your ETH balance',
                visible: !!account,
                active: true,
                loading: !ethPosted_ && depositPending && ethPosted_ !== 0, 
                value: maxPower && `${maxPower} DAI`,           
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: null,
                labelExtra: null,
                visible:
                  !!account &&
                  parseFloat(ethPosted_) === 0,
                active: true,
                loading: false,    
                value: null,
                valuePrefix: null,
                valueExtra: null,
              },                  
              {
                label: 'Did you know?',
                labelExtra: null,
                visible:
                  !!account &&
                  parseFloat(ethPosted_) === 0,
                active: true,
                loading: false,    
                value: null,
                valuePrefix: null,
                valueExtra: ()=>( 
                  <Box width={{ max:'200px' }}>
                    <Text size='xxsmall' color='#333333'>
                      Collateral posted can be used to borrow Dai from any one of the Yield series.
                    </Text>
                  </Box>),
              },
              {
                label: 'Current Collateral',
                labelExtra: 'posted in the Yield Protocol',
                visible: !!account && parseFloat(ethPosted_) > 0,
                active: true,
                loading: !ethPosted_ && depositPending && ethPosted_ !== 0, 
                value: ethPosted_ ? `${ethPosted_} Eth` : '0 Eth',
                valuePrefix: null,
                valueExtra: null,
              },

              {
                label: 'Collateralization Ratio',
                labelExtra: 'based on ETH posted',
                visible: !!account && collateralPercent_ > 0,
                active: true,
                loading: !ethPosted_ && depositPending && ethPosted_ !== 0,            
                value: (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '',
                valuePrefix: null,
                valueExtra: null, 
              },
            ]}
          />
        </CollateralDescriptor>
      
        { withdrawOpen &&
          <Layer onClickOutside={()=>setWithdrawOpen(false)}>
            <WithdrawEth close={()=>setWithdrawOpen(false)} />
          </Layer>}
      
        { (!txActive || txActive?.type === 'WITHDRAW') &&
        <Box
          alignSelf="center"
          fill
          background="background"
          round='small'
          pad='large'
          gap='medium'
        >
          <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to deposit</Text>

          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
            <TextInput
              ref={(el:any) => {el && !withdrawOpen && !mobile && el.focus(); setInputRef(el);}} 
              type='number'
              placeholder={(!mobile && !modalView) ? 'Enter the ETH amount to deposit': 'ETH'}
              value={inputValue || ''}
              // disabled={postEthActive}
              plain
              onChange={(event:any) => setInputValue( cleanValue(event.target.value) )}
              icon={isLol ? <span role='img' aria-label='lol'>😂</span> : <EthMark />}
            />
            <RaisedButton
              label={(!mobile && !modalView) ? 'Deposit Maximum': 'Max'}
              onClick={()=>account && setInputValue(ethers.utils.formatEther(ethBalance))}
            />
          </InputWrap>

          <Box fill>
            <Collapsible open={!!inputValue&&inputValue>0}> 
              <InfoGrid
                entries={[
                  {
                    label: 'Borrowing Power',
                    labelExtra: `est. after posting ${inputValue && cleanValue(inputValue, 2)} ETH`,
                    visible: !!account,
                    active: debouncedInput,
                    loading: !ethPosted_ && depositPending && ethPosted_ !== 0,
                    value: estPower? `${estPower} DAI`: '0 DAI',           
                    valuePrefix: null,
                    valueExtra: null,
                  },
                  {
                    label: 'Collateralization Ratio',
                    labelExtra: `est. after posting ${inputValue && cleanValue(inputValue, 2)} ETH`,
                    visible: !!account && collateralPercent_ > 0,
                    active: debouncedInput && collateralPercent_ > 0,
                    loading: !ethPosted_ && depositPending && ethPosted_ !== 0,           
                    value: (estRatio && estRatio !== 0)? `${estRatio}%`: `${collateralPercent_}%` || '',
                    valuePrefix: null,
                  // valueExtra: () => (
                  //   <Text color='green' size='medium'> 
                  //     {/* { inputValue && collateralPercent_ && ( (estRatio-collateralPercent_) !== 0) && `(+ ${(estRatio-collateralPercent_).toFixed(0)}%)` } */}
                  //   </Text>
                  // )
                  },
                  {
                    label: '',
                    labelExtra:'Connect a wallet to get started',
                    visible: !account && !!inputValue,
                    active: inputValue,
                    loading: false,            
                    value: '',
                    valuePrefix: null,
                    valueExtra: () => (
                      <Box pad={{ top:'small' }}>
                        <RaisedButton
                          label={<Box pad='xsmall'><Text size='xsmall'>Connect a wallet</Text></Box>}
                          onClick={() => openConnectLayer()}
                        /> 
                      </Box>
                    )
                  },
                ]}
              />
            </Collapsible>
          </Box>

          {account &&  
            <ActionButton
              onClick={()=>depositProcedure()}
              label={`Deposit ${inputValue || ''} Eth`}
              disabled={depositDisabled}
              hasPoolDelegatedProxy={true}
              clearInput={()=>setInputValue(undefined)}
            /> }

          {!mobile &&
          <Box 
            direction='row'
            fill='horizontal'
            justify='between' 
            margin={{ top:'medium' }}
          >
            <FlatButton 
              onClick={()=>history.push('/borrow')}
              label={
                <Box direction='row' gap='small' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Box><Text size='xsmall' color='text-weak'>back to borrow</Text></Box>   
                </Box>
            }
            />
            { ethPosted_ > 0 &&
              txActive?.type === 'WITHDRAW' ?
                <Box direction='row' gap='small'>
                  <Text size='xsmall' color='text-weak'><Text weight='bold'>withdraw</Text> pending</Text>
                  <Loading condition={true} size='xxsmall'>.</Loading>
                </Box> 
              :
                <FlatButton 
                  onClick={()=>setWithdrawOpen(true)} 
                  label={
                    <Box direction='row' gap='small' align='center'>
                      <Box><Text size='xsmall' color='text-weak'><Text weight='bold'>withdraw</Text> collateral</Text></Box>
                      <ArrowRight color='text-weak' />
                    </Box>
                  }
                />}
          </Box>}        
        </Box>}

        { txActive?.type === 'POST' && <TxStatus tx={txActive} /> }
    
      </Keyboard>

      {mobile && 
        <YieldMobileNav noMenu={true}>
          <NavLink 
            to='/borrow/'
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='small'>
              <Text size='xxsmall' color='text-weak'><ArrowLeft /></Text>
              <Text size='xxsmall' color='text-weak'>back</Text>
            </Box>
          </NavLink>

          {ethPosted_ > 0 &&
            <NavLink 
              to='/withdraw/'
              style={{ textDecoration: 'none' }}
            >
              <Box direction='row' gap='small'>
                <Text size='xxsmall' color='text-weak'> <Text weight='bold' size='xsmall'>Withdraw </Text> collateral</Text>
                <Text color='text-weak'><ArrowRight /></Text>
              </Box>
            </NavLink>}
        </YieldMobileNav>}

    </RaisedBox>
  );
};

Deposit.defaultProps = { modalView: false };

export default Deposit;
