import React, { useState, useContext } from 'react';
import moment from 'moment';
import { Box, Text, ThemeContext, ResponsiveContext, Button } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import { IYieldSeries } from '../types';

interface IAprBadgeProps {
  activeView: string;
  series: IYieldSeries;
}

function AprBadge({ activeView, series }:IAprBadgeProps) {
  const [ seriesApr, setSeriesApr ] = useState<string>(`${series.yieldAPR_} %`);
  const [ seriesMature, setSeriesMature ] = useState<boolean>(false);

  /* Set Series description/display name */
  React.useEffect(()=>{
    setSeriesApr(moment(series.maturity*1000).format('MMM \'YY'));
    Number.isFinite(parseFloat(series.yieldAPR_||'')) && 
      ( async () => setSeriesApr( `${series.yieldAPR_} %`) )();
    setSeriesMature(series.isMature);
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
      >
        <Text size='xxsmall'>
          Matured        
        </Text>
      </Box>}

      { seriesMature === false &&
      <Box 
        background={series.seriesColor}
        round='xlarge'  
        pad={{ horizontal:'small', vertical:'none' }} 
        align='center'
        justify='center'
      >
        <Text size='xxsmall'> { seriesApr } </Text>  
      </Box>}

      {/* { seriesMature === false && 
          activeView !== 'borrow' &&
          <Box 
            round
            border='all'
            direction='row'
            pad={{ horizontal:'small', vertical:'none' }}
            align='center'
            background='orange'
          >
            <Text size='xxsmall'>
              Unavailable      
            </Text>
          </Box>} */}

    </>
  );
}

export default AprBadge;
