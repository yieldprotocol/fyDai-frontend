import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Layer, TextInput, Text, Keyboard, ResponsiveContext } from 'grommet';

import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import DaiMark from '../components/logos/DaiMark';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { usePool, useProxy, useSignerAccount, useTxActive, useDebounce } from '../hooks';

import InputWrap from '../components/InputWrap';
import Loading from '../components/Loading';
import TransactionPending from '../components/TransactionPending';
import ApprovalPending from '../components/ApprovalPending';

interface IWithDrawDaiProps {
  close?: any;
}

const WithdrawDai = ({ close }:IWithDrawDaiProps) => {

  const screenSize = useContext(ResponsiveContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries  } = seriesState;

  const [ txActive ] = useTxActive(['BUY_DAI']);

  const { actions: userActions } = useContext(UserContext);

  const [ hasDelegated, setHasDelegated ] = useState<boolean>(true);

  const { previewPoolTx }  = usePool();
  const { buyDai, buyDaiWithSignature, buyActive }  = useProxy();
  const { account } = useSignerAccount();

  const [ maxWithdraw, setMaxWithdraw ] = useState<number>(0);
  const [ isGettingMax, setIsGettingMax ] = useState<boolean>(false);

  const [ inputValue, setInputValue ] = useState<any>();
  const debouncedInput = useDebounce(inputValue, 500);
  const [inputRef, setInputRef] = React.useState<any>(null);
  
  const [ eDaiValue, setEDaiValue ] = React.useState<number>(0);

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(true);
  const [ withdrawDaiPending, setWithdrawDaiPending] = useState<boolean>(false);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const withdrawProcedure = async (value:number) => {
    if ( !withdrawDisabled ) {
      setWithdrawDaiPending(true);
      await buyDaiWithSignature(
        activeSeries,
        inputValue,
      );
      userActions.updatePosition();
      seriesActions.updateActiveSeries();
      setWithdrawDaiPending(false);
      close();
    }
  };

  const getMaxWithdraw = async () => {
    setIsGettingMax(true);
    const preview = await previewPoolTx('sellEDai', activeSeries, activeSeries.eDaiBalance_);
    setIsGettingMax(false);
    if (!(preview instanceof Error)) {
      return parseFloat(ethers.utils.formatEther(preview)); 
    }
  };
  
  // useEffect(() => {
  //   activeSeries &&
  //   (async () => setMaxWithdraw( await getMaxWithdraw() ))();
  // }, [ activeSeries, inputValue ]);

  /* Withdraw DAi button disabling logic */
  useEffect(()=>{
    (
      !account ||
      !hasDelegated ||
      !inputValue || 
      parseFloat(inputValue) === 0
    ) ? setWithdrawDisabled(true): setWithdrawDisabled(false);
  }, [ inputValue, hasDelegated, maxWithdraw, isGettingMax]);

  useEffect(() => {
    activeSeries && debouncedInput && ( async () => {
      const preview = await previewPoolTx('buyDai', activeSeries, debouncedInput);
      !(preview instanceof Error) && setEDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
    })();
  }, [debouncedInput]);

  return (
    <Layer onClickOutside={()=>close()}>
      <Keyboard 
        onEsc={() => { inputValue? setInputValue(undefined): close();}}
        onEnter={()=> withdrawProcedure(inputValue)}
        onBackspace={()=> inputValue && (document.activeElement !== inputRef) && setInputValue(debouncedInput.toString().slice(0, -1))}
        target='document'
      >
        { !txActive && !withdrawDaiPending && 
        <Box 
          width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
          alignSelf='center'
          fill
          background='background-front'
          round='small'
          pad='large'
          gap='medium'
        >
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to close</Text>
          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={withdrawDisabled}>
            <TextInput
              ref={(el:any) => {el && el.focus(); setInputRef(el);}} 
              type="number"
              placeholder='DAI'
              value={inputValue || ''}
              plain
              onChange={(event:any) => setInputValue(event.target.value)}
              icon={<DaiMark />}
            />
            <Button 
              label='Max'
              color='brand-transparent'
              onClick={async ()=>{
                const max = await getMaxWithdraw();
                max && setInputValue( max );
              }}
              hoverIndicator='brand-transparent'
            />
          </InputWrap>

          <Box
            fill='horizontal'
            round='small'
            background={withdrawDisabled ? 'brand-transparent' : 'brand'}
            onClick={()=> withdrawProcedure(inputValue)}
            align='center'
            pad='small'
          >
            <Text
              weight='bold'
              size='large'
              color={withdrawDisabled ? 'text-xweak' : 'text'}
            >
              {`Reclaim ${inputValue || ''} Dai`}
            </Text>
          </Box>

          <Box alignSelf='start'>
            <Box
              round
              onClick={()=>close()}
              hoverIndicator='brand-transparent'
              pad={{ horizontal:'small', vertical:'small' }}
              justify='center'
            >
              <Box direction='row' gap='small' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='xsmall' color='text-weak'> go back </Text>
              </Box>
            </Box>
          </Box>
        </Box>}

        { withdrawDaiPending && !txActive && <ApprovalPending /> }

        { txActive && 
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
            <TransactionPending msg={`You are withdrawing ${inputValue} ETH`} tx={txActive} />
                
            <Box alignSelf='start'>
              <Box
                round
                onClick={()=>close()}
                hoverIndicator='brand-transparent'
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Box direction='row' gap='small' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Text size='xsmall' color='text-weak'> { !withdrawDaiPending? 'cancel, and go back.': 'go back'}  </Text>
                </Box>
              </Box>
            </Box>
          </Box>}
      </Keyboard>
    </Layer>
  );
};

WithdrawDai.defaultProps={ close:null };

export default WithdrawDai;
