import React from 'react';
import { Box, Text, Tabs, Tab } from 'grommet';

interface IActionSelectorProps {
  setActiveView: any;
  activeView: string;
}

function ActionSelector({ setActiveView, activeView }:IActionSelectorProps) {
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
          pad={{ horizontal: 'large', vertical: 'small' }}
          background={
            activeView === 'COLLATERAL' ? 'background-front' : undefined
          }
          elevation={activeView === 'COLLATERAL' ? 'small' : undefined}
          onClick={() => setActiveView('COLLATERAL')}
          direction="row"
          justify="between"
          gap="small"
        >
          <Text size="xsmall" weight="bold">
            1. Add Collateral
          </Text>
          {/* {position.ethPosted>0 && <CheckCircle color="green" />} */}
        </Box>

        <Box
          round='small'
          pad={{ horizontal: 'large', vertical: 'small' }}
          background={
            activeView === 'BORROW' ? 'background-front' : undefined
          }
          elevation={activeView === 'BORROW' ? 'small' : undefined}
          onClick={() => setActiveView('BORROW')}
        >
          <Text size="xsmall" weight="bold">
            2. Borrow Dai
          </Text>
        </Box>

        <Box
          round='small'
          pad={{ horizontal: 'large', vertical: 'small' }}
          background={activeView === 'REPAY' ? 'background-front' : undefined}
          elevation={activeView === 'REPAY' ? 'small' : undefined}
          onClick={() => setActiveView('REPAY')}
        >
          <Text size="xsmall" weight="bold">
            3. Repay Dai Debt
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default ActionSelector;
