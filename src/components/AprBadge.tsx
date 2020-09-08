import React, { useState, useContext } from 'react';
import moment from 'moment';
import { Box, Text, ThemeContext, ResponsiveContext, Button } from 'grommet';

import {
  FiClock as Clock,
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';

interface IAprBadgeProps {
  activeView: string;
  series: IYieldSeries;
}

function AprBadge({ activeView, series }:IAprBadgeProps) {
  const [ seriesApr, setSeriesApr ] = useState<string>(`${series.yieldAPR_} %`);
  const [ seriesMature, setSeriesMature ] = useState<boolean>(series.isMature());

  /* Set Series description/display name */
  React.useEffect(()=>{
    setSeriesMature(series.isMature());
    setSeriesApr(moment(series.maturity*1000).format('MMM \'YY'));
    series.poolState?.active && ( async () => setSeriesApr( `${series.yieldAPR_} %`) )(); 
  }, [ series ]);

  return (
    <>
      { seriesMature === true &&      
      <Box 
        round
        border='all'
        direction='row'
        pad={{ horizontal:'small', vertical:'none' }}
        align='center'
        gap='small'
      >
        <Clock />
        <Text size='xxsmall'>  
          Mature       
        </Text>
      </Box>}

      { seriesMature === false && 
        series.poolState?.active === true && 
        <Box 
          background={series.seriesColor}
          round='xlarge'  
          pad={{ horizontal:'small', vertical:'none' }} 
          align='center'
          justify='center'
        >
          <Text size='xxsmall'> { seriesApr } </Text>  
        </Box>}

      { seriesMature === false &&
        series.poolState?.active === false &&
          <Box 
            round
            border='all'
            direction='row'
            pad={{ horizontal:'xsmall', vertical:'none' }}
            align='center'
            background='orange'
            gap='xsmall'
          >
            <Warning />       
            <Text size='xxsmall'>
              {series.poolState.reason} 
            </Text>
          </Box>}
    </>
  );
}

export default AprBadge;
