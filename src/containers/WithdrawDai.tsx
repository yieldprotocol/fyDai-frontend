import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { Box, Layer, CheckBox, TextInput, Text } from 'grommet';
import { 
  FiInfo as Info,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';
import { FaEthereum as Ethereum } from 'react-icons/fa';
import { SeriesContext } from '../contexts/SeriesContext';
import { YieldContext } from '../contexts/YieldContext';
import { usePool, useYDai, useToken } from '../hooks';

interface WithDrawDaiProps {
  close?: any;
  withdraw?: any;
  maxValue?: number;
}

const WithdrawDai = ({ close }:WithDrawDaiProps) => {

  const [ maxWithdraw, setMaxWithdraw ] = useState<number>(0);
  const [ inputValue, setInputValue ] = useState<any>();

  const [ approved, setApproved ] = React.useState<any>(0);
  const [ daiApproved, setDaiApproved ] = React.useState<any>(0);

  const [ yDaiValue, setYDaiValue ] = React.useState<number>(0);

  const [ withdrawDisabled, setWithdrawDisabled ] = useState<boolean>(true);
  const [ indicatorColor, setIndicatorColor ] = useState<string>('brand');
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { state: yieldState, actions: yieldActions } = useContext(YieldContext);
  const { deployedContracts } = yieldState;

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);

  const { userData: { ethBalance_ } } = yieldState;
  const { seriesAggregates, activeSeries  } = seriesState;
  const {
    collateralAmount_,
    minSafeCollateral_,
    collateralRatio_,
    debtValue_,
    estimateRatio, // TODO << this is a function (basically just passed from hooks via context) >> 
  } = seriesAggregates;

  const { buyDai, previewPoolTx }  = usePool();
  const { userAllowance } = useYDai();
  const { approveToken, approveActive } = useToken();

  const withdrawProcedure = async (value:number) => {
    await buyDai(
      activeSeries.poolAddress,
      inputValue,
      0 // transaction queue value
    );
    await yieldActions.updateUserData();
    await seriesActions.refreshPositions([activeSeries]);
    close();
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
      <Box 
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='medium'
        pad='large'
      >
        <Box align='center' flex='grow' justify='between' gap='large'>
          <Box gap='medium' align='center' fill='horizontal'>
            <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Withdraw Dai</Text>
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
                  placeholder='Dai'
                  value={inputValue || ''}
                  plain
                  onChange={(event:any) => setInputValue(event.target.value)}
                  icon={<Ethereum />}
                />
              </Box>

              <Box justify='center'>
                <Box
                  round
                  onClick={()=>setInputValue( maxWithdraw || checkMaxWithdraw() )}
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

          <Box>
            <CheckBox 
              reverse
                // value={true}
              checked={!inputValue || ( approved >= inputValue )}
              disabled={!inputValue || ( approved >= inputValue )}
              onChange={()=>approveProcedure(yDaiValue)}
              label={(approved >= yDaiValue) ? 
                `~${daiApproved.toFixed(2)} Dai unlocked (${approved.toFixed(2) || '' } yDai)` 
                : `Unlock ${inputValue || ''} Dai`}
            />
          </Box>

          <Box
            fill='horizontal'
            round='medium'
            background={( !(inputValue>0) || withdrawDisabled) ? 'brand-transparent' : 'brand'}
            onClick={(!(inputValue>0) || withdrawDisabled)? ()=>{}:()=> withdrawProcedure(inputValue)}
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
      </Box>
    </Layer>
  );
};

export default WithdrawDai;
