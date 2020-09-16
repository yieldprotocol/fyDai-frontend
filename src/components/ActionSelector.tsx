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
      direction="row"
      pad={{ horizontal:'medium', vertical :'medium' }}
      alignSelf="center"
      width={{ max: '750px' }}
      fill="horizontal"
    >
      <Box
        round='small'
        direction="row"
        gap="small"
        fill="horizontal"
        justify='between'
      >
        <Box
          round='small'
          pad={{ horizontal: 'large', vertical: 'xsmall' }}
          background={
            activeView === 0 ? 'background-front' : undefined
          }
          elevation={activeView === 0 ? 'small' : undefined}
          onClick={() => setActiveView(0)}
          direction="row"
          justify="between"
          gap="small"
        >
          <Text size="small" weight="bold">
            1. Add Collateral
          </Text>
          {/* {position.ethPosted>0 && <CheckCircle color="green" />} */}
        </Box>

        <Box
          round='small'
          pad={{ horizontal: 'large', vertical: 'xsmall' }}
          background={
            activeView === 1 ? 'background-front' : undefined
          }
          elevation={activeView === 1 ? 'small' : undefined}
          onClick={() => setActiveView(1)}
        >
          <Text size="small" weight="bold">
            2. Borrow Dai
          </Text>
        </Box>

        <Box
          round='small'
          pad={{ horizontal: 'large', vertical: 'xsmall' }}
          background={activeView === 2 ? 'background-front' : undefined}
          elevation={activeView === 2 ? 'small' : undefined}
          onClick={account?() => setActiveView(2):()=>{console.log('connect a wallet')}}
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
