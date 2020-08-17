import React from 'react';
import { Grid, Box, Text, ResponsiveContext } from 'grommet';
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
}

function InfoGrid({ entries }:IInfoGridProps) {

  const screenSize = React.useContext(ResponsiveContext);
  
  return (
    <Grid columns={screenSize !== 'small' ? '30%' : '45%'} gap="small" fill>
      {entries.map((x:any, i:number) => {
        const _key = i;
        const ValueExtra = x.valueExtra; 
        return (
          <Box key={_key}>
            { x.visible &&
              <Box 
                pad='small' 
                align='start'
              >
                <Box gap='small' align='center'>
                  <Text wordBreak='keep-all' color='text-weak' size='xxsmall'>{x.label}</Text>            
                  <Loading condition={x.loading} size='small'>
                    <Box direction='row-responsive' gap='small'>
                      { x.valuePrefix && <Text color={x.active ? 'brand':'brand-transparent'} size='xxsmall'>{x.valuePrefix}</Text> }
                      <Text color={x.active? 'brand':'brand-transparent'} weight='bold' size='medium'> 
                        {x.value}
                      </Text>
                      { x.valueExtra && <ValueExtra />}
                    </Box> 
                  </Loading>
                </Box> 
              </Box>}
          </Box>
        );
      })}
    </Grid>
  );
}

export default InfoGrid;
