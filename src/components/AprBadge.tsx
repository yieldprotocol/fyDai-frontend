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

  // const { state: seriesState } = useContext(SeriesContext);
  // const { activeSeries } = seriesState;

  const [ seriesApr, setSeriesApr ] = useState<string>(`${series.yieldAPR_} %`);

  /* Set Series description/display name */
  React.useEffect(()=>{
    setSeriesApr(moment(series.maturity*1000).format('MMM \'YY'));
    Number.isFinite(parseFloat(series.yieldAPR_||'')) && 
      ( async () => setSeriesApr( `${series.yieldAPR_} %`) )();
  }, [ series ]);

  return (
    <>
      {Number.isFinite(parseFloat(series.yieldAPR_||'')) && 
        ( series?.isMature === false ?         
          <Box 
            background={series.seriesColor}
            round='xlarge'  
            pad={{ horizontal:'small', vertical:'none' }} 
            align='center'
            justify='center'
          >
            <Text size='xxsmall'> { seriesApr } </Text>  
          </Box> :
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
          </Box>)}

      { series?.isMature === false && 
        activeView === 'borrow' && 
        !Number.isFinite(parseFloat(series.yieldAPR_||'')) &&                  
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
        </Box>}  
    </>
  );
}

export default AprBadge;
