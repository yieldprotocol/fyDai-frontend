import React from 'react';
import { Box, Tabs, Tab, Text } from 'grommet';
import Series from './x_Series';
import Positions from './x_Positions';
import { PositionsContext } from '../contexts/PositionsContext';


const Borrow = () => {

  const [indexTab, setIndexTab] = React.useState<number>(0);
  const onActiveTab = (nextIndex: any) => setIndexTab(nextIndex);

  const { state: posState } = React.useContext(PositionsContext);

  return (
    <Box
      pad={{ horizontal:'medium', vertical:'none' }}
      style={{ maxWidth:'600px', minWidth:'300px' }}
      round='medium'
      fill
    >
      <Tabs 
        justify='start'
        flex={true}
        activeIndex={indexTab}
        onActive={onActiveTab}
      >
        <Tab 
          title={
            <Box pad='none' align='center'>
              <Text size='small' weight={indexTab===0?'bold':'normal'}>Current Series</Text>
            </Box>
            }
        >
          <Series />
        </Tab>
        <Tab
          title={
            <Box 
              gap='xsmall'
              direction='row'
            >
              <Text size='small' weight={indexTab===1?'bold':'normal'}>Positions</Text>
              {/* <Heading margin='none' level='6'>Positions</Heading> */}
              { posState.positionsIndicator > 0 &&
              <Box
                background="brand"
                pad={{ horizontal: 'small', vertical:'none' }}
                align='center'
                round
              >
                <Text>{posState.positionsIndicator}</Text>
              </Box>}
            </Box>
            }
        >
          <Positions />
        </Tab>
        {/* <Tab
          disabled
          title={
            <Box
              gap='xsmall'
              direction='row'
            >
              <YieldLeaf /><Text margin='none' weight={(indexTab===2?'bold':'normal')}>Yield Market</Text>
            </Box>
            }
        >
          <Box 
            pad="medium" 
            border={{ side:'all', color:'lightgreen' }}
            round
            gap='large'
          >  Market 
          </Box>
        </Tab> */}

      </Tabs>
    </Box>
  );
};

export default Borrow;