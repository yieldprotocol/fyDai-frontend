import React, { useContext, useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Box, ResponsiveContext, Text } from 'grommet';

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
  
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const [ seriesApr, setSeriesApr ] = useState<string>(`${series.yieldAPR_} %`);
  const [ seriesMature, setSeriesMature ] = useState<boolean>(series.isMature());

  /* Set Series description/display name */
  useEffect(()=>{
    setSeriesMature(series.isMature());
    setSeriesApr( format( subDays( new Date(series.maturity), 2), 'MMM \'YY'));
    series.poolState?.active && ( async () => setSeriesApr( `${series.yieldAPR_} %`) )(); 
  }, [ series ]);

  return (
    <>
      { 
      seriesMature === true &&    
        <Box>
          <Box 
            background={series.seriesColor}
            round='large'  
            align='center'
            justify='center'
            animation={animate ? { type:'zoomIn', duration:1000, size:'xlarge' } : undefined}
            pad={{ horizontal:'small', vertical:'xsmall' }}
            direction='row'
            height={{ min:'1em' }}
          >
            <Loading condition={!seriesApr} size='xxsmall'>
              <Text size='xxsmall' color={series?.seriesTextColor}> {!mobile &&  <Clock />} Mature </Text>   
            </Loading>
          </Box>
        </Box>
      }

      { 
      seriesMature === false && 
      series.poolState?.active === true && 
      <Box>
        <Box 
          height={{ min:'1em' }}
          background={series.seriesColor}
          round='large'  
          align='center'
          justify='center'
          animation={animate ? { type:'zoomIn', duration:1000, size:'xlarge' } : undefined}
          pad={{ horizontal:'small', vertical:'xsmall' }}
          direction='row'
        >
          <Loading condition={!seriesApr} size='xsmall'>
            <Text 
              size={mobile?'xxsmall':'xsmall'} 
              color={series?.seriesTextColor}
            > 
              { activeView==='pool'? 
                format( subDays( new Date(series.maturity*1000), 2), 'MMM yy')
                : seriesApr } 
            </Text> 
          </Loading>
        </Box>
      </Box>
      }

      { 
      seriesMature === false &&
      series.poolState?.active === false &&
      <Box>
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
        </Box>
      </Box>
      }
    </>
  );
}

AprBadge.defaultProps={ animate:false };

export default AprBadge;
