import React from 'react';
import { Box, Text } from 'grommet';

const ActionMenu = ({ handleSelectAction }:any) => {
  return (
    <Box
      direction='column'
      gap='xsmall'
      margin='xsmall'
    >
      <Box 
        align='center'
        fill='horizontal'
        pad='small' 
        hoverIndicator='background-mid' 
        round 
        onClick={()=> handleSelectAction('BORROW')}
      > Borrow yDai
      </Box>

      <Box 
        align='center'
        fill='horizontal'
        pad='small' 
        hoverIndicator='background-mid' 
        round 
        onClick={()=> handleSelectAction('SELL')}
      > Sell yDai
        {/* <Box direction='row' gap='small'>Sell yDai on <Text color='#FF007F'><span role='img'> 🦄</span> Uniswap</Text></Box> */}
      </Box>

      <Box 
        align='center'
        fill='horizontal'
        pad='small' 
        hoverIndicator='background-mid' 
        round 
        onClick={()=> handleSelectAction('BUY')}
      > Buy yDai (Lend)
        {/* <Box direction='row' gap='small'>Buy yDai on <Text color='#FF007F'><span role='img'> 🦄</span> Uniswap</Text></Box> */}
      </Box>

      <Box 
        align='center'
        fill='horizontal'
        pad='small' 
        hoverIndicator='background-mid' 
        round 
        onClick={()=> handleSelectAction('PAYBACK')}
      > Payback debt
      </Box>

      <Box 
        align='center'
        fill='horizontal'
        pad='small' 
        hoverIndicator='background-mid' 
        round 
        onClick={()=> handleSelectAction('WITHDRAW')}
      > Withdraw collateral
      </Box>

      <Box 
        align='center'
        fill='horizontal'
        pad='small'
        hoverIndicator='background-mid'
        round 
        onClick={()=> handleSelectAction('DEPOSIT')}
      > Add more collateral
      </Box>

      <Box>.</Box>
        
    </Box>
  );
};

export default ActionMenu;
