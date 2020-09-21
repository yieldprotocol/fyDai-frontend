import React, { useState, useContext, useEffect } from 'react';
import { Box, Text, ThemeContext, ResponsiveContext, Button, Collapsible } from 'grommet';

import { FiLayers as ChangeSeries } from 'react-icons/fi';
import { modColor, invertColor, contrastColor } from '../utils';


import { SeriesContext } from '../contexts/SeriesContext';

import SeriesSelector from './SeriesSelector';
import AprBadge from './AprBadge';
import Authorization from './Authorization';
import Loading from './Loading';
import RaisedButton from './RaisedButton';

interface ISeriesDescriptorProps {
  activeView: string;
  minified?: boolean;
  children?:any;
}

function SeriesDescriptor( props: ISeriesDescriptorProps ) {

  const { activeView, minified, children } = props;

  const screenSize = useContext(ResponsiveContext);

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 

  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);

  return (
    <>
      {selectorOpen && <SeriesSelector activeView={activeView} close={()=>setSelectorOpen(false)} /> }
      {/* { activeSeries && */}

      <Loading condition={!activeSeries} size='small'>
      
        {activeSeries &&
        <Box
          alignSelf="center"
          fill
        // round={{ corner:'top', size:'small' }}
        // pad={{ horizontal:'small' }}
          round='small'
          pad='small'
          gap='small'
        // background=${modColor( activeSeries?.seriesColor, 30)}
          background={`linear-gradient(to right, 
          ${modColor( activeSeries?.seriesColor, -40)}, 
          ${modColor( activeSeries?.seriesColor, -10)}, 
          ${modColor( activeSeries?.seriesColor, 10)}, 
          ${modColor( activeSeries?.seriesColor, 40)}, 
          ${modColor( activeSeries?.seriesColor, 40)})`}
          margin={{ bottom:'-16px' }}
        >

          {/* <Text alignSelf='start' size='xlarge' color='text' weight='bold'>Selected series</Text> */}
          <Box
            direction='row-responsive'
            fill='horizontal'
            gap='small'
            align='center'
          >
            <Box 
              round='xsmall'
            // background='background-mid'
            // border='all'
              onClick={()=>setSelectorOpen(true)}
              direction='row'
              fill
              pad='small'
              flex
              justify='between'
            >
            
              {activeSeries &&
              <Box 
                direction='row' 
                gap='small'
              >             
                <AprBadge activeView={activeView} series={activeSeries} animate />
                <Text size='xlarge' weight='bold'>            
                  { activeSeries?.displayName }
                </Text>
              </Box>}

              <RaisedButton
                background={modColor( activeSeries?.seriesColor, 40)}
                label={(screenSize !== 'small' ) ?        
                  <Box align='center' direction='row' gap='small'>
                    <ChangeSeries />
                    <Text size='xsmall'>
                      Change Series              
                    </Text>
                  </Box>
                  : 
                  <Box align='center'>
                    <ChangeSeries />
                  </Box>}
                onClick={()=>setSelectorOpen(true)}
              />
            </Box>
          </Box>

          <Box
            pad={{ horizontal:'medium', bottom:'large' }}
          >
            <Collapsible open={!seriesState.seriesLoading}>
              { children }
            </Collapsible>

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

          </Box>       
        </Box>}
      </Loading>
    </>
  );
}

SeriesDescriptor.defaultProps={ minified:false, children:null };

export default SeriesDescriptor; 
