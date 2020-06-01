import React from 'react';
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
            <Text>{ balance }</Text>
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
          <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} />
          {/* <Button label='sendTx' onClick={()=> sendTx('0xcd16CA1398DA7b8f072eCF0028A3f4677B19fcd0', '1.2', 'no data')} /> */}
          <Button label='add TST balance' onClick={()=> sendTx(state.sysAddrList.Weth, 'Weth', 'mint', [account, '7598550064000000000'] )} />
          <Button label='payTx' onClick={()=> payTx('0x78584D4D1961D050bc6084ab5941aeC1C9384b20', '0.01')} />
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
