import React from 'react';
import { Anchor, Layer, Header, Footer, Button, Box, Text } from 'grommet';

import ProfileButton from '../../components/ProfileButton';

import { YieldContext } from '../../contexts/YieldContext';
import { useWeb3React } from '../../hooks';

const AccountLayer = (props:any) => {
  const { closeLayer, changeWallet } = props;

  const { library } = useWeb3React();

  // const { state: { chainId }  } = React.useContext(ConnectionContext);
  const { state: { userData } } = React.useContext(YieldContext);
  
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
          background='background-mid'
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
          <Text weight="bold"> { library.network.name } </Text>
          <Box direction='row' gap='small'>
            <Text size='xsmall'>ETH balance:</Text>
            <Text>{ userData.ethBalance_ && userData.ethBalance_ || '' }</Text>
          </Box>
          {/* <Button fill='horizontal' label='Connect to another wallet' onClick={()=>setShowConnectLayer(true)} /> */}
        </Box>

        <Box 
          align='center'
          // pad='large'
          // gap='small'
          overflow='auto'
        >
          <Text>Previous TX Info</Text>
          <Text>Previous TX Info</Text>
          <Text>Previous TX Info</Text>
          <Text>Previous TX Info</Text>

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