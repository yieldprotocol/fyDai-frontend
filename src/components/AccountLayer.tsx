import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { Anchor, Grommet, grommet, Grid, Layer, Main, Image, Header, Heading, Footer, Button, Box, Avatar, Text, CheckBox, ThemeContext, Paragraph } from 'grommet';
import { 
  FaTimes as Close,
} from 'react-icons/fa';

import { useGetWeiBalance, getNetworkName }  from '../hooks/connectionFns';

import ProfileButton from './ProfileButton';

const AccountLayer = (props:any) => {
  const [balance, setBalance] = React.useState();
  const { account, chainId } = useWeb3React();
  const { closeLayer, changeWallet } = props;

  const getWeiBalance = useGetWeiBalance();

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
          round={{ corner:'bottom', size:'medium' }}
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
            <Text size='xsmall'>WEI balance:</Text>
            <Text>{ balance }</Text>
          </Box>
          
          {/* <Button fill='horizontal' label='Connect to another wallet' onClick={()=>setShowConnectLayer(true)} /> */}
        </Box>

        <Box 
          align='center'
          // pad='large'
          // gap='small'
          overflow='auto'
        >
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>OR MAYBE TRANSACTIONS?</Text>
          <Text>Some Account Info</Text>
          <Text>well, what ever else. </Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>

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