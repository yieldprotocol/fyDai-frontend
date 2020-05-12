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
  const { closeLayer } = props;

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

  const handleChangeWallet = async (_connection:any) => {
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
      >
        <Header 
          round={{ corner:'bottom', size:'medium' }}
          fill='horizontal'
          background='background-frontheader'
          pad={{ horizontal: 'medium', vertical:'large' }}
        >
          <ProfileButton />
          {/* <Box 
            round='xlarge' 
            background='brand'
            border={{ color: 'brand' }}
            pad={{ horizontal: 'medium', vertical:'xsmall' }}
          >
            <Text>Connect to a Wallet</Text>
          </Box> */}
          <Anchor color='brand' onClick={()=>onClose()} size='xsmall' label='Cancel' />
        </Header>
        <Box
          pad="medium"
          align="center"
          justify="center"
          gap='small'
        >
          <Text size='xsmall'>Connected to:</Text> 
          <Text weight="bold">{chainId && getNetworkName(chainId) }</Text>
          <Text size='xsmall'>WEI balance:</Text>
          <Text>{ balance }</Text>
          {/* <Button fill='horizontal' label='Connect to another wallet' onClick={()=>setShowConnectLayer(true)} /> */}
        </Box>

        <Box 
          align='center'
          pad='medium'
          gap='small'
          overflow='auto'
        >
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
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>
          <Text>Some Account Info</Text>

        </Box>
        <Footer
          pad='medium'
        >
          <Box gap='xsmall' direction='row'>
            {/* <Anchor href="#" label="help!" size='xsmall' color='brand' />
            <Text size='xsmall'> I'm not sure what this means.</Text> */}
          </Box>
        </Footer>
      </Box>
    </Layer>
  );
};

export default AccountLayer;