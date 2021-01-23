import React, { useState, useContext } from 'react';
import { Box, Text, ResponsiveContext } from 'grommet';
import { FiLayers as ChangeSeries } from 'react-icons/fi';

import { modColor, buildGradient } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';

import SeriesSelector from './SeriesSelector';
import AprBadge from './AprBadge';
import RaisedButton from './RaisedButton';
import FlatButton from './FlatButton';

interface ISeriesDescriptorProps {
  activeView: string;
  children?:any;
  minimized?:boolean;
}

function SeriesDescriptor( props: ISeriesDescriptorProps ) {

  const { activeView, children, minimized } = props;
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const { state: { activeSeriesId, seriesData } } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  
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
          pad={minimized? { bottom:'medium' }: { bottom:'large' }}
          background={
            buildGradient( 
              activeSeries?.seriesFromColor, 
              (activeSeries?.seriesToColor || activeSeries?.seriesColor)
            )
          }
          margin={{ bottom:'-18px' }}
        >
          <Box
            // pad={minimized? { bottom:'small', horizontal:'small' }: 'small'}
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
                  <Text size='xlarge' weight='bold' color={activeSeries?.seriesTextColor}>            
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
                      <ChangeSeries />
                      <Text size='xsmall' color={activeSeries?.seriesTextColor}>
                        Change          
                      </Text>
                    </Box>}
                  onClick={()=>setSelectorOpen(true)}
                />

                {/* {minimized && <FlatButton
                  background={modColor( activeSeries?.seriesColor, 50)}
                  label={(!mobile ) ?        
                    <Box align='center' direction='row' gap='small'>
                      <Text size='xsmall' color={activeSeries?.seriesTextColor}> <ChangeSeries /> </Text>
                      <Text size='xsmall' color={activeSeries?.seriesTextColor}>
                        Change Series              
                      </Text>
                    </Box>
                    : 
                    <Box align='center' direction='row' gap='small'>
                      <ChangeSeries />
                      <Text size='xsmall' color={activeSeries?.seriesTextColor}>
                        Change          
                      </Text>
                    </Box>}
                  onClick={()=>setSelectorOpen(true)}
                />}  */}

              </Box>
            </Box>

            <Box
              pad={{ horizontal:'medium' }}
            >
              { children }
            </Box>
          </Box>     
        </Box>}
    </>
  );
}

SeriesDescriptor.defaultProps={ children:null, minimized:false };

export default SeriesDescriptor; 
