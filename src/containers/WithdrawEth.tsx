import React, { useState, useContext, useEffect } from 'react';
import { Box, Layer, Button, Keyboard, TextInput, Text, CheckBox } from 'grommet';
import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useProxy, useController, useMath, useTxActive } from '../hooks';

import OnceOffAuthorize from '../components/OnceOffAuthorize';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';
import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import EthMark from '../components/logos/EthMark';

interface IWithDrawProps {
  close?: any;
}

const WithdrawEth = ({ close }:IWithDrawProps) => {

  const { state: { deployedContracts }, actions: yieldActions } = useContext(YieldContext);

  const { state: { delegations, position }, actions: userActions } = useContext(UserContext);
  const {
    ethBalance_,
    ethPosted_,
    ethLocked_,
    collateralPercent_,
    debtValue_,
  } = position;

  const [ estRatio, setEstRatio ] = useState<any>();
  const [ estDecrease, setEstDecrease ] = useState<any>();

  const [ maxWithdraw, setMaxWithdraw ] = useState<number>(0);
  const [ inputValue, setInputValue ] = useState<any>();
  const [ hasDelegated, setHasDelegated ] = useState<boolean>( delegations.ethProxy || false);

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(false);
  const [ withdrawPending, setWithdrawPending ] = useState<boolean>(false);
  const [ delegationPending, setDelegationPending ] = useState<boolean>(false);

  const [ indicatorColor, setIndicatorColor ] = useState<string>('brand');

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { withdrawEth, withdrawEthActive }  = useProxy();
  const { addControllerDelegate, checkControllerDelegate } = useController();
  const { estCollRatio: estimateRatio } = useMath();
  const [ txActive ] = useTxActive(['WITHDRAW', 'DELEGATION']);

  const withdrawProcedure = async (value:number) => {
    if ( !withdrawDisabled ) {
      setWithdrawPending(true);
      await withdrawEth(deployedContracts.EthProxy, value);
      userActions.updatePosition();
      setWithdrawPending(false);
      close();
    }
  };

  const delegateProcedure = async () => {
    setDelegationPending(true);
    await addControllerDelegate(deployedContracts.Controller, deployedContracts.EthProxy);
    const res = await checkControllerDelegate(deployedContracts.Controller, deployedContracts.EthProxy);
    setHasDelegated(res);
    setDelegationPending(false);
  };

  /* Calculate maximum available to withdraw */
  useEffect(()=>{
    setMaxWithdraw(ethPosted_ - ethLocked_);
  }, [ethPosted_, ethLocked_]);

  /* Calculate collateralization Ratio based on input */ 
  useEffect(()=>{
    if ( (ethPosted_ > inputValue) && inputValue && debtValue_) {
      const newRatio = estimateRatio((ethPosted_- parseFloat(inputValue)), debtValue_); 
      if (newRatio) {
        setEstRatio(newRatio.toFixed(2));
        const newDecrease = collateralPercent_ - newRatio ;
        setEstDecrease(newDecrease.toFixed(2));
      }
    }
  }, [ inputValue ]);

  /* handle withdraw disabled */
  useEffect(()=>{
    ( 
      inputValue > maxWithdraw || 
      !hasDelegated || 
      estRatio < 150
    )? setWithdrawDisabled(true) : setWithdrawDisabled(false);
  }, [ inputValue, estRatio ]);

  /* show warnings and errors with collateralisation ratio levels and inputs */
  useEffect(()=>{
    if (estRatio < 150 || inputValue > maxWithdraw ) {
      setIndicatorColor('red');
      setWarningMsg(null);
      setErrorMsg('You are not allowed to withdraw below the collateralization ratio'); 
    } else if (estRatio >= 150 && estRatio < 250 ) {
      setIndicatorColor('orange');
      setErrorMsg(null);
      setWarningMsg('Your collateralisation ration will put you at risk of liquidation');
    } else {   
      setIndicatorColor('brand');
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ estRatio, inputValue ]);

  /* startup effects, if any */
  useEffect(()=>{
    (async () => {
    })();
  }, []);

  return (
    <Layer onClickOutside={()=>close()}>
      <Keyboard 
        onEsc={() => { inputValue? setInputValue(undefined): close();}}
        onEnter={()=> withdrawProcedure(inputValue)}
        target='document'
      >
        <>
          { !txActive && !withdrawPending && 
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
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to withdraw</Text>
        
            {!hasDelegated &&
            <OnceOffAuthorize 
              authProcedure={delegateProcedure}
              authMsg='Authorise ETH withdrawals'
              awaitingApproval={delegationPending && !txActive}
              txPending={txActive?.type === 'DELEGATION'}
            />}

            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={withdrawDisabled}>
              <TextInput
                type="number"
                placeholder='ETH'
                disabled={!hasDelegated}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<EthMark />}
              />
              <Button 
                label='Max'
                disabled={!hasDelegated}
                color='brand-transparent'
                onClick={()=>setInputValue(maxWithdraw)}
                hoverIndicator='brand-transparent'
              />
            </InputWrap>
        
            <InfoGrid entries={[
              {
                label: 'Max withdraw',
                visible: true,
                active: hasDelegated,
                loading: false, 
                value: ethPosted_ ? `${maxWithdraw.toFixed(2)} Eth` : '-',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Ratio after Withdraw',
                visible: collateralPercent_ > 0,
                active: inputValue,
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

            <Box
              fill='horizontal'
              round='small'
              background={( !(inputValue>0) || withdrawDisabled || !hasDelegated ) ? 'brand-transparent' : 'brand'}
              onClick={()=> withdrawProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text
                weight='bold'
                size='large'
                color={( !(inputValue>0) || withdrawDisabled || !hasDelegated ) ? 'text-xweak' : 'text'}
              >
                {`Withdraw ${inputValue || ''} Eth`}
              </Text>
            </Box>
          
            <Box alignSelf='start'>
              <Box
                round
                onClick={()=>close()}
                hoverIndicator='brand-transparent'
                // border='all'
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

          { withdrawPending && !txActive && <ApprovalPending /> }
          
          { txActive && 
            txActive.type !== 'DELEGATION' && 
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
              <TransactionPending msg={`You made a withdrawal of ${inputValue} Eth.`} tx={txActive} />
              <Box alignSelf='start'>
                <Box
                  round
                  onClick={()=>close()}
                  hoverIndicator='brand-transparent'
                // border='all'
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
        </>
      </Keyboard>
    </Layer>
  );
};

WithdrawEth.defaultProps={ close:null };

export default WithdrawEth;
