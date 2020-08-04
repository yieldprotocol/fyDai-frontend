import React from 'react';
import  {Box, Text } from 'grommet';

interface HistoryProps {
  txHistory: any;
  isLoading: boolean;
}

const History = ( { txHistory, isLoading }:HistoryProps) => {
  return (
    <Box
      background='background-front'
      fill='horizontal'
      round='small'
      pad='none'
      border
    >
      <Box 
        direction='row'
        gap='xsmall'
        justify='between'
        background='background-mid'
        pad='small'
        round={{ size:'small', corner:'top' }}
        overflow='auto'
      >
        <Box basis='2/5'><Text color='text-weak' size='xsmall'>TRANSACTION</Text></Box>
        <Box><Text color='text-weak' size='xsmall'>AMOUNT</Text></Box>
        <Box><Text color='text-weak' size='xsmall'>DATE</Text></Box>
        <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box>
      </Box>

      { txHistory.length > 0 ? txHistory.map((x:any, i:number)=>{
        const key_ = i;
        return (
          <Box
            pad='small'
            direction='row'
            gap='xsmall'
            key={key_}
            justify='between'
            hoverIndicator='background-mid'
            onClick={()=>console.log('click')}
          >
            <Box basis='2/5'><Text>{x.event}</Text> </Box>
            <Box><Text> {x.amount} </Text></Box>
            <Box><Text> {x.date} </Text></Box>
            <Box><Text> : </Text></Box>
          </Box>
        );
      }):
      <Box align='center'>
        { !isLoading ? 
          <Text>Loading...</Text> 
          : 
          <Text> No history</Text> } 
      </Box>}
    </Box>
  );
};

export default History;
