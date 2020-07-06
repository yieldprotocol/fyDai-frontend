import React from 'react';
import { Box, Button, Image, Heading, Text } from 'grommet';

import logoLight from '../assets/images/logo_light.svg';
import { useMaker } from '../hooks/makerHooks';

import DashBorrow from '../components/DashBorrow';
import DashLend from '../components/DashLend';

const Dashboard = () => {

  const { getVaults, openNewVault } = useMaker();

  const [activeView, setActiveView] = React.useState<string>('borrow');

  return (
    <Box gap='small' pad={{ vertical:'large', horizontal:'small' }} fill='horizontal' justify='between'>
      
      <Box direction='row' fill='horizontal' pad={{ bottom:'large', horizontal:'none' }} justify='between' align='center'>
        <Box>
          <Box direction='row' gap='small'>
            <Heading level='3' margin='none'>Your</Heading>
            {/* <Heading level='3' margin='none' onClick={()=>(activeView==='borrow')? setActiveView('lend'):setActiveView('borrow')}><a>{activeView}</a></Heading> */}
            <Heading level='3' margin='none'>dashboard</Heading>
          </Box>
          <Box direction='row'> 
            <Text size='xsmall' color='text-weak' >
              Dashboard description · Learn more
            </Text>
          </Box>
        </Box>

        <Box direction='row' gap='small' pad='small'>
          <Button primary label='Tip: Convert your Maker Vault' />
          <Button label='View more tips' />
        </Box>
      </Box>

      <Box direction='row' pad={{ bottom :'large' }}>
        <Box round='xsmall' direction='row' background='brand-transparent' pad='xxsmall' gap='small'> 
          <Box 
            round='xsmall'
            pad={{ horizontal:'large', vertical:'xxsmall' }}
            background={(activeView === 'borrow')? 'background-front' : undefined}
            elevation={(activeView === 'borrow')? 'small' : undefined}
            onClick={()=>setActiveView('borrow')}
          >
            <Text size='xsmall'> Borrow view </Text>
          </Box>
          <Box 
            round='xsmall'
            pad={{ horizontal:'large', vertical:'xxsmall' }}
            background={(activeView === 'lend') ? 'background-front' : undefined}
            elevation={(activeView === 'lend')? 'small' : undefined}
            onClick={()=>setActiveView('lend')}
          >
            <Text size='xsmall'> Lend view </Text>
          </Box>
        </Box>
      </Box>

      { activeView === 'borrow' && <DashBorrow /> }
      { activeView === 'lend' && <DashLend /> }
    </Box>
  );
};

export default Dashboard;
