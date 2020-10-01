import React, { useState, useContext, useEffect } from 'react';
import moment from 'moment';
import { Box, Text } from 'grommet';

import {
  FiClock as Clock,
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';
import Loading from './Loading';

interface IAprBadgeProps {
  activeView: string;
  series: IYieldSeries;
  animate?: boolean;
}

function AprBadge({ activeView, series, animate }:IAprBadgeProps) {
  const [ seriesApr, setSeriesApr ] = useState<string>(`${series.yieldAPR_} %`);
  const [ seriesMature, setSeriesMature ] = useState<boolean>(series.isMature());

  /* Set Series description/display name */
  useEffect(()=>{
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
        background={series.seriesColor}
      >
        <Text size='xsmall' color={series?.seriesTextColor}>
          <Clock />
        </Text>
        <Text size='xsmall' color={series?.seriesTextColor}>  
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
          animation={animate ? { type:'zoomIn', duration:1000, size:'xlarge' } : undefined} 
        >
          <Loading condition={!seriesApr} size='xsmall'>
            <Text size='xsmall' color={series?.seriesTextColor}> { seriesApr } </Text>  
          </Loading>
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
            <Text size='xxsmall' color={series?.seriesTextColor}>
              {series.poolState.reason} 
            </Text>
          </Box>}
    </>
  );
}

AprBadge.defaultProps={ animate:false };

export default AprBadge;
