import React, { useState, useContext, useEffect } from 'react';
import { Box, Layer, Button, Image, TextInput, Text, CheckBox } from 'grommet';
import { 
  FiInfo as Info,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';

import { useProxy, useController, useToken } from '../hooks';

import { NotifyContext } from '../contexts/NotifyContext';
import InlineAlert from '../components/InlineAlert';
import OnceOffAuthorize from '../components/OnceOffAuthorize';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';

interface IWithDrawActionProps {
  close?: any;

}

const WithdrawEth = ({ close }:IWithDrawActionProps) => {

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const { deployedContracts, userData } = yieldState;

  const [ estRatio, setEstRatio ] = useState<any>();
  const [ estDecrease, setEstDecrease ] = useState<any>();

  const [ maxWithdraw, setMaxWithdraw ] = useState<number>(0);
  const [ inputValue, setInputValue ] = useState<any>();
  const [ hasDelegated, setHasDelegated ] = useState<boolean>( userData.isEthProxyApproved || false);

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(false);
  const [ indicatorColor, setIndicatorColor ] = useState<string>('brand');
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { userData: { ethBalance_ } } = yieldState;
  const { seriesAggregates } = seriesState;
  const {
    collateralAmount_,
    minSafeCollateral_,
    // collateralRatio_,
    collateralPercent_,
    debtValue_,
    estimateRatio, // TODO << this is a function (basically just passed from hooks via context) >> 
  } = seriesAggregates;

  const { withdrawEth, withdrawEthActive }  = useProxy();
  const { addControllerDelegate, checkControllerDelegate }  = useController();
  const { approveToken, approveActive } = useToken();

  const withdrawProcedure = async (value:number) => {
    await withdrawEth(deployedContracts.EthProxy, value);
    yieldActions.updateUserData();
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
    setMaxWithdraw(collateralAmount_- minSafeCollateral_);
  }, [collateralAmount_, minSafeCollateral_]);

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

    if ( (collateralAmount_ > inputValue) && inputValue && debtValue_) {
      const newRatio = estimateRatio((collateralAmount_- parseFloat(inputValue)), debtValue_); 
      setEstRatio(newRatio.toFixed(2));
      const newDecrease = collateralPercent_ - newRatio ;
      setEstDecrease(newDecrease.toFixed(2));
    }
  }, [ inputValue ]);

  /* startup effects, if any */
  useEffect(()=>{
    (async () => {
    })();
  }, []);

  return (
    <Layer onClickOutside={()=>close()}>
      <Box 
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='medium'
        pad='large'
      >
        { !txActive && !withdrawEthActive && 
        <Box align='center' flex='grow' justify='between' gap='large'>
          <Box gap='medium' align='center' fill='horizontal'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to withdraw</Text>

            {!hasDelegated && 
            <OnceOffAuthorize 
              authProcedure={delegateProcedure}
              authMsg='Authorise ETH withdrawals'
              txPending={txActive?.type === 'DELEGATION'}
            />}
          
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
                  type="number"
                  placeholder='ETH'
                  disabled={withdrawEthActive}
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
                  icon={<Ethereum />}
                />
              </Box>

              <Box justify='center'>
                <Box
                  round
                  onClick={()=>setInputValue(maxWithdraw)}
                  hoverIndicator='brand-transparent'
                  border='all'
                  pad={{ horizontal:'small', vertical:'small' }}
                  justify='center'
                >
                  <Text size='xsmall'>Use max</Text>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box fill direction='row-responsive' justify='between'>
            <Box gap='small' alignSelf='start' align='center'>
              <Text color='text-weak' size='xsmall'>
                Max withdraw
              </Text>
              <Box direction='row' gap='small'>
                {/* <Text color='brand' size='xxsmall'>approx.</Text>  */}
                <Text 
                  color='brand'
                  weight='bold'
                  size='medium'
                  onClick={()=>setInputValue(maxWithdraw)}
                > {collateralAmount_? `${maxWithdraw.toFixed(2)} Eth` : '-' }
                </Text>
              </Box>
            </Box>

            { (collateralPercent_ > 0) &&
            <Box gap='small' alignSelf='start' align='center'>
              <Text color='text-weak' size='xsmall'>Collateralization Ratio after withdraw</Text>
              <Box direction='row' gap='small'>
                <Text color={!inputValue? 'brand-transparent': indicatorColor} size='xxsmall'>approx.</Text> 
                <Text color={!inputValue? 'brand-transparent': indicatorColor} weight='bold' size='medium'> 
                  {(estRatio && estRatio !== 0)? `${estRatio}%`: collateralPercent_ || '' }
                </Text>
              </Box>
            </Box>}

          </Box>

          <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />

          <Box
            fill='horizontal'
            round='medium'
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

      </Box>
    </Layer>
  );
};

export default WithdrawEth;
