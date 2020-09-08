import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { Box, Button, Layer, TextInput, Text, Keyboard, ThemeContext, ResponsiveContext } from 'grommet';
import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import YieldMark from '../components/logos/YieldMark';

import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount, useProxy } from '../hooks';

import InputWrap from '../components/InputWrap';
import InfoGrid from '../components/InfoGrid';

interface IRemoveLiquidityProps {
  close?: any;
}

const RemoveLiquidity = ({ close }:IRemoveLiquidityProps) => {

  const screenSize = useContext(ResponsiveContext);

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries  } = seriesState;
  const { state: userState, actions: userActions } = useContext(UserContext);

  const { account } = useSignerAccount();
  const { removeLiquidity } = useProxy();
  
  const [ maxRemove, setMaxRemove ] = useState<number>(0);
  const [ inputValue, setInputValue ] = useState<any>();

  const [ removeLiquidityDisabled, setRemoveLiquidityDisabled ] = useState<boolean>(true);
  const [ removeLiquidityPending, setRemoveLiquidityPending] = useState<boolean>(false);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);


  /* Remove Liquidity sequence */
  const removeLiquidityProcedure = async (value:number) => {
    if ( !removeLiquidityDisabled ) {
      setRemoveLiquidityPending(true);
      await removeLiquidity(activeSeries, value, 1);
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
  //     setErrorMsg('That amount exceeds the amount of Dai you have'); 
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
      parseFloat(inputValue) === 0
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
        onBackspace={()=> inputValue && setInputValue(inputValue.toString().slice(0, -1))}
        target='document'
      >
        <>
          <Box 
            width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
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
                ref={(input:any) => input && input.focus()}
                type="number"
                placeholder='Tokens to remove'
                value={inputValue || ''}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<YieldMark />}
              />
              <Button 
                label='Max'
                color='brand-transparent'
                onClick={()=>setInputValue( activeSeries?.poolTokens_ )}
                hoverIndicator='brand-transparent'
              />
            </InputWrap>

            <InfoGrid entries={[
              {
                label: 'Token Balance',
                visible: true,
                active: true,
                loading: false,     
                value: activeSeries?.poolTokens_.toFixed(2),
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Share of the Pool After withdraw',
                visible: false,
                active: inputValue,
                loading: false,           
                value: '0.02%',
                valuePrefix: null,
                valueExtra: null,
              },
              {
                label: 'Expected Dai to Receive',
                visible: false,
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
              background={removeLiquidityDisabled ? 'brand-transparent' : 'brand'}
              onClick={()=> removeLiquidityProcedure(inputValue)}
              align='center'
              pad='small'
            >
              <Text
                weight='bold'
                size='large'
                color={removeLiquidityDisabled ? 'text-xweak' : 'text'}
              >
                {`Remove ${inputValue || ''} tokens`}
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
          </Box>
        </>
      </Keyboard>
    </Layer>
  );
};

RemoveLiquidity.defaultProps={ close:null };

export default RemoveLiquidity;
