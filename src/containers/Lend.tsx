import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Moment from 'moment';
import { Box, Button, Keyboard, TextInput, Text, CheckBox, ResponsiveContext, ThemeContext } from 'grommet';

import { 
  FiCheckCircle,
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiAlertTriangle as Warning,
  FiArrowRight as ArrowRight,
} from 'react-icons/fi';

import { ScaleLoader } from 'react-spinners';
import WithdrawDai from './WithdrawDai';
import Redeem from './Redeem';

import SeriesDescriptor from '../components/SeriesDescriptor';
import InlineAlert from '../components/InlineAlert';
import InfoGrid from '../components/InfoGrid';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
  
import { usePool, useBalances, useMath, useToken, useSignerAccount, useTxActive } from '../hooks';
import InputWrap from '../components/InputWrap';
import DaiMark from '../components/logos/DaiMark';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';


interface ILendProps {
  lendAmount?:any
}
  
const Lend = ({ lendAmount }:ILendProps) => {
  
  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { deployedContracts } = yieldState;

  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading, activeSeries } = seriesState;

  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const {
    daiBalance_,
    ethBorrowingPower_: maximumDai
  } = userState.position;

  const theme:any = React.useContext(ThemeContext);
  const screenSize = React.useContext(ResponsiveContext);
  
  // const { borrow, borrowActive }  = useController();

  const { sellDai, previewPoolTx, sellActive }  = usePool();
  const { approveToken, approveActive } = useToken();
  const { getTokenAllowance } = useBalances();
  const { yieldAPR } = useMath();
  const { account } = useSignerAccount();
  
  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ lendDisabled, setLendDisabled ] = React.useState<boolean>(false);
  const [ lendPending, setLendPending ] = useState<boolean>(false);

  const [ approved, setApproved ] = React.useState<any>(0);
  const [ sellOpen, setSellOpen ] = useState<boolean>(false);

  const [ APR, setAPR ] = React.useState<number>();
  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);
  const [ currentValue, setCurrentValue ] = React.useState<number>(0);
  
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const [ txActive ] = useTxActive(['SELL']);
  
  const lendProcedure = async (value:number) => {
    
    if (!lendDisabled ) {
      setLendPending(true);
      await sellDai(
        activeSeries.poolAddress,
        inputValue,
        0 // transaction queue value
      );
      setInputValue('');
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setLendPending(false);
    }
    
  };

  const approveProcedure = async (value:number) => {
    await approveToken(deployedContracts.Dai, activeSeries.poolAddress, value);
    setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.poolAddress, 'Dai'));
  };

  useEffect(() => {
    activeSeries && !(activeSeries.isMature) && inputValue && ( async () => {
      const preview = await previewPoolTx('sellDai', activeSeries.poolAddress, inputValue);
      setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
      setAPR( yieldAPR( ethers.utils.parseEther(inputValue.toString()), preview, activeSeries.maturity ) );
    })();
  }, [inputValue]);
  
  useEffect(() => {
    if ( inputValue && ( inputValue > daiBalance_ ) ) {
      setLendDisabled(true);
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of DAI you have'); 
    } else {
      // setLendDisabled(false);
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  /* Lend button disabling logic */
  useEffect(()=>{
    if (
      !account ||
      approved < inputValue ||
      !inputValue || 
      parseInt(inputValue, 10)===0  
    ) {
      setLendDisabled(true);
    } else {
      setLendDisabled(false);
    }
  }, [ approved, inputValue ]);

  /* handle active series loads and changes */
  useEffect(() => {
    account && activeSeries && activeSeries.yDaiBalance_ && !(activeSeries.isMature) && ( async () => {
      const preview = await previewPoolTx('SellYDai', activeSeries.poolAddress, activeSeries.yDaiBalance_);
      console.log(preview);
      setCurrentValue( parseFloat(ethers.utils.formatEther(preview)));
    })();
    ( async ()=>{
      account && activeSeries && setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.poolAddress, 'Dai'));
      console.log(activeSeries);
    })();
  }, [ activeSeries, account ]);

  return (
    <Keyboard 
      onEsc={() => setInputValue(undefined)}
      onEnter={()=> lendProcedure(inputValue)}
      target='document'
    >
      <>
        { sellOpen && <WithdrawDai close={()=>setSellOpen(false)} /> }
        { txActive?.type !== 'SELL' &&
        <Box flex='grow' gap='small' align='center' fill='horizontal'>
          <InfoGrid entries={[
            {
              label: 'Portfolio Value at Maturity',
              visible: !!account,
              active: true,
              loading: lendPending,     
              value: activeSeries && `${activeSeries?.yDaiBalance_.toFixed(2)} DAI` || '-',
              valuePrefix: null,
              valueExtra: null, 
            },
            {
              label: 'Current Value',
              visible: !!account,
              active: true,
              loading: lendPending,           
              value: currentValue!==0?`${currentValue.toFixed(2)} DAI`: '-',
              valuePrefix: null,
              valueExtra: null,
            },

            {
              label: 'DAI balance',
              visible: !!account,
              active: true,
              loading: lendPending,            
              value: daiBalance_?`${daiBalance_.toFixed(2)} DAI`: '0 DAI',
              valuePrefix: null,
              valueExtra: null,
            },
          ]}
          />

          { !activeSeries?.isMature ?
            <Box fill gap='medium'>

              <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to lend</Text>
              <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={lendDisabled}>
                <TextInput
                  type="number"
                  placeholder={screenSize !== 'small' ? 'Enter the amount of DAI to lend': 'DAI'}
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
                  icon={<DaiMark />}
                />
                {account &&
                <Button 
                  label={<Text size='xsmall' color='brand'> {screenSize !== 'small' ? 'Lend Maximum': 'Max'}</Text>}
                  color='brand-transparent'
                  onClick={()=>setInputValue(daiBalance_)}
                  hoverIndicator='brand-transparent'
                />}
                {/* {!account && screenSize !== 'small' &&
                <Button 
                  label={<Text size='xsmall' color='brand'>Connect a Wallet</Text>}
                  color='brand-transparent'
                  onClick={()=>console.log('connect a wallet')}
                  hoverIndicator='brand-transparent'
                />} */}
              </InputWrap>

              <InfoGrid entries={[
                {
                  label: 'Estimated APR',
                  visible: true,
                  active: inputValue,
                  loading: false,     
                  value: APR?`${APR.toFixed(2)}%`: `${activeSeries? activeSeries.yieldAPR_: ''}%`,
                  valuePrefix: null,
                  valueExtra: null, 
                },
                {
                  label: 'Approx. DAI received at maturity',
                  visible: true,
                  active: inputValue,
                  loading: false,           
                  value: `${yDaiValue.toFixed(2)} DAI`,
                  valuePrefix: null,
                  valueExtra: null,
                  //   valueExtra: () => (
                  //   <Text size='xxsmall'>
                  //     {activeSeries && Moment(activeSeries.maturity_).format('DD MMMM YYYY')}
                  //   </Text>
                  // ),
                },
                {
                  label: 'Like what you see?',
                  visible: !account,
                  active: inputValue,
                  loading: false,            
                  value: '',
                  valuePrefix: null,
                  valueExtra: () => (
                    <Button
                      color='brand-transparent'
                      label={<Text size='xsmall' color='brand'>Connect a wallet</Text>}
                      onClick={()=>console.log('still to implement')}
                      hoverIndicator='brand-transparent'
                    /> 
                  )
                },
              ]}
              />
            </Box> 
            :
            <Box fill gap='medium' margin={{ vertical:'large' }}>
              <Redeem />
            </Box>}
  
          { account && !activeSeries?.isMature && 
          <Box gap='small' fill='horizontal' align='center'>

            <Box margin='medium'>
              {approveActive || approved === undefined ?             
                <ScaleLoader color={theme?.global?.colors['brand-transparent'].dark} height='13' />
                : <CheckBox
                  reverse
                  checked={approved && !inputValue || ( approved >= inputValue )}
                  disabled={!inputValue || ( approved >= inputValue )}
                  onChange={()=>approveProcedure(inputValue)}
                  label={            
                  (approved >= inputValue) ? 
                    `Lending unlocked for up to ${approved.toFixed(2) || '' } DAI` 
                    : `Unlock lending of ${inputValue || ''} DAI`
                }
                />}
            </Box>

            <Box
              fill='horizontal'
              round='small'
              background={( !(inputValue>0) || lendDisabled) ? 'brand-transparent' : 'brand'}
              onClick={(!(inputValue>0) || lendDisabled)? ()=>{}:()=>lendProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text 
                weight='bold'
                size='large'
                color={( !(inputValue>0) || lendDisabled) ? 'text-xweak' : 'text'}
              >
                {`Lend ${inputValue || ''} DAI`}
              </Text>
            </Box>

            <Box alignSelf='end'>
              <Box
                round
                onClick={()=>setSellOpen(true)}
                hoverIndicator='brand-transparent'
                // border='all'
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Box direction='row' gap='small'>
                  <Text size='xsmall' color='text-weak'> Alternatively, withdraw DAI from this series</Text>
                  <ArrowRight color='text-weak' />
                </Box>
              </Box>
            </Box>          
          </Box>}
        </Box>}

        { sellActive && !txActive && <ApprovalPending /> } 
        { txActive && <TransactionPending msg={`You lent ${inputValue} DAI.`} tx={txActive} /> }
      </>
    </Keyboard>
  );
};

Lend.defaultProps={ lendAmount:null };

export default Lend;