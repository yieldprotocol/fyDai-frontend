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
  //   <Stack anchor='top-right'>
  //   <Box
  //     onClick={()=>seriesAction()}
  //     pad={{ horizontal:'medium', bottom:'small', top:'small' }}
  //     elevation='xsmall'
  //     margin='xsmall'
  //     align='center'
  //     justify='between'
  //     direction='row'
  //     hoverIndicator={{ color:'lightgrey' }}
  //     round="small"
  //   >
  //     <Box>
  //       <Text weight='bold'> yDai-{moment(date).format('MMYY')}</Text>
  //     </Box>

  //     <Box direction='column'>
  //       <Box direction='row' gap='xsmall' wrap={false}> <Text size='xsmall'>Matures: </Text><Text size='xsmall' weight='bold'> {moment(date).format('MMM YYYY')}</Text></Box>
  //       <Box direction='row' gap='xsmall' wrap={false}> <Text size='xsmall'>Current value:</Text> <Text size='xsmall' weight='bold'>{`${value} DAI`}</Text></Box>
  //     </Box>

  //   </Box>
  //   <Box round pad={{ horizontal:'xsmall', vertical:'none' }} background='brand'>
  //     <Text size='xsmall'> {interest}%</Text>
  //   </Box>
  // </Stack>
    <>
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
        <Box direction='column'>
          <Text weight='bold'> yDai-{moment(date).format('MMYY')}</Text>
          <Box round align='center' pad={{ horizontal:'small', vertical:'none' }} background='brand'>
            <Text size='xsmall'> {interest}%</Text>
          </Box>
          {/* <Box direction='row' gap='xsmall'> */}
            
          {/* </Box> */}
        </Box>

        <Box direction='column'>
          <Box direction='row' gap='xsmall'> <Text size='xsmall'>Matures: </Text><Text size='xsmall' weight='bold'> {moment(date).format('MMM YYYY')}</Text></Box>
          <Box direction='row' gap='xsmall'> <Text size='xsmall'>Current value:</Text> <Text size='xsmall' weight='bold'>{`${value} DAI`}</Text></Box>
        </Box>

      </Box>
    </>
  );
}

export default YieldSeries;
