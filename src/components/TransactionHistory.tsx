import React from 'react';
import { Box, Collapsible, Text } from 'grommet';

import { IYieldSeries } from '../types';

interface TransactionHistoryProps {
  activeSeries: IYieldSeries,
  fixedOpen: boolean
}

const TransactionHistory = ({ activeSeries, fixedOpen }:TransactionHistoryProps) => {
  const [historyOpen, setHistoryOpen] = React.useState<boolean>(false);
  return (
    <Box 
      elevation={historyOpen?'xsmall':'none'}
      fill='horizontal'
      background='background'
      pad='medium'
    >
      <Box 
        direction='row'
        justify='between'
        onClick={()=>setHistoryOpen(!historyOpen)}
      > 
        <Box direction='row' align='baseline' gap='small'>
          <Text weight='bold'>Transaction History (0)</Text>
          {/* <Text size='10px'> at an interest rate of <Text weight='bold' size='10px'>{' 3.86%'}</Text> </Text> */}
        </Box>
      </Box>
      <Collapsible open={historyOpen}>
        <Box pad='small'>
          <div>No history yet. </div>
        </Box>
      </Collapsible>
    </Box>
  );
};

export default TransactionHistory;
