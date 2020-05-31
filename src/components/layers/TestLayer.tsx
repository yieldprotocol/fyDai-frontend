import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

import { useGetWeiBalance, getNetworkName, useSendTx, useMakerVault, useRandomFn }  from '../../hooks/connectionFns';
import ProfileButton from '../ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

const TestLayer = (props:any) => {
  const [balance, setBalance] = React.useState();
  const { chainId } = useWeb3React();
  const { closeLayer, changeWallet } = props;

  const getWeiBalance = useGetWeiBalance();
  const sendTx  = useSendTx();
  const randomFn  = useRandomFn();
  const makerVault = useMakerVault();
  const { dispatch } = React.useContext<any>(NotifyContext);

  const updateBalance = async () => {
    setBalance(await getWeiBalance);
  };

  React.useEffect(() => {
    updateBalance();
    // (async () => activate(injected, console.log))();
  }, []);

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
            <Text size='xsmall'>WEI balance:</Text>
            <Text>{ balance }</Text>
          </Box>
        </Box>

        <Box 
          align='center'
          pad='large'
          gap='small'
          overflow='auto'
        >

          <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} />
          <Button label='useNotify_error' onClick={()=>dispatch({ type: 'notify', payload: { message:'oooops :( - must cancel manually', type:'error', showFor:0 } })} />
          <Button label='useNotify_success' onClick={()=>dispatch({ type: 'notify', payload: { message:'sucessfull', type:'success' } })} />
          <Button label='blank' />
          <Button label='Test C' />
          <Button label='SendTest Transaction' onClick={()=> sendTx()} />

    
          <Button label='getNetwork ID' onClick={()=>console.log} />
          <Button label='check Maker vault' onClick={()=> makerVault()} />


          <Button label='RANDOM FN BUTTON' onClick={()=> randomFn()} />


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
