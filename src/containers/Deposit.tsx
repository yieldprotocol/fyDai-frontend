import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useHistory, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
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

/* utils and support */
import { analyticsLogEvent, cleanValue } from '../utils';

/* contexts */
import { UserContext } from '../contexts/UserContext';

/* hooks */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

/* containers */
import WithdrawEth from './WithdrawEth';

/* components */
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

interface DepositProps {
  /* deposit amount prop is for quick linking into component */
  openConnectLayer:any;
  modalView?:boolean;
}

const Deposit = ({ openConnectLayer, modalView }:DepositProps) => {

  const history = useHistory();
  const { amnt }:any = useParams(); /* check if the user sent in any requested amount in the url */ 
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  /* state from context */
  const { state: userState, actions: userActions } = useContext(UserContext);
  const { position, authorization :{ hasDsProxy } } = userState;
  const {
    ethBalance,
    ethPosted,
    ethPosted_,
    collateralPercent_,
    debtValue,
  } = position;

  /* local state */
  const [ inputValue, setInputValue ] = useState<any>(amnt || undefined);
  const [inputRef, setInputRef] = useState<any>(null);
  const [ estPercent, setEstPercent ] = useState<string|undefined>(undefined);
  const [ estPower, setEstPower ] = useState<any>(0);
  const [ maxPower, setMaxPower ] = useState<any>(0);
  const [ withdrawOpen, setWithdrawOpen ] = useState<boolean>(false);
  const [ depositPending, setDepositPending ] = useState<boolean>(false);
  const [ depositDisabled, setDepositDisabled ] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  /* init hooks */
  const { postEth }  = useBorrowProxy();
  const { estCollateralRatio, estBorrowingPower } = useMath();
  const [ txActive ] = useTxActive(['POST', 'WITHDRAW']);
  const { account } = useSignerAccount();
  const debouncedInput = useDebounce(inputValue, 500);
  const isLol = useIsLol(inputValue);


  /* Steps required to deposit and update values */
  const depositProcedure = async () => {
    if (inputValue && !depositDisabled ) {

      try {
        analyticsLogEvent(
          'Deposit_initiated', 
          {
            value: inputValue,
            series: null,
            maturity: null, 
            time_to_maturity: null,
            account: account?.substring(2),
          });
      } catch (e) {
        console.log('Analytics error');
      }

      setDepositPending(true);
      await postEth(inputValue);
      
      /* clean up and refresh */
      setInputValue(undefined);
      await userActions.updateUser();
      setDepositPending(false);
    }
  };

  /* Get the maximum borrowing power based on ETH balance and currently posted Eth */
  useEffect(()=>{
    if( ethBalance && debtValue ) {
      const postedPlusWallet = ethBalance.add(ethPosted);
      const _maxPower = estBorrowingPower(postedPlusWallet, debtValue);
      setMaxPower( cleanValue(ethers.utils.formatEther(_maxPower), 2) ); 
    }
  }, [ ethBalance, debtValue ]);

  /* Handle debounced input value changes */
  useEffect(()=>{
    /* 1. Adjust estimated ratio based on input changes */
    if (inputValue && ethPosted && debtValue) {
      const inputInWei = ethers.utils.parseEther(inputValue);
      const currentPlusNew = ethPosted.add( inputInWei );
      const newPercent = estCollateralRatio(currentPlusNew, debtValue, true); 
      setEstPercent(cleanValue(newPercent, 2) || undefined);
    }
    /* 2. Calculate the new borrowing power */
    if (inputValue && ethPosted && debtValue ) {
      const inputInWei = ethers.utils.parseEther(inputValue );
      const postedPlusInput = ethPosted.add(inputInWei);
      const _newPower = estBorrowingPower(postedPlusInput, debtValue);
      setEstPower( cleanValue(ethers.utils.formatEther(_newPower), 2)  );
    }
  }, [debouncedInput, inputValue ]);

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
      setErrorMsg('Collateral deposits must be larger than 0.05 ETH.');
      setWarningMsg(null);
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [debouncedInput, ethBalance]);

  /* analytics input values  before submission */ 
  const analyticsInput = useDebounce(inputValue, 3500);
  useEffect(() => {
    analyticsLogEvent(
      'deposit_input', 
      {
        value: analyticsInput,
        series: null,
        maturity: null, 
        time_to_maturity: null,
        account: account?.substring(2),
      });
  }, [analyticsInput] );

  return (
    <RaisedBox expand>
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

          <Box direction='row-responsive' justify='between'>
            <Text alignSelf='start' size='large' color='text' weight='bold'>Amount to deposit</Text>
            {/* {
            !mobile && !userLoading &&
            <RaisedButton
              disabled={!!inputValue || makerVaults.length===0}
              label={
                <Box pad='xsmall' gap='small' direction='row' align='center'>
                  <Box><MakerMark /></Box>
                  <Text size='xsmall'>Migrate a Maker vault</Text>
                </Box>
              }
              onClick={()=>setMigrateOpen(true)}
            />
            } */}
          </Box>

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
            <FlatButton
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
                    value: estPercent ? `${estPercent}%`: `${collateralPercent_}%` || '',
                    valuePrefix: null,
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
              disabled={depositDisabled || !hasDsProxy}
              hasPoolDelegatedProxy={true}
              clearInput={()=>setInputValue(undefined)}
              openConnectLayer={()=>openConnectLayer()}
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
