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
import { usePool, useYDai, useToken, useSignerAccount } from '../hooks';
import { UserContext } from '../contexts/UserContext';

import InputWrap from '../components/InputWrap';
import DaiMark from '../components/logos/DaiMark';
import InfoGrid from '../components/InfoGrid';

interface IRemoveLiquidityProps {
  close?: any;
}

const RemoveLiquidity = ({ close }:IRemoveLiquidityProps) => {

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries  } = seriesState;
  const { state: userState, actions: userActions } = useContext(UserContext);

  const { account } = useSignerAccount();
  
  const [ maxRemove, setMaxRemove ] = useState<number>(0);
  const [ inputValue, setInputValue ] = useState<any>();

  const [ removeLiquidityDisabled, setRemoveLiquidityDisabled ] = useState<boolean>(true);
  const [ removeLiquidityPending, setRemoveLiquidityPending] = useState<boolean>(false);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const theme:any = React.useContext(ThemeContext);


  /* Remove Liquidity sequence */
  const removeLiquidityProcedure = async (value:number) => {
    if ( inputValue>0 && !removeLiquidityDisabled ) {
      setRemoveLiquidityPending(true);

      console.log('removeing liquidity');

      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setRemoveLiquidityPending(true);
      close();
    }
  };

  
  /* handle value calculations based on input changes */
  useEffect(() => {
    inputValue && ( async () => {
    })();
  }, [inputValue]);

  /* handle warnings input errors */
  // useEffect(() => {
  //   if ( inputValue && ( inputValue > daiBalance_ ) ) {
  //     setAddLiquidityDisabled(true);
  //     setWarningMsg(null);
  //     setErrorMsg('That amount exceeds the amount of DAI you have'); 
  //   } else {
  //     // setLendDisabled(false);
  //     setWarningMsg(null);
  //     setErrorMsg(null);
  //   }
  // }, [ inputValue ]);

  /* Remove Liquidity disabling logic */
  useEffect(()=>{
    if (
      !account ||
      !inputValue || 
      parseInt(inputValue, 10)===0  
    ) {
      setRemoveLiquidityDisabled(true);
    } else {
      setRemoveLiquidityDisabled(false);
    }
  }, [ inputValue ]);


  return (
    <Layer onClickOutside={()=>close()}>
      <Keyboard 
        onEsc={() => { inputValue? setInputValue(undefined): close();}}
        onEnter={()=> removeLiquidityProcedure(inputValue)}
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
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Remove Liquidity</Text>
            <InputWrap errorMsg={errorMsg} warningMsg={warningMsg} disabled={removeLiquidityDisabled}>
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
                onClick={()=>setInputValue( maxRemove )}
                hoverIndicator='brand-transparent'
              />
            </InputWrap>

            <InfoGrid entries={[
              {
                label: 'Token Balance',
                visible: true,
                active: inputValue,
                loading: false,     
                value: '1000',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Share of the Pool After withdraw',
                visible: true,
                active: inputValue,
                loading: false,           
                value: '0.02%',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Expected Dai to Receive',
                visible: true,
                active: inputValue,
                loading: false,           
                value: '34 DAI',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Like what you see?',
                visible: false,
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

            <Box
              fill='horizontal'
              round='small'
              background={( !(inputValue>0) || removeLiquidityDisabled) ? 'brand-transparent' : 'brand'}
              onClick={()=> removeLiquidityProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text
                weight='bold'
                size='large'
                color={( !(inputValue>0) || removeLiquidityDisabled) ? 'text-xweak' : 'text'}
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

RemoveLiquidity.defaultProps={ close:null };

export default RemoveLiquidity;
