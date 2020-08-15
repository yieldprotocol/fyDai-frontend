import React, { useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Image, Select, TextInput, Text, Heading, Collapsible, CheckBox,  ThemeContext, } from 'grommet';
import { 
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiSettings as SettingsGear,
} from 'react-icons/fi';

import { ScaleLoader } from 'react-spinners';

import SeriesDescriptor from '../components/SeriesDescriptor';
import InlineAlert from '../components/InlineAlert';
import OnceOffAuthorize from '../components/OnceOffAuthorize';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';

import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { NotifyContext } from '../contexts/NotifyContext';
import { UserContext } from '../contexts/UserContext';

import { useController, usePool, useBalances, useProxy, useTxActive, useToken } from '../hooks';
import InfoGrid from '../components/InfoGrid';

interface IRepayProps {
  repayAmount?:any
}

function Repay({ repayAmount }:IRepayProps) {

  const { state: { deployedContracts }, actions: yieldActions } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState;

  const { state: userState, actions: userActions } = useContext(UserContext);
  const { daiBalance_ } = userState.position;

  const theme:any = useContext(ThemeContext);

  const { 
    previewPoolTx,
    addPoolDelegate,
    checkPoolDelegate
  }  = usePool(); 
  const { getTokenAllowance }  = useBalances();
  const { approveToken, approveActive } = useToken();
  const { repay, repayActive }  = useController();
  const { repayUsingExactDai } = useProxy();

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [ yDaiValue, setYDaiValue ] = React.useState<any>();

  const [ repayPending, setRepayPending ] = React.useState<boolean>(false);
  const [ repayDisabled, setRepayDisabled ] = React.useState<boolean>(true);

  const [ hasDelegated, setHasDelegated ] = React.useState<any>(0);
  const [ approved, setApproved ] = React.useState<any>();

  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const [ txActive ] = useTxActive(['repay']);

  const repayProcedure = async (value:number) => {
    setRepayPending(true);

    /* repay using proxy */
    // await repayUsingExactDai(activeSeries.daiProxyAddress, 'ETH-A', activeSeries.maturity, yDaiValue, value);

    /* direct repay without proxy */
    await repay(deployedContracts.Controller, 'ETH-A', activeSeries.maturity, value, 'Dai' );
    setApproved(await getTokenAllowance(deployedContracts.Dai, deployedContracts.Treasury, 'Dai'));
    setInputValue('');
    await userActions.updatePosition();
    await seriesActions.updateActiveSeries(); // or, await seriesActions.updateSeries([activeSeries]);
    setRepayPending(false);
  };

  const delegateProcedure = async () => {
    // TODO uncomment the following lines if not using auto sell?
    await addPoolDelegate(activeSeries.poolAddress, activeSeries.yDaiAddress);
    const res = await checkPoolDelegate(activeSeries.poolAddress, activeSeries.yDaiAddress);
    // await addPoolDelegate(activeSeries.poolAddress, activeSeries.daiProxyAddress);
    // const res = await checkPoolDelegate(activeSeries.poolAddress, activeSeries.daiProxyAddress);
    setHasDelegated(res);
  };

  const approveProcedure = async (value:number) => {
    await approveToken(deployedContracts.Dai, deployedContracts.Treasury, value);
    setApproved(await getTokenAllowance(deployedContracts.Dai, deployedContracts.Treasury, 'Dai'));
    // await approveToken(deployedContracts.Dai, activeSeries.daiProxyAddress, value);
    // setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.daiProxyAddress, 'Dai'));
  };

  /* Input warning and error logic */ 
  useEffect(() => {
    if ( inputValue  && daiBalance_ && ( inputValue > daiBalance_ ) ) {
      setWarningMsg(null);
      setErrorMsg('That amount exceeds the amount of Dai in your wallet'); 
    } else {
      setWarningMsg(null);
      setErrorMsg(null);
    }
  }, [ inputValue ]);

  /* Handle dai to yDai conversion  (needed to set a min yDai value for repayment) */
  useEffect(() => {
    activeSeries && inputValue > 0 && ( async () => {
      const preview = await previewPoolTx('sellDai', activeSeries.poolAddress, inputValue);
      
      if (!preview.isZero()) {
        setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
      } else {
        /* if the market doesnt have liquidity just estimate from rate */
        const rate = await previewPoolTx('sellDai', activeSeries.poolAddress, 1);
        setYDaiValue(inputValue* parseFloat((ethers.utils.formatEther(rate))) );
        setRepayDisabled(true);
        setErrorMsg('The Pool doesn\'t have the liquidity to support a transaction of that size just yet.');
      }
    })();
  }, [inputValue]);

  /* Repay button disabling logic */
  useEffect(()=>{
    if (approved < inputValue) {
      setRepayDisabled(true);
    } else if (!(inputValue) || inputValue===0 || !daiBalance_) {
      setRepayDisabled(true);
    } else {
      setRepayDisabled(false);
    }
  }, [ approved, inputValue ]);

  useEffect(() => {
    ( async ()=>{
      // activeSeries && setApproved(await getTokenAllowance(deployedContracts.Dai, activeSeries.daiProxyAddress, 'Dai'));
      activeSeries && setApproved(await getTokenAllowance(deployedContracts.Dai, deployedContracts.Treasury, 'Dai'));
      activeSeries && setHasDelegated(activeSeries.hasDelegatedPool);
    })();
  }, [ activeSeries ]);

  return (
    <>
      { !txActive &&
      <Box flex='grow' justify='between'>
        <Box gap='medium' align='center' fill='horizontal'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text>

          <SeriesDescriptor activeView='borrow' />

          {/* {!hasDelegated && 
            <OnceOffAuthorize
              authProcedure={delegateProcedure} 
              authMsg='Allow Pool to trade on your behalf' 
              txPending={txActive?.type === 'DELEGATION'}  
          />} */}

          <InfoGrid entries={[
            {
              label: 'Current Debt',
              visible: true,
              active: true,
              loading: false,     
              value: activeSeries?.ethDebtYDai_? `${activeSeries.ethDebtYDai_.toFixed(2)} Dai`: 'O Dai',
              valuePrefix: null,
              valueExtra: null, 
            },
            {
              label: 'Dai balance',
              visible: true,
              active: true,
              loading: false,            
              value: daiBalance_?`${daiBalance_.toFixed(2)} Dai`: '-',
              valuePrefix: null,
              valueExtra: null,
            },
          ]}
          />

          <Box fill gap='medium' margin={{ vertical:'large' }}>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to Repay</Text>
            <Box
              direction='row-responsive'
              fill='horizontal'
              gap='small'
              align='center'
            >
              <Box 
                round='small'
                // background='brand-transparent'
                border='all'
                direction='row'
                fill='horizontal'
                pad='small'
                flex
              >
                <TextInput
                  type="number"
                  placeholder='Enter the amount of Dai to Repay'
                  value={inputValue || ''}
                  // disabled={repayDisabled}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
                />
              </Box>

              <Box justify='center'>
                <Box
                  round
                  onClick={()=>setInputValue(daiBalance_)}
                  hoverIndicator='brand-transparent'
                  border='all'
              // border={{ color:'brand' }}
                  pad={{ horizontal:'small', vertical:'small' }}
                  justify='center'
                >
                  <Text size='xsmall'>Repay max</Text>
                </Box>
              </Box>
            </Box>
          </Box>

          <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />
      
          <Box>
            {approveActive || approved === undefined ?             
              <ScaleLoader color={theme?.global?.colors['brand-transparent'].dark} height='13' />
              : <CheckBox
                reverse
                checked={approved && !inputValue || ( approved >= inputValue )}
                disabled={!inputValue || ( approved >= inputValue )}
                onChange={()=>approveProcedure(inputValue)}
                label={            
                  (approved >= inputValue) ? 
                    `Repayments are unlocked for up to ${approved.toFixed(2) || '' } Dai` 
                    : `Unlock repayments of ${inputValue || ''} Dai` 
                }
              />}
          </Box>

          <Box
            fill='horizontal'
            round='small'
            background={repayDisabled ? 'brand-transparent' : 'brand'}
            onClick={repayDisabled ? ()=>{}:()=>repayProcedure(inputValue)}
            // onClick={()=>repayProcedure(inputValue)}
            align='center'
            pad='small'
          >
            <Text 
              weight='bold'
              size='large'
              color={repayDisabled ? 'text-xweak' : 'text'}
            >
              {`Repay ${inputValue || ''} Dai`}
            </Text>
          </Box>
        </Box>
      </Box>}

      { repayActive && !txActive && <ApprovalPending /> } 
      { txActive && <TransactionPending msg={`You made a repayment of ${inputValue} Dai.`} tx={txActive} /> }

    </>
  );
}

Repay.defaultProps = { repayAmount:null };

export default Repay;
