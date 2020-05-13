import React from 'react';
import { Box, DropButton } from 'grommet';
import moment from 'moment';

import { FaEllipsisV as EllipseV } from 'react-icons/fa';

import { IYieldSeries } from '../types';

function YieldSeries(props:IYieldSeries) {

  const {
    maturityDate:date,
    interestRate:interest,
    currentValue:value,
    balance,
    debt
  } = props;

  return (
    <Box 
      justify='between'
      direction='row'
      // hoverIndicator={{ color:'background' }}
    >
      <Box
        onClick={()=>alert(`${date} ${interest}`)}
        pad={{ horizontal:'small', vertical:'small' }}
        margin='xsmall'
        align='center'
        justify='between'
        fill='horizontal'
        direction='row'
        hoverIndicator={{ color:'lightgrey' }}
        round
      > 
        <Box> {moment(date).format('MMM YYYY')} </Box>
        <Box round pad='xsmall' background='orange'> {interest}%</Box>
        <Box> {`${value} DAI`}</Box>
        <Box> {balance}</Box>
        <Box>
          <Box> {debt} </Box>
        </Box>
      </Box>
      <Box
        pad='xsmall'
        margin='xsmall'
      >
        <DropButton
          color='background-front'
          label={<Box pad='xsmall' direction='row' gap='xsmall' align='center'><EllipseV color='lightgrey' /></Box>}
          dropAlign={{ top: 'bottom', right: 'right' }}
          dropContent={
            <Box pad="medium" background="light-2">
              Series Actions go here...
            </Box>
         }
        />

        {/* <DropButton
          // dropAlign={{ 'top': 'bottom', 'right': 'left' }}
          icon={<EllipseV color='lightgrey' />}
          dropContent={<Box pad="xsmall" background="light-2">
              do something
          </Box>}
        /> */}
      </Box>
    </Box>
  );
}

export default YieldSeries;
