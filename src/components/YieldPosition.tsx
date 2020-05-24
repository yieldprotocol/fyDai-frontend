import React from 'react';
import { Avatar, Box, Button, CheckBox, Menu, TextInput, DropButton, Stack, Text, Collapsible, Image } from 'grommet';
import moment from 'moment';

import {
  FaEthereum as EthLogo, 
  FaCaretDown as CaretDown, 
  FaCaretUp as CaretUp,
  FaWeightHanging as  Debt,
  FaTimes as Close,
  FaExchangeAlt as Exchange,
  // FaEllipsisV as Exchange,
} from 'react-icons/fa';

function YieldPosition({ position, input, selectPositionFn }: any) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const [inputValue, setInputValue]= React.useState<any>();

  const [actionsVisible, setActionsVisible] = React.useState<any>([]);

  const handleMenuClick = (arr:any) =>{
    setActionsVisible(arr);
    setMenuOpen(!menuOpen);
  };

  const handleSelectPosition= (e:any) =>{
    // console.log(e);
    selectPositionFn(e);
  };

  return (
    <Box
      elevation={menuOpen?'xsmall':'none'}
      round='small'
     // style={{ borderRadius:'24px 0px 0px 24px' }}
    >
      <Box direction='row'>
        <Box style={{ borderRadius:'24px 0px 0px 24px' }} direction='row' align='center' pad='small'>
          <EthLogo />
        </Box>
        <Box 
          direction='row-responsive'
          justify='between'
          align='baseline'
          gap='none'
          flex
          // elevation='xsmall'
          // style={{ borderRadius:'0px 24px 24px 0px' }}
        >
          <Box onClick={()=>handleMenuClick(['DEPOSIT'])} hoverIndicator='background' round>
            <Stack anchor='top'>
              <Box pad='small' direction='row'>
                <Box margin='xsmall' pad={{ vertical:'none', horizontal:'xsmall' }} gap='xsmall' direction='row'>
                  <Text>{position.value}</Text>
                  <Text>{position.type}</Text>
                </Box>
              </Box>
              <Box margin={{ bottom:'xsmall' }}>
                <Text size='10px'>Deposited</Text>
              </Box>
            </Stack>
          </Box>
          
          <Box direction='row' justify='center'>
            <Box onClick={()=>handleMenuClick(['PAYBACK'])} hoverIndicator='background' round>

              <Stack anchor='top' onClick={()=>handleMenuClick(['PAYBACK'])}>
                <Box pad='small' direction='row'>
                  <Box 
                    margin='xsmall'
                    pad={{ vertical:'none', horizontal:'xsmall' }}
                    gap='xsmall'
                    direction='row'
                    round
                    background='pink'
                  >
                    {position.debt}
                    yDai
                  </Box>
                </Box>
                <Box margin={{ bottom:'xsmall' }}>
                  <Text size='10px'>Debt</Text>
                </Box>
              </Stack>
            </Box>

            <Box onClick={()=>handleMenuClick(['SELL'])} hoverIndicator='background' round>
              <Stack anchor='top' onClick={()=>handleMenuClick(['SELL'])}>
                <Box pad='small' direction='row'>
                  <Box margin='xsmall' pad={{ vertical:'none', horizontal:'xsmall' }} gap='xsmall' direction='row' round background='lightgreen'>
                    {position.balance}
                    yDai
                  </Box>
                </Box>
                <Box margin={{ bottom:'xsmall' }}>
                  <Text size='10px'>Balance</Text>
                </Box>
              </Stack>
            </Box>

          </Box>

        </Box>
        <Box direction='row' align='center' pad='small'>

          
          { menuOpen?
            <Box pad='small'><Close onClick={()=>handleMenuClick([])} /></Box>
            :
            <Menu
              dropAlign={{ 'top': 'top', 'left': 'left' }}
              label={<Box><Exchange color="grey" /></Box>}
              items={[
                { label: 'Deposit', onClick: ()=>handleMenuClick(['DEPOSIT']) },
                { label: 'Borrow', onClick: ()=>handleMenuClick(['BORROW']) },
                { label: 'Payback Debt', onClick: ()=>handleMenuClick(['PAYBACK']) },
                { label: 'Sell', onClick: ()=>handleMenuClick(['SELL']) },
              ]}
              icon={false}
            />}
        </Box>
      </Box>

      <Collapsible open={menuOpen}>
        <Box
          elevation='none'
          style={{ borderRadius:'0px 0px 24px 24px' }}
          gap='small'
          direction='column'
          margin='small'
        >
          {actionsVisible.includes('BORROW') &&
          <Box gap='xsmall' direction='row' align='baseline'>
            <Box direction='row' gap='small'>
              Borrow against Collateral : 
            </Box>
            <Box flex>
              <TextInput
                size='small'
                type="number"
                placeholder="Amount to borrow"
                value={inputValue}
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<Text>yDai</Text>}
                reverse
              />
            </Box>
            {/* { actionsVisible.length === 1 && <Close onClick={()=>handleMenuClick([])} /> } */}
          </Box>}

          {actionsVisible.includes('PAYBACK') &&
          <Box gap='xsmall' direction='row' align='baseline'>
            <Box direction='row' gap='small'>
              Payback existing debt : 
            </Box>
            <Box flex>
              <TextInput
                size='small'
                type="number"
                placeholder="Amount to payback"
                value={inputValue}
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<Text>yDai</Text>}
                reverse
              />
            </Box>
            {/* { actionsVisible.length === 1 && <Close onClick={()=>handleMenuClick([])} /> } */}
          </Box>}

          {actionsVisible.includes('SELL') &&
          <Box gap='xsmall' direction='row' align='baseline' justify='between'>
            <Box direction='row' gap='small'>
              Sell on <Text color='#FF007F'><span role='img'> 🦄</span> Uniswap :</Text>
            </Box>
            <Box flex>
              <TextInput
                size='small'
                type="number"
                placeholder="Amount to sell"
                value={inputValue}
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<Text>yDai</Text>}
                reverse
              />
            </Box>
            {/* { actionsVisible.length === 1 && <Close onClick={()=>handleMenuClick([])} /> } */}
          </Box>}

          {actionsVisible.includes('DEPOSIT') &&
          <Box gap='xsmall' direction='row' align='baseline' justify='between'>
            <Box direction='row' gap='small'>
              Deposit more ETH collateral : 
            </Box>
            <Box flex>
              <TextInput
                size='small'
                type="number"
                placeholder="Amount to deposit"
                value={inputValue}
                onChange={(event:any) => setInputValue(event.target.value)}
                icon={<Text>yDai</Text>}
                reverse
              />
            </Box>
            {/* { actionsVisible.length === 1 && <Close onClick={()=>handleMenuClick([])} /> } */}
          </Box>}

        </Box>
      </Collapsible>

    </Box>

  );
}

export default YieldPosition;
