import React from 'react';
import { Box, DropButton, Stack, Text } from 'grommet';
import moment from 'moment';

import { FaEllipsisV as EllipseV } from 'react-icons/fa';

import { IYieldSeries } from '../types';

type YieldSeriesProps = {
  series: IYieldSeries,
  seriesAction: any,
};

function YieldSeries({ series, seriesAction }:YieldSeriesProps) {
  const {
    maturityDate:date,
    interestRate:interest,
    currentValue:value,
    balance,
    debt
  } = series;

  return (
    <Stack anchor='top-right'>
      <Box
        onClick={()=>seriesAction()}
        pad={{ horizontal:'medium', bottom:'small', top:'small' }}
        elevation='xsmall'
        margin='xsmall'
        align='center'
        justify='between'
        direction='row'
        hoverIndicator={{ color:'lightgrey' }}
        round="small"
      >
        <Box>
          <Text weight='bold'> yDai-{moment(date).format('MMYY')}</Text>
        </Box>

        <Box direction='column'>
          <Box direction='row' gap='xsmall' wrap={false}> <Text size='xsmall'>Matures: </Text><Text size='xsmall' weight='bold'> {moment(date).format('MMM YYYY')}</Text></Box>
          <Box direction='row' gap='xsmall' wrap={false}> <Text size='xsmall'>Current value:</Text> <Text size='xsmall' weight='bold'>{`${value} DAI`}</Text></Box>
        </Box>
        {/* <Box round pad='xsmall' background='graph-1'> <Text size='xsmall'>{interest}%</Text></Box>
         <Box> {moment(date).format('MMM YYYY')} </Box>
        <Box> {`${value} DAI`}</Box> */}

        {/* <DropButton
        color='background-front'
        label={<Box pad='xsmall' direction='row' gap='xsmall' align='center'><EllipseV color='lightgrey' /></Box>}
        dropAlign={{ top: 'bottom', right: 'right' }}
        dropContent={
          <Box pad="medium" background="light-2">
            Series Actions go here...
          </Box>
         }
      /> */}
      </Box>
      <Box round pad={{ horizontal:'xsmall', vertical:'none' }} background='brand'>
        <Text size='xsmall'> {interest}%</Text>
      </Box>
    
    </Stack>
  );
}

export default YieldSeries;
