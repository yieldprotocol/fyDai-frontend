import React, { useState, useContext } from 'react';
import { Box, Text, ThemeContext, ResponsiveContext, Button, Stack } from 'grommet';

import { FiLayers as ChangeSeries } from 'react-icons/fi';

import { ScaleLoader } from 'react-spinners';
import { SeriesContext } from '../contexts/SeriesContext';

import SeriesSelector from './SeriesSelector';
import Loading from './Loading';
import AprBadge from './AprBadge';

interface ISeriesDescriptorProps {
  activeView: string;
  minified?: boolean;  
}

function SeriesDescriptor( props: ISeriesDescriptorProps, children:any) {

  const { activeView, minified } = props;

  const theme:any = React.useContext(ThemeContext);
  const screenSize = React.useContext(ResponsiveContext);

  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 

  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);

  return (
    <>
      {selectorOpen && <SeriesSelector activeView={activeView} close={()=>setSelectorOpen(false)} /> }
      <Box
        direction='row-responsive'
        fill='horizontal'
        gap='small'
        align='center'
      >
        <Box 
          round='xsmall'
          background='background-mid'
          border='all'
          onClick={()=>setSelectorOpen(true)}
        // hoverIndicator='brand'
          direction='row'
          fill
          pad='small'
          flex
          justify='between'
        >
          { !activeSeries ? 
            <ScaleLoader color={theme?.global?.colors['brand-transparent'].dark} height='13' /> :
            <Box direction='row' gap='small'> 
              
              <AprBadge activeView={activeView} />

              <Text color='brand' size='large'>            
                { activeSeries.displayName }
              </Text>

              {/* { activeSeries?.isMature === false && 
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
                      Limited Liquidity            
                    </Text>
                  </Box>}            */}
            </Box>}

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
    </>
  );
}

SeriesDescriptor.defaultProps={ minified:false };

export default SeriesDescriptor; 
