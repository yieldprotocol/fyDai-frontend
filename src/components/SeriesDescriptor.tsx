import React, { useState, useContext } from 'react';
import { Box, Text, ThemeContext } from 'grommet';

import { ScaleLoader } from 'react-spinners';
import { SeriesContext } from '../contexts/SeriesContext';

import SeriesSelector from './SeriesSelector';

interface ISeriesDescriptorProps {
  activeView: string;
  minified?: boolean;  
}

function SeriesDescriptor( props: ISeriesDescriptorProps, children:any) {

  const { activeView, minified } = props;

  const theme:any = React.useContext(ThemeContext);
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState; 

  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);
  const [ description, setDescription ] = useState<string>( activeSeries?.displayName || '');

  /* Set Series description/display name */
  React.useEffect(()=>{
    activeSeries && setDescription(activeSeries.displayName);
    activeSeries && Number.isFinite(parseFloat(activeSeries.yieldAPR_)) &&
      setDescription(`${activeSeries.yieldAPR_}% ${activeSeries.displayName}`);
  }, [ activeSeries ]);

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
          background='brand-transparent'
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
            <Text color='brand' size='large'>
              { description }
            </Text>}

          {
            activeSeries?.isMature === false && 
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
            </Box>}

          { activeSeries?.isMature === true && 
            !Number.isFinite(parseFloat(activeSeries.yieldAPR_)) &&        
            <Box 
              round
              border='all'
              direction='row'
              pad={{ horizontal:'small' }}
              align='center'
            >
              <Text size='xxsmall'>
                Matured Series         
              </Text>
            </Box>}
        </Box>

        <Box justify='center'>
          <Box
            round
            onClick={()=>setSelectorOpen(true)}
            hoverIndicator='brand-transparent'
            border='all'
            // border={{ color:'brand' }}
            pad={{ horizontal:'small', vertical:'small' }}
            justify='center'
          >
            <Text size='xsmall'>Change series</Text>
          </Box>
        </Box>
      </Box>
    </>
  );
}

SeriesDescriptor.defaultProps={ minified:false };

export default SeriesDescriptor; 
