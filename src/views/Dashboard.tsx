import React from 'react';
import { Box, Button, Image, Heading, Text } from 'grommet';

import DashBorrow from '../containers/DashBorrow';
import DashLend from '../containers/DashLend';

import PageHeader from '../components/PageHeader';


const Dashboard = () => {
  const [activeView, setActiveView] = React.useState<string>('borrow');

  return (
    <>
      <Box
        direction="row"
        fill="horizontal"
        pad={{ bottom: 'large', horizontal: 'none' }}
        justify="between"
        align="center"
      >
        <PageHeader
          title="Dashboard"
          subtitle="Description of dashboard"
          tipPrimary="Tip: Convert your Maker vault"
          tipSecondary="View more tips"
        />
      </Box>

      <Box direction="row" pad={{ bottom: 'large' }}>
        <Box
          round="xsmall"
          direction="row"
          background="brand-transparent"
          pad="xxsmall"
          gap="small"
        >
          <Box
            round="xsmall"
            pad={{ horizontal: 'large', vertical: 'xxsmall' }}
            background={
              activeView === 'borrow' ? 'background-front' : undefined
            }
            elevation={activeView === 'borrow' ? 'small' : undefined}
            onClick={() => setActiveView('borrow')}
          >
            <Text size="xsmall"> Borrow view </Text>
          </Box>
          <Box
            round="xsmall"
            pad={{ horizontal: 'large', vertical: 'xxsmall' }}
            background={activeView === 'lend' ? 'background-front' : undefined}
            elevation={activeView === 'lend' ? 'small' : undefined}
            onClick={() => setActiveView('lend')}
          >
            <Text size="xsmall"> Lend view </Text>
          </Box>
        </Box>
      </Box>

      {activeView === 'borrow' && <DashBorrow />}
      {activeView === 'lend' && <DashLend />}
    </>

  );
};

export default Dashboard;
