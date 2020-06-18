import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Footer, Button, Box, Text } from 'grommet';

import { getNetworkName }  from '../../hooks/connectionHooks';

import { YieldContext } from '../../contexts/YieldContext';

import ProfileButton from '../../components/ProfileButton';

const AccountLayer = (props:any) => {
  const { chainId } = useWeb3React();
  const { closeLayer, changeWallet } = props;

  const { state, actions } = React.useContext(YieldContext);
  const { extBalances } = state;

  const onClose = () => {
    closeLayer();
  };

  return (
    <Layer 
      animation='slide'
      position='right'
      full="vertical"
      // modal={false}
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
          // round={{ corner:'bottom', size:'medium' }}
          fill='horizontal'
          background='background-frontheader'
          pad={{ horizontal: 'medium', vertical:'large' }}
        >
          <ProfileButton />
          <Anchor color='brand' onClick={()=>onClose()} size='xsmall' label='Close' />
        </Header>

        <Box
          pad="medium"
          align="center"
          justify="center"
          gap='small'
        >
          <Text size='xsmall'>Connected to:</Text> 
          <Text weight="bold">{chainId && getNetworkName(chainId) }</Text>
          <Box direction='row' gap='small'>
            <Text size='xsmall'>ETH balance:</Text>
            <Text>{ extBalances.ethBalance_p && extBalances.ethBalance_p || '' }</Text>
          </Box>
          {/* <Button fill='horizontal' label='Connect to another wallet' onClick={()=>setShowConnectLayer(true)} /> */}
        </Box>

        <Box 
          align='center'
          // pad='large'
          // gap='small'
          overflow='auto'
        >
          <Text>Previous TX Info?</Text>
          <Text>Previous TX Info?</Text>
          <Text>Previous TX Info?</Text>
          <Text>Previous TX Info? </Text>

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

export default AccountLayer;