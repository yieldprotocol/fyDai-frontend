import React, { useState, useContext, useEffect } from 'react';
import { Box, Layer, Button, Keyboard, TextInput, Text, CheckBox } from 'grommet';
import { 
  FiInfo as Info,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useProxy, useController, useMath } from '../hooks';

import { NotifyContext } from '../contexts/NotifyContext';
import InlineAlert from '../components/InlineAlert';
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
  const [ indicatorColor, setIndicatorColor ] = useState<string>('brand');
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { withdrawEth, withdrawEthActive }  = useProxy();
  const { addControllerDelegate, checkControllerDelegate } = useController();
  const { estCollRatio: estimateRatio } = useMath();

  const withdrawProcedure = async (value:number) => {
    await withdrawEth(deployedContracts.EthProxy, value);
    userActions.updatePosition();
    close();
  };

  const delegateProcedure = async () => {
    await addControllerDelegate(deployedContracts.Controller, deployedContracts.EthProxy);
    const res = await checkControllerDelegate(deployedContracts.Controller, deployedContracts.EthProxy);
    setHasDelegated(res);
  };

  // TODO: maybe split into a custom hook
  const { state: { pendingTxs } } = React.useContext(NotifyContext);

  const [txActive, setTxActive] = React.useState<any>(null);
  useEffect(()=>{
    setTxActive(pendingTxs.find((x:any)=> ( x.type === 'WITHDRAW' || x.type === 'APPROVAL')));
  }, [ pendingTxs ]);

  useEffect(()=>{
    setMaxWithdraw(ethPosted_ - ethLocked_);
  }, [ethPosted_, ethLocked_]);

  /* show warnings and errors with collateralisation ratio levels */
  useEffect(()=>{

    if (estRatio < 150) {
      setWithdrawDisabled(true);
      setIndicatorColor('red');
      setWarningMsg(null);
      setErrorMsg('You are not allowed to withdraw below the collateralization ratio'); 
    } else if (estRatio >= 150 && estRatio < 250 ) {
      setIndicatorColor('orange');
      setErrorMsg(null);
      setWarningMsg('Your collateralisation ration will put you at risk of liquidation');
    } else {
      setWithdrawDisabled(false);
      setIndicatorColor('brand');
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ estRatio ]);

  useEffect(()=>{

    if ( (inputValue > maxWithdraw) ){
      setWithdrawDisabled(true);
    } else { 
      setWithdrawDisabled(false);
    }
    if ( (ethPosted_ > inputValue) && inputValue && debtValue_) {
      const newRatio = estimateRatio((ethPosted_- parseFloat(inputValue)), debtValue_); 
      if (newRatio) {
        setEstRatio(newRatio.toFixed(2));
        const newDecrease = collateralPercent_ - newRatio ;
        setEstDecrease(newDecrease.toFixed(2));
      }
    }
  }, [ inputValue ]);

  /* startup effects, if any */
  useEffect(()=>{
    (async () => {
    })();
  }, []);

  return (
    <Layer onClickOutside={()=>close()}>

      <Keyboard 
        onEsc={() => { inputValue? setInputValue(undefined): close();}}
        target='document'
      >
        <>
          { !txActive && !withdrawEthActive && 
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
              txPending={txActive?.type === 'DELEGATION'}
            />}

            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={withdrawDisabled}>
              <TextInput
                type="number"
                placeholder='ETH'
                disabled={withdrawEthActive}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<EthMark />}
              />
              <Button 
                label='Max'
                color='brand-transparent'
                onClick={()=>setInputValue(maxWithdraw)}
                hoverIndicator='brand-transparent'
              />
            </InputWrap>
        
            <InfoGrid entries={[
              {
                label: 'Max withdraw',
                visible: true,
                active: true,
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
              background={( !(inputValue>0) || withdrawDisabled && hasDelegated ) ? 'brand-transparent' : 'brand'}
              onClick={( !(inputValue>0) || withdrawDisabled && hasDelegated )? ()=>{}:()=> withdrawProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text
                weight='bold'
                size='large'
                color={( !(inputValue>0) || withdrawDisabled && hasDelegated ) ? 'text-xweak' : 'text'}
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
                  <Text size='xsmall' color='text-weak'> { !withdrawEthActive? 'cancel, and go back.': 'go back'}  </Text>
                </Box>
              </Box>
            </Box>
        


          </Box>}
          { withdrawEthActive && !txActive && <ApprovalPending /> }
          { txActive && <TransactionPending msg={`You made a withdrawal of ${inputValue} Eth.`} tx={txActive} /> }
        </>
      </Keyboard>
    </Layer>
  );
};

WithdrawEth.defaultProps={ close:null };

export default WithdrawEth;
