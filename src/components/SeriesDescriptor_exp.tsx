import React, { useState, useContext } from 'react';
import { Box, Text, ThemeContext, ResponsiveContext, Button } from 'grommet';

import { FiLayers as ChangeSeries } from 'react-icons/fi';

import { SeriesContext } from '../contexts/SeriesContext';

import SeriesSelector from './SeriesSelector';
import AprBadge from './AprBadge';
import Authorization from './Authorization';
import Loading from './Loading';

interface ISeriesDescriptorProps {
  activeView: string;
  minified?: boolean;
  children?:any;
}

function SeriesDescriptor( props: ISeriesDescriptorProps ) {

  const { activeView, minified, children } = props;

  const theme:any = useContext(ThemeContext);
  const screenSize = useContext(ResponsiveContext);

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 

  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);

  return (

    <>
    {selectorOpen && <SeriesSelector activeView={activeView} close={()=>setSelectorOpen(false)} /> }


    <Box
      alignSelf="center"
      fill
      background={activeSeries && `${activeSeries.seriesColor}35`}
      round='small'
      pad={{horizontal:'large', top:'large'}}
      gap='medium'
    >
      {selectorOpen && <SeriesSelector activeView={activeView} close={()=>setSelectorOpen(false)} /> }
      <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text> 
      <Box
        direction='row-responsive'
        fill='horizontal'
        gap='small'
        align='center'
      >
        <Box 
          round='xsmall'
          // background='background-mid'
          background={activeSeries && `${activeSeries.seriesColor}25`}   
          border='all'
          onClick={()=>setSelectorOpen(true)}
          direction='row'
          fill
          pad='small'
          flex
          justify='between'
        >
          <Loading condition={!activeSeries} size='small'>
            {activeSeries &&
            <Box 
              direction='row' 
              gap='small'         
            >             
              <AprBadge activeView={activeView} series={activeSeries} />
              <Text color='brand' size='large'>            
                { activeSeries?.displayName }
              </Text>
            </Box>}
          </Loading>

          <Button
            color='brand-transparent'
            label={(screenSize !== 'small' ) ?
            
              <Box align='center' direction='row' gap='small'>
                <ChangeSeries />
                <Text size='xsmall' color='brand'>
                  Change Series              
                </Text>
              </Box>
              : 
              <Box align='center'>
                <ChangeSeries />
              </Box>}
            onClick={()=>setSelectorOpen(true)}
            hoverIndicator='brand-transparent'
          />
        </Box>

      </Box>

      { !(activeSeries?.isMature()) &&  activeSeries?.hasDelegatedPool === false && 
      <Box 
        fill='horizontal'
        margin={{ vertical:'small' }}
      >
        <Box 
          round='xsmall'
          border='all'
          pad='small' 
          fill
        >
          <Authorization series={activeSeries} />
        </Box>
      </Box>} 
         
      { children }
    </Box>
    </>
  );
}

SeriesDescriptor.defaultProps={ minified:false, children:null };

export default SeriesDescriptor; 
