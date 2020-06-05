import React from 'react';

import { ethers } from 'ethers';

import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

import { getNetworkName, useMakerVault }  from '../../hooks/connectionHooks';
import ProfileButton from '../../components/ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

import { useSendTx, useCallTx, useDealer, useGetBalance } from '../../hooks/yieldHooks';

import { SeriesContext } from '../../contexts/SeriesContext';
import { PositionsContext } from '../../contexts/PositionsContext';

const TestLayer = (props:any) => {
  const { chainId, account } = useWeb3React();

  const web3 = useWeb3React();

  const { state: seriesState } = React.useContext( SeriesContext );
  const { state: positionsState, actions: positionsActions } = React.useContext( PositionsContext );
  const [ balance, setBalance ] = React.useState<string|null>('-');
  const [ flow, setFlow ] = React.useState<string|null>('WETH');
  const [ wethBalance, setWethBalance ] = React.useState<string|null>('-');
  const { closeLayer, changeWallet } = props;
  const [ connectMakerVault ] = useMakerVault();
  const { dispatch } = React.useContext<any>(NotifyContext);

  const [ sendTx ]  = useSendTx();
  const [ callTx ]  = useCallTx();
  const { post, approveDealer, withdraw, borrow, repayYDai, repayDai, postActive, withdrawActive }  = useDealer();
  const [ getBalance, getWeiBalance, getWethBalance ]  = useGetBalance();

  const { positionsData } = positionsState;
  const { deployedCore } = seriesState; 

  React.useEffect(()=>{
    (async () => setWethBalance( await getWethBalance(seriesState.deployedCore.Weth)) )();
  }, [seriesState.deployedCore.Weth, postActive, withdrawActive]);
  
  React.useEffect(() => {
    (async () => setBalance( await getBalance()) )();
    // (async () => setWeiBalance( await getWeiBalance()) )();
    // (async () => activate(injected, console.log))();
  }, [chainId, account]);

  const onClose = () => {
    closeLayer();
  };

  return (
    <Layer 
      animation='slide'
      position='center'
      full
      modal={false}
      onClickOutside={onClose}
      onEsc={onClose}
    >
      <Box 
        direction='column'
        fill='vertical'
        background='background-front'
         // alignContent='center'
        style={{ minWidth: '240px' }}
        gap='small'
      >
        <Header 
          round={{ corner:'bottom', size:'medium' }}
          fill='horizontal'
          background='background-frontheader'
          pad={{ horizontal: 'small', vertical:'medium' }}
        >
          <Heading level='6'> FOR TESTING ONLY</Heading>
          <Anchor color='brand' onClick={()=>onClose()} size='xsmall' label='close' />
        </Header>

        <Box direction='row' justify='evenly'>

          <Box
            pad="medium"
            align="center"
            justify="center"
            gap='small'
          >
          
            <ProfileButton />
            <Text size='xsmall'>Connected to:</Text> 
            <Text weight="bold">{chainId && getNetworkName(chainId) }</Text>
            <Text weight="bold">{chainId && chainId }</Text>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>ETH balance:</Text>
              <Text size='xsmall'>{ balance }</Text>
            </Box>
            {/* <Box direction='row' gap='small'>
            <Text size='xsmall'>WEI balance:</Text>
            <Text size='xsmall'>{ weiBalance }</Text>
          </Box> */}
            <Box direction='row' gap='small'>
              <Text size='xsmall'>WETH balance:</Text>
              <Text size='xsmall'>{ wethBalance && ethers.utils.formatEther(wethBalance.toString()) }</Text>
            </Box>
          </Box>



          <Box 
            align='center'
            pad='large'
            gap='small'
            overflow='auto'
          >
            <Box direction='row'>
              <Button primary={flow==='WETH'} label='WETH flow' onClick={()=>setFlow('WETH')} style={{ borderRadius:'24px 0px 0px 24px' }} />
              <Button primary={flow==='CHAI'} label='CHAI flow' onClick={()=>setFlow('CHAI')} style={{ borderRadius:'0px 0px 0px 0px' }} />
              <Button primary={flow==='MATURITY'} label='Maturity' onClick={()=>setFlow('MATURITY')} style={{ borderRadius:'0px 24px 24px 0px' }} />
            </Box>

            { flow === 'WETH' && 
            <>
              {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
              <Button label='1. Add (100 weth)- DEV' onClick={()=> sendTx(seriesState.deployedCore.Weth, 'Weth', 'mint', [account, ethers.utils.parseEther('100').toString()] )} />
              <Button label='2. Weth approve dealer 1.5' onClick={()=> approveDealer(seriesState.deployedCore.Weth, seriesState.seriesData[0].Dealer, 1.5)} />
              <Button label='3. Post Collateral 1.5' disabled={postActive} onClick={()=> account && post(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
              <Button label='(4. Withdraw 1.5)' onClick={()=> account && withdraw(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
              <Button label='5.Borrow 0.5' onClick={()=> account && borrow(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
              <Button label='6.1 Repay 0.5 in yDai' onClick={()=> account && repayYDai(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
              <Button label='( 6.2 Repay 0.5 in Dai) ' onClick={()=> account && repayDai(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
            </>}

            { flow === 'CHAI' && 
            <>
              {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
              <Button label='1. Add (100 chai)- DEV' onClick={()=> sendTx(seriesState.deployedCore.Weth, 'Weth', 'mint', [account, ethers.utils.parseEther('100').toString()] )} />
              <Button label='2. CHAI approve dealer 1.5' onClick={()=> approveDealer(seriesState.deployedCore.Weth, seriesState.seriesData[0].Dealer, 1.5)} />
              <Button label='3. Post CHAI Collateral 1.5' disabled={postActive} onClick={()=> account && post(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
              <Button label='(4. Withdraw 1.5 CHAI)' onClick={()=> account && withdraw(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
              <Button label='5.Borrow 0.5' onClick={()=> account && borrow(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
              <Button label='( 6.1 Repay 0.5 in yDai )' onClick={()=> account && repayYDai(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
              <Button label='6.2 Repay 0.5 in Dai' onClick={()=> account && repayDai(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
            </>}

            { flow === 'MATURITY' && 
            <>
              {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
              <Button label='Mature yDai' onClick={()=> account && withdraw(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
              <Button label='Redeem Dai' onClick={()=> account && withdraw(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
            </>}

          </Box>

          <Box
            pad="medium"
            align="center"
            justify="center"
            gap='small'
          > 
            { positionsData.length > 0 && !positionsState.isLoading ? 
              <Box pad='small' gap='medium' fill>
                <Box direction='row'>
                  <Text weight='bold'>yDai[0]: {positionsData[0].symbol}</Text>
                </Box>
                <Box gap='small'>
                  <Text>weth posted: { positionsData[0].wethPosted }</Text>
                  <Text>chai posted: { positionsData[0].chaiPosted }</Text>
                  <Text> yDai Balance: { positionsData[0].yDaiBalance }</Text>
                  <Text>yDai Debt (WETH): { positionsData[0].yDaiDebtWeth }</Text>
                  <Text>yDai Debt (CHAI): { positionsData[0].yDaiDebtChai }</Text>
                  <Text>Dai Debt: { positionsData[0].daiDebt }</Text>
                </Box>
                <Button label='refresh' onClick={()=>positionsActions.getPositions()} />
              </Box>
              :
              <Box pad='small' fill align='center' justify='center'> 
                <Text>Loading... </Text>
              </Box>}
          </Box>

        </Box>

        <Footer pad='medium' gap='xsmall' direction='row' justify='center' align='center'>
          <Box round>
            <Button 
              fill='horizontal'
              size='small' 
              onClick={()=>changeWallet()}
              color='background-front'
              label='Change wallet'
              hoverIndicator='background'
            />
          </Box>
        </Footer>
      </Box>
    </Layer>
  );
};

export default TestLayer;
