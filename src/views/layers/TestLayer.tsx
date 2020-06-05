import React from 'react';

import { ethers } from 'ethers';

import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

import { getNetworkName, useMakerVault }  from '../../hooks/connectionHooks';
import ProfileButton from '../../components/ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

import { useSendTx, useCallTx, useDealer, useGetBalance } from '../../hooks/yieldHooks';

import { SeriesContext } from '../../contexts/SeriesContext';

const TestLayer = (props:any) => {
  const { chainId, account } = useWeb3React();

  const web3 = useWeb3React();

  const { state } = React.useContext( SeriesContext );
  const [ balance, setBalance ] = React.useState<string|null>('-');
  const [ weiBalance, setWeiBalance ] = React.useState<string|null>('-');
  const [ wethBalance, setWethBalance ] = React.useState<string|null>('-');
  const { closeLayer, changeWallet } = props;
  const [ connectMakerVault ] = useMakerVault();
  const { dispatch } = React.useContext<any>(NotifyContext);

  const [ sendTx ]  = useSendTx();
  const [ callTx ]  = useCallTx();
  const { post, approveDealer, withdraw, borrow, postActive, withdrawActive }  = useDealer();
  const [ getBalance, getWeiBalance, getWethBalance ]  = useGetBalance();

  React.useEffect(()=>{
    (async () => setWethBalance( await getWethBalance(state.deployedCore.Weth)) )();
  }, [state.deployedCore.Weth, postActive, withdrawActive]);
  
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
      position='left'
      full="vertical"
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

          <Box direction='row' gap='small'>
            <Text size='xsmall'>yDai[0] collateral balance:</Text>
            <Text size='xsmall'>balance</Text>
          </Box>

          <Box direction='row' gap='small'>
            <Text size='xsmall'>yDai[0] balance:</Text>
            <Text size='xsmall'>balance</Text>
          </Box>
          <Box direction='row' gap='small'>
            <Text size='xsmall'>yDai[0] debt:</Text>
            <Text size='xsmall'>debt </Text>
          </Box>

        </Box>

        <Box 
          align='center'
          pad='large'
          gap='small'
          overflow='auto'
        >
          {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}

          <Button label='1. Add (100 weth)- DEV' onClick={()=> sendTx(state.deployedCore.Weth, 'Weth', 'mint', [account, ethers.utils.parseEther('100').toString()] )} />
         
          <Button label='2. Weth approve dealer' onClick={()=> approveDealer(state.deployedCore.Weth, state.seriesData[0].Dealer, 1.5)} />
          <Button label='3. Post Collateral' disabled={postActive} onClick={()=> account && post(state.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
          <Button label='(4. Withdraw)' onClick={()=> account && withdraw(state.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
          
          <Button label='5.Borrow' onClick={()=> account && borrow(state.seriesData[0].Dealer, 'WETH', account, 0.5 )} />

          {/* <Button label='5.log debt' onClick={()=> console.log( ) borrow(state.seriesData[0].Dealer, 'WETH', account, 0.5 )} /> */}
          {/* <Button label='payTx 10eth e4Be...' onClick={()=> payTx('0xe4Be16e13267466B6241dEA1252bE231dfA8D86c', '10')} /> */}
          {/* <Button label='check Maker vault' onClick={()=> makerVault()} /> */}

          <Button label='RANDOM FN BUTTON' onClick={()=>console.log('wahh')} />

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
