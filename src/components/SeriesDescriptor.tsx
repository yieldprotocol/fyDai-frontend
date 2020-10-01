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
  children?:any;
}

function SeriesDescriptor( props: ISeriesDescriptorProps ) {

  const { activeView, children } = props;
  const screenSize = useContext(ResponsiveContext);
  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 
  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);
  const [ delegated, setDelegated ] = useState<boolean>(true);


  useEffect(()=>{
    activeSeries && setDelegated(activeSeries.hasDelegatedPool);
  }, [ activeSeries ]);

  return (
    <>
      {selectorOpen && <SeriesSelector activeView={activeView} close={()=>setSelectorOpen(false)} /> }

      {activeSeries &&
        <Box
          alignSelf="center"
          fill
          round='small'
          pad='small'
          gap='small'
        // background=${modColor( activeSeries?.seriesColor, 30)}
          background={`linear-gradient(to bottom right, 
          ${modColor( '#add8e6', -40)}, 
          ${modColor( '#add8e6', -20)},
          ${modColor( '#add8e6', 10)},
          ${modColor( '#add8e6', 0)},
          ${modColor( activeSeries?.seriesColor, 40)}, 
          ${modColor( activeSeries?.seriesColor, 40)}, 
          ${modColor( activeSeries?.seriesColor, 40)}, 
          ${modColor( activeSeries?.seriesColor, 40)}, 
          ${modColor( activeSeries?.seriesColor, 0)}, 
          ${modColor( activeSeries?.seriesColor, 0)})`}
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
                <Text size='large' weight='bold' color={activeSeries?.seriesTextColor}>            
                  { activeSeries?.displayName }
                </Text>
              </Box>}

              <RaisedButton
                background={modColor( activeSeries?.seriesColor, 40)}
                label={(screenSize !== 'small' ) ?        
                  <Box align='center' direction='row' gap='small'>
                    <Text size='xsmall' color={activeSeries?.seriesTextColor}> <ChangeSeries /> </Text>
                    <Text size='xsmall' color={activeSeries?.seriesTextColor}>
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
            pad={!delegated? { horizontal:'medium' }: { horizontal:'medium', bottom:'medium' }}
          >
            <Collapsible open={seriesState && !seriesState.seriesLoading}>
              { children }
            </Collapsible>

            { !delegated && !activeSeries.isMature() && 
            <Box 
              fill='horizontal'
              round='small'
              pad={{ vertical:'medium' }}        
            >
              <Box 
                round='small'
                fill
              >
                <Authorization series={activeSeries} />
              </Box>
            </Box>} 
          </Box>
   
        </Box>}
    </>
  );
}

SeriesDescriptor.defaultProps={ children:null };

export default SeriesDescriptor; 
