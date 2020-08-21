import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Layer, CheckBox, TextInput, Text, Keyboard, ThemeContext } from 'grommet';
import { 
  FiInfo as Info,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { usePool, useYDai, useToken } from '../hooks';
import { UserContext } from '../contexts/UserContext';

import InputWrap from '../components/InputWrap';
import DaiMark from '../components/logos/DaiMark';
import { ScaleLoader } from 'react-spinners';


interface IWithDrawDaiProps {
  close?: any;
}

const WithdrawDai = ({ close }:IWithDrawDaiProps) => {

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries  } = seriesState;

  const { state: userState, actions: userActions } = useContext(UserContext);

  const [ maxWithdraw, setMaxWithdraw ] = useState<number>(0);
  const [ inputValue, setInputValue ] = useState<any>();

  const [ approved, setApproved ] = React.useState<any>(0);
  const [ daiApproved, setDaiApproved ] = React.useState<any>(0);

  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(true);
  const [ withdrawPending, setWithdrawPending] = useState<boolean>(false);

  const [ indicatorColor, setIndicatorColor ] = useState<string>('brand');
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { buyDai, previewPoolTx }  = usePool();
  const { userAllowance } = useYDai();
  const { approveToken, approveActive } = useToken();

  const theme:any = React.useContext(ThemeContext);

  const withdrawProcedure = async (value:number) => {
    if ( inputValue>0 && !withdrawDisabled ) {
      setWithdrawPending(true);
      await buyDai(
        activeSeries.poolAddress,
        inputValue,
        0 // transaction queue value
      );
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setWithdrawPending(true);
      close();
    }
  };

  const approveProcedure = async (value:number) => {
    await approveToken(activeSeries.yDaiAddress, activeSeries.poolAddress, value);
    const approvedYDai = await userAllowance(activeSeries.yDaiAddress, activeSeries.poolAddress);
    setApproved( approvedYDai ); // TODO convert to Dai somehow
  };

  const checkMaxWithdraw = async () =>{
    const preview = await previewPoolTx('sellYDai', activeSeries.poolAddress, activeSeries.yDaiBalance_);
    console.log(parseFloat(ethers.utils.formatEther(preview)));
    setMaxWithdraw( parseFloat(ethers.utils.formatEther(preview)) );
    return parseFloat(ethers.utils.formatEther(preview));
  };

  useEffect(() => {
    activeSeries && checkMaxWithdraw();
  }, [activeSeries, inputValue]);

  useEffect(() => {
    approved && ( async () => {
      const preview = await previewPoolTx('SellYDai', activeSeries.poolAddress, approved);
      setDaiApproved( parseFloat(ethers.utils.formatEther(preview)) );
    })();
  }, [ approved ]);

  /* Borrow button disabling logic */
  useEffect(()=>{
    if (approved < yDaiValue) {
      setWithdrawDisabled(true);
    } else if (!(inputValue) || inputValue===0) {
      setWithdrawDisabled(true);
    } else {
      setWithdrawDisabled(false);
    }
  }, [ approved, inputValue, yDaiValue ]);

  useEffect(() => {
    activeSeries && inputValue && ( async () => {
      const preview = await previewPoolTx('buyDai', activeSeries.poolAddress, inputValue);
      setYDaiValue( parseFloat(ethers.utils.formatEther(preview)) );
    })();
  }, [inputValue]);

  return (
    <Layer onClickOutside={()=>close()}>
      <Keyboard 
        onEsc={() => { inputValue? setInputValue(undefined): close();}}
        onEnter={()=> withdrawProcedure(inputValue)}
        target='document'
      >
        <>
          <Box 
            width={{ max:'750px' }}
            alignSelf='center'
            fill
            background='background-front'
            round='small'
            pad='large'
            gap='medium'
          >
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Withdraw Dai</Text>
            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={withdrawDisabled}>
              <TextInput
                type="number"
                placeholder='DAI'
                // disabled={withdrawDisabled}
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<DaiMark />}
              />
              <Button 
                label='Max'
                color='brand-transparent'
                onClick={()=>setInputValue( maxWithdraw || checkMaxWithdraw() )}
                hoverIndicator='brand-transparent'
              />
            </InputWrap>

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
                    `~${daiApproved.toFixed(2)} Dai unlocked (${approved.toFixed(2) || '' } yDai)` 
                    : `Unlock ${inputValue || ''} Dai`
                }
                />}
            </Box>

            <Box
              fill='horizontal'
              round='small'
              background={( !(inputValue>0) || withdrawDisabled) ? 'brand-transparent' : 'brand'}
              onClick={()=> withdrawProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text
                weight='bold'
                size='large'
                color={( !(inputValue>0) || withdrawDisabled) ? 'text-xweak' : 'text'}
              >
                {`Withdraw ${inputValue || ''} Dai`}
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
                  <Text size='xsmall' color='text-weak'> go back </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      </Keyboard>
    </Layer>
  );
};

WithdrawDai.defaultProps={ close:null };

export default WithdrawDai;
