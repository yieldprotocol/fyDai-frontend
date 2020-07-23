import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, Image, TextInput, Text, Paragraph, Layer } from 'grommet';
import { 
  FiInfo as Info,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';

import { FaEthereum as Ethereum } from 'react-icons/fa';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { NotifyContext } from '../contexts/NotifyContext';

import EthWithdrawAction from './EthWithdrawAction';
import { useEthProxy } from '../hooks';

interface DepositProps {
  deposit?:any
  convert?:any
  maxValue?:number
  disabled?:boolean
}

const DepositAction = ({ disabled, deposit, convert, maxValue }:DepositProps) => {

  const [ estRatio, setEstRatio ] = useState<any>(0);
  const [ estIncrease, setEstIncrease ] = useState<any>(0); 
  const [ inputValue, setInputValue ] = useState<any>();
  const [ depositDisabled, setDepositDisabled ] = useState<boolean>(false);
  const [ withdrawOpen, setWithdrawOpen ] = useState<boolean>(false);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const { deployedContracts } = yieldState;
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const inputRef = React.useRef(null);
  
  const { seriesAggregates } = seriesState;
  const {
    ethBalance_,
    collateralAmount_,
    collateralRatio_,
    collateralPercent_,
    debtValue_,
    estimateRatio, // TODO << this is a function (basically just passed from hooks via context) >> 
  } = seriesAggregates || {};

  const { postEth, postEthActive }  = useEthProxy();
  const depositProcedure = async (value:number) => {
    await postEth(deployedContracts.EthProxy, value);
    yieldActions.updateUserData();
    setInputValue('');
  };

  // Handle active transactions
  // TODO: maybe split into a custom hook
  const { state: { pendingTxs } } = React.useContext(NotifyContext);
  const [txActive, setTxActive] = React.useState<any>(null);
  
  React.useEffect(()=>{
    setTxActive(pendingTxs.find((x:any)=> x.type === 'DEPOSIT'));
  }, [ pendingTxs ]);

  // Handle input values (warnings errors etc.)
  useEffect(()=>{
    if (inputValue && collateralAmount_ && debtValue_) {
      const newRatio = estimateRatio((collateralAmount_+ parseFloat(inputValue)), debtValue_); 
      setEstRatio(newRatio.toFixed(0));
      const newIncrease = newRatio - collateralPercent_ ;
      setEstIncrease(newIncrease.toFixed(0));
    }
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
      { withdrawOpen && <EthWithdrawAction close={()=>setWithdrawOpen(false)} /> }
      { !txActive && !postEthActive &&
      <Box align='center' flex='grow' justify='between' gap='large'>
        <Box gap='medium' align='center' fill='horizontal'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to deposit</Text>
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
                ref={inputRef}
                type='number'
                placeholder='Enter the amount to deposit in Eth'
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
            <Text color='brand' weight='bold' size='medium'> {collateralAmount_? `${collateralAmount_.toFixed(4)} Eth` : '-' }</Text>
            { false && 
            <Box pad='xsmall'>
              <Text alignSelf='start' size='xxsmall'>
                <Info /> You need to deposit collateral in order to Borrow Dai.
              </Text>
            </Box>}
          </Box>
          <Box gap='small'>
            <Text color='text-weak' size='xsmall'>Collateralisation Ratio</Text>
            <Text color='brand' weight='bold' size='medium'> 
              { (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '-' }
            </Text>
          </Box>

          <Box gap='small' alignSelf='start' align='center'>
            <Text color='text-weak' size='xsmall'>Collateralization Ratio after withdraw</Text>
            <Box direction='row' gap='small'>
              <Text color={!inputValue? 'brand-transparent': 'brand'} size='xxsmall'>approx.</Text> 
              <Text color={!inputValue? 'brand-transparent': 'brand'} weight='bold' size='medium'> 
                {(estRatio && estRatio !== 0)? `${estRatio}%`: collateralPercent_ || '' }
              </Text>
              { true &&
                <Text color='green' size='medium'> 
                  { inputValue && (estIncrease !== 0) && `(+ ${estIncrease}%)` }
                </Text>}
            </Box>
          </Box>
            
        </Box>

        { warningMsg &&
        <Box 
          border={{ color:'orange' }} 
          fill
          round='small'
          pad='small'
        >
          <Text weight='bold' color='orange'>Procced with Caution:</Text>  
          <Text color='orange'>{warningMsg}</Text>
        </Box> }

        { errorMsg &&
        <Box
          border={{ color:'red' }}
          fill
          round='small'
          pad='small'
        >
          <Text weight='bold' color='red'>Wooah, Hang on</Text>  
          <Text color='red'>{errorMsg}</Text>
        </Box> }

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
          // border='all'
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

      { postEthActive && !txActive &&
        <Box>Awaiting transaction approval</Box>}

      { txActive &&
      <Box align='center' flex='grow' justify='between' gap='large'>
        <Box gap='medium' align='center' fill='horizontal'>
          <Text size='xlarge' color='brand' weight='bold'>Good One!</Text>
          <Box
            // direction='row-responsive'
            fill='horizontal'
            gap='large'
            align='center'
          >
            <Text>You deposited {inputValue} Eth.</Text>
            <Text>Transaction Pending: </Text>
            <Box
              fill='horizontal'
              round='medium'
              background='brand'
              onClick={()=>console.log('Going to etherscan')}
              align='center'
              pad='medium'
            >
              <Text
                weight='bold'
                size='large'
              >
                View on Etherscan
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>}
    </>
  );
};

export default DepositAction;
