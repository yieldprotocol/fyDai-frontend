import React from 'react';

import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

import { getNetworkName, useMakerVault }  from '../../hooks/connectionFns';
import ProfileButton from '../ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

import { useSendTx, usePayTx, useCallTx, useGetBalance } from '../../hooks/txHooks';

import { SeriesContext } from '../../contexts/SeriesContext';

const TestLayer = (props:any) => {

  const { state } = React.useContext( SeriesContext );
  const [ balance, setBalance ] = React.useState();
  const [ weiBalance, setWeiBalance ] = React.useState();
  const { chainId, account } = useWeb3React();
  const { closeLayer, changeWallet } = props;

  const [ connectMakerVault ] = useMakerVault();
  const { dispatch } = React.useContext<any>(NotifyContext);

  const [ sendTx ]  = useSendTx();
  const [ callTx ]  = useSendTx();
  const [ payTx ]  = usePayTx();

  const [ getBalance, getWeiBalance ]  = useGetBalance();

  React.useEffect(() => {
    (async () => setBalance( await getBalance()) )();
    (async () => setWeiBalance( await getWeiBalance()) )();
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
          <Box direction='row' gap='small'>
            <Text size='xsmall'>WEI balance:</Text>
            <Text size='xsmall'>{ weiBalance }</Text>
          </Box>
          <Box direction='row' gap='small'>
            <Text size='xsmall'>Collateral WETH balance:</Text>
            <Text size='xsmall'>x </Text>
          </Box>
          <Box direction='row' gap='small'>
            <Text size='xsmall'>yDai balance:</Text>
            <Text size='xsmall'>balance</Text>
          </Box>
          <Box direction='row' gap='small'>
            <Text size='xsmall'>yDai debt:</Text>
            <Text size='xsmall'>debt </Text>
          </Box>
          <Box direction='row' gap='small'>
            <Text size='xsmall'>WEI balance:</Text>
            <Text>{ weiBalance }</Text>
          </Box>

        </Box>

        <Box 
          align='center'
          pad='large'
          gap='small'
          overflow='auto'
        >
          {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
          {/* <Button label='sendTx' onClick={()=> sendTx('0xcd16CA1398DA7b8f072eCF0028A3f4677B19fcd0', '1.2', 'no data')} /> */}
          <Button label='Add (weth)-DEV' onClick={()=> sendTx(state.sysAddrList.Weth, 'Weth', 'mint', [account, '10000000000000000000'] )} />
          <Button label='Weth Approve WethJoin' onClick={()=> sendTx(state.sysAddrList.Weth, 'Weth', 'approve', [state.sysAddrList.WethJoin, '1500000000000000000'] )} />

          <> oops.. hmm. console action reqd.  vat.rely( wethJoin Address) </>
          <Button label='WethJoin Join' onClick={()=> sendTx(state.sysAddrList.WethJoin, 'WethJoin', 'join', [account, '1500000000000000000'] )} />
          <Button label='Post Collateral' onClick={()=> sendTx(state.seriesData[0].Dealer, 'Dealer', 'post', [ ethers.utils.formatBytes32String('WETH'), account, '1500000000000000000'] )} />
          <Button label='Withdraw' onClick={()=> sendTx(state.seriesData[0].Dealer, 'Dealer', 'withdraw', [ ethers.utils.formatBytes32String('WETH'), account, '1500000000000000000'] )} />

          {/* <Button label='transfer Weth to treasury' onClick={()=> sendTx(state.sysAddrList.Weth, 'Weth', 'transfer', [state.sysAddrList.Treasury, '999999999999999'] )} /> */}
          {/* <Button label='push treasury' onClick={()=> sendTx(state.sysAddrList.Treasury, 'Treasury', 'pushWeth', [] )} /> */}
          {/* <Button label='Add 1 (chai)-DEV' onClick={()=> sendTx(state.sysAddrList.Chai, 'Chai', 'mint', [account, '1000000000000000000'] )} /> */}
          {/* <Button label='Add 0.1 (weth)-testnet' onClick={()=> sendTx(state.sysAddrList.Weth, 'Weth', 'mint', [account, '10000000000000000'] )} /> */}
          {/* <Button label='Add 0.1 (chai)-testnet' onClick={()=> sendTx(state.sysAddrList.Chai, 'Chai', 'mint', [account, '10000000000000000'] )} /> */}

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
