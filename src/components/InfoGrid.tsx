import React, { useContext, useState, useEffect } from 'react';
import { Grid, Box, Text, ResponsiveContext } from 'grommet';

import Loading from './Loading';

import { SeriesContext } from '../contexts/SeriesContext';
import { modColor, invertColor, contrastColor } from '../utils';

type entry = {
  visible: boolean;
  active: boolean;
  loading: boolean;
  label: string;
  value: string;
  valuePrefix?: string|null;
  valueExtra?: any|null;
};

interface IInfoGridProps {
  entries: entry[];
  alt?: boolean;
}

function InfoGrid({ entries, alt }:IInfoGridProps) {

  const screenSize = useContext(ResponsiveContext);
  const { state:{ activeSeries } } = useContext(SeriesContext);

  const [normalText, setNormalText] = useState<string>();
  const [weakText, setWeakText] = useState<string>();

  useEffect(()=>{
    activeSeries && setNormalText( alt? `${modColor(activeSeries.seriesColor, -150)}`: 'brand');
    activeSeries && setWeakText( alt? `${modColor(activeSeries.seriesColor, 10)}`: 'text-weak');
  }, [activeSeries]);
  
  return (
    <Grid columns={screenSize !== 'small' ? '30%' : '45%'} gap="small" fill justify='start' >
      {entries.map((x:any, i:number) => {
        const _key = i;
        const ValueExtra = x.valueExtra; 
        if (x.visible) {
          return (
            <Box key={_key}>         
              <Box 
                pad='small' 
              >
                <Box
                  round='large'
                  gap='small' 
                  align={alt? 'start': 'center'}
                >
                  <Text 
                    wordBreak='keep-all' 
                    color={alt? normalText: weakText} 
                    size='xxsmall' 
                    // weight={alt? 'bold': undefined}
                  >
                    {x.label}
                  </Text>
                  <Loading condition={x.loading} size='small'>
                    <Box direction='row-responsive' gap='xsmall' align='center'>
                      { x.valuePrefix && 
                        screenSize !== 'small' && 
                        <Text color={x.active ? normalText:weakText} size='medium' weight='bold'>
                          {x.valuePrefix}                     
                        </Text>}
                      <Text color={x.active? normalText:weakText} weight='bold' size='medium'> 
                        {x.value}
                      </Text>
                    </Box>
                    { x.valueExtra && <ValueExtra />}                  
                  </Loading>
                </Box> 
              </Box>
            </Box>
          );
        }
      })}
    </Grid>
  );
}

InfoGrid.defaultProps={ alt:false };

export default InfoGrid;
