import React, { useState, useContext } from 'react';
import moment from 'moment';
import { Box, Text, ThemeContext, ResponsiveContext, Button } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';

function AprBadge({ activeView }:any) {

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 

  const [ seriesApr, setSeriesApr ] = useState<string>(activeSeries && `${activeSeries.yieldAPR_} %`);

  /* Set Series description/display name */
  React.useEffect(()=>{
    activeSeries && setSeriesApr(moment(activeSeries.maturity*1000).format('MMM \'YY'));
    activeSeries && Number.isFinite(parseFloat(activeSeries.yieldAPR_)) && 
      ( async () => setSeriesApr( `${activeSeries.yieldAPR_} %`) )();
  }, [ activeSeries ]);

  return (
    <>
      {Number.isFinite(parseFloat(activeSeries.yieldAPR_)) && 
        ( activeSeries?.isMature === false ?         
          <Box 
            background={activeSeries.seriesColor}
            round='xlarge'  
            pad={{ horizontal:'small' }} 
            align='center'
            justify='center'
          >
            <Text size='xxsmall'> { seriesApr } </Text>  
          </Box> :
          <Box 
            round
            border='all'
            direction='row'
            pad={{ horizontal:'small' }}
            align='center'
          >
            <Text size='xxsmall'>
              Matured        
            </Text>
          </Box>)} 

      { activeSeries?.isMature === false && 
        activeView === 'borrow' && 
        !Number.isFinite(parseFloat(activeSeries.yieldAPR_)) &&                  
        <Box 
          round
          border='all'
          direction='row'
          pad={{ horizontal:'small' }}
          align='center'
          background='orange'
        >
          <Text size='xxsmall'>
            Temporarily unavailable           
          </Text>
        </Box>}  
    </>
  );
}

export default AprBadge;
