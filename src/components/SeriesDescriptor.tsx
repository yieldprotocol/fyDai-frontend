import React, { useState, useContext } from 'react';
import { Box, Text, ResponsiveContext, Collapsible } from 'grommet';
import { FiLayers as ChangeSeries } from 'react-icons/fi';

import { modColor } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';

import SeriesSelector from './SeriesSelector';
import AprBadge from './AprBadge';
import RaisedButton from './RaisedButton';

interface ISeriesDescriptorProps {
  activeView: string;
  children?:any;
}

function SeriesDescriptor( props: ISeriesDescriptorProps ) {

  const { activeView, children } = props;
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 
  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);

  return (
    <>
      {selectorOpen && <SeriesSelector activeView={activeView} close={()=>setSelectorOpen(false)} /> }
      {activeSeries &&
        <Box
          alignSelf="center"
          fill
          round='small'
          gap='small'
          pad={{ bottom:'small' }}
          background={`linear-gradient(to bottom right, 
          ${modColor( '#add8e6', -40)}, 
          ${modColor( '#add8e6', -20)},
          ${modColor( '#add8e6', 10)},
          ${modColor( '#add8e6', 0)},
          ${modColor( activeSeries?.seriesColor, 50)}, 
          ${modColor( activeSeries?.seriesColor, 50)}, 
          ${modColor( activeSeries?.seriesColor, 50)}, 
          ${modColor( activeSeries?.seriesColor, 50)},
          ${modColor( activeSeries?.seriesColor, 50)}, 
          ${modColor( activeSeries?.seriesColor, 0)}, 
          ${modColor( activeSeries?.seriesColor, 0)})`}
          margin={{ bottom:'-18px' }}
        >
          <Box
            pad='small'   
          >
            <Box
              direction='row-responsive'
              fill='horizontal'
              gap='small'
              align='center'
              pad={{ vertical:'small' }}
              style={{ position:'sticky', top:0 }}
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
                  align='center'
                >         
                  <AprBadge activeView={activeView} series={activeSeries} animate />
                  <Text size='large' weight='bold' color={activeSeries?.seriesTextColor}>            
                    { mobile? activeSeries?.displayNameMobile : activeSeries?.displayName }
                  </Text>
                </Box>}

                <RaisedButton
                  background={modColor( activeSeries?.seriesColor, 50)}
                  label={(!mobile ) ?        
                    <Box align='center' direction='row' gap='small' pad='xsmall'>
                      <Text size='xsmall' color={activeSeries?.seriesTextColor}> <ChangeSeries /> </Text>
                      <Text size='xsmall' color={activeSeries?.seriesTextColor}>
                        Change Series              
                      </Text>
                    </Box>
                    : 
                    <Box align='center' direction='row' gap='small' pad='xsmall'>
                      <ChangeSeries /> Change 
                    </Box>}
                  onClick={()=>setSelectorOpen(true)}
                />
              </Box>
            </Box>

            <Box
              pad={{ horizontal:'medium' }}
            >
              <Collapsible open={seriesState && !seriesState.seriesLoading}>
                { children }
              </Collapsible>
            </Box>
          </Box>     
        </Box>}
    </>
  );
}

SeriesDescriptor.defaultProps={ children:null };

export default SeriesDescriptor; 
