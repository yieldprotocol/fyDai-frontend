import React, { useContext } from 'react';
import { Grid, Box, Text, ResponsiveContext } from 'grommet';
import { ColorType } from 'grommet/utils';

import Loading from './Loading';

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
  
  return (
    <Grid columns={screenSize !== 'small' ? '30%' : '45%'} gap="small" fill justify='start'>
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
                    color={alt? 'brand': 'text-weak'} 
                    size='xxsmall' 
                    weight={alt? 'bold': undefined}
                  >
                    {x.label}
                  </Text> 

                  <Loading condition={x.loading} size='small'>

                    <Box direction='row-responsive' gap='small'>
                      { x.valuePrefix && screenSize !== 'small' && <Text color={x.active ? 'brand':'brand-transparent'} size='xxsmall'>{x.valuePrefix}</Text> }
                      <Text color={x.active? 'brand':'brand-transparent'} weight='bold' size='medium'> 
                        {x.value}
                      </Text>
                      { x.valueExtra && <ValueExtra />}
                    </Box> 
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
