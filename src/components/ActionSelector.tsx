import React from 'react';
import { Box, Button, Text, Tabs, Tab, ResponsiveContext } from 'grommet';
import { useSignerAccount } from '../hooks';

interface IActionSelectorProps {
  setActiveView: any;
  activeView: string;
}

function ActionSelector({ setActiveView, activeView }:IActionSelectorProps) {

  const screenSize = React.useContext(ResponsiveContext);
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
            activeView === 'COLLATERAL' ? 'background-front' : undefined
          }
          elevation={activeView === 'COLLATERAL' ? 'small' : undefined}
          onClick={() => setActiveView('COLLATERAL')}
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
            activeView === 'BORROW' ? 'background-front' : undefined
          }
          elevation={activeView === 'BORROW' ? 'small' : undefined}
          onClick={() => setActiveView('BORROW')}
        >
          <Text size="small" weight="bold">
            2. Borrow DAI
          </Text>
        </Box>

        <Box
          round='small'
          pad={{ horizontal: 'large', vertical: 'xsmall' }}
          background={activeView === 'REPAY' ? 'background-front' : undefined}
          elevation={activeView === 'REPAY' ? 'small' : undefined}
          onClick={account?() => setActiveView('REPAY'):()=>{console.log('connect a wallet')}}
        >
          <Text size="small" weight="bold" color={account?undefined:'text-weak'}>
            3. Repay DAI Debt
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
