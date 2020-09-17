import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Text, ResponsiveContext } from 'grommet';
import { useSignerAccount } from '../hooks';

interface IActionSelectorProps {
  setActiveView: any;
  activeView: number;
}

function ActionSelector({ setActiveView, activeView }:IActionSelectorProps) {

  const screenSize = useContext(ResponsiveContext);
  const { account } = useSignerAccount();
  
  return (
    <Box
      pad={{ horizontal:'medium', vertical :'medium' }}
      alignSelf="center"
      width={{ max: '750px' }}
      fill="horizontal"
    >
      <Box
        direction="row"
        gap="small"
        fill="horizontal"
        justify='between'
      >
        <Box
          round='large'
          pad={{ horizontal: 'large', vertical: 'xsmall' }}
          background={
            activeView === 0 ? 'background-front' : undefined
          }
          onClick={() => setActiveView(0)}
          direction="row"
          justify="between"
          gap="small"
          // border={activeView === 0 ? undefined : 'all'} 
          hoverIndicator={activeView === 0 ? undefined : 'brand-transparent'}
        >
          <Text size="small" weight="bold">
            1. Add Collateral
          </Text>
          {/* {position.ethPosted>0 && <CheckCircle color="green" />} */}
        </Box>

        <Box
          round='large'
          pad={{ horizontal: 'large', vertical: 'xsmall' }}
          background={
            activeView === 1 ? 'background-front' : undefined
          }
          onClick={() => setActiveView(1)}
          // border={activeView === 1 ? undefined : 'all'} 
          hoverIndicator={activeView === 1 ? undefined : 'brand-transparent'}
        >
          <Text size="small" weight="bold">
            2. Borrow Dai
          </Text>
        </Box>

        <Box
          round='large'
          pad={{ horizontal: 'large', vertical: 'xsmall' }}
          background={activeView === 2 ? 'background-front' : undefined}
          // elevation={activeView === 2 ? 'small' : undefined}
          onClick={account?() => setActiveView(2):()=>{console.log('connect a wallet')}}
          // border={activeView === 2 ? undefined : 'all'} 
          hoverIndicator={activeView === 2 ? undefined : 'brand-transparent'}  
        >
          <Text size="small" weight="bold" color={account?undefined:'text-weak'}>
            3. Repay Dai Debt
          </Text>
        </Box>

        {false&& !account && 
        <Button
          color='brand-transparent'
          label={<Text size='xsmall' color='brand'>Connect a wallet</Text>}
          onClick={()=>console.log('still to implement')}
          hoverIndicator='brand-transparent'
        />}

      </Box>
    </Box>
  );
}

export default ActionSelector;
