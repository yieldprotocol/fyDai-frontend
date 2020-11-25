/* eslint-disable consistent-return */
import React, { useContext, useState, useEffect } from 'react';
import { Box, Text, Collapsible, ResponsiveContext } from 'grommet';

import Loading from './Loading';

import { SeriesContext } from '../contexts/SeriesContext';

type entry = {
  visible: boolean;
  active: boolean;
  loading: boolean;
  label: any;
  value: any;
  labelExtra?: any|null;
  valuePrefix?: string|null;
  valueExtra?: any|null;
};

interface IInfoGridProps {
  entries: entry[];
  alt?: boolean;
}

function InfoGrid({ entries, alt }:IInfoGridProps) {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state:{ activeSeries } } = useContext(SeriesContext);
  const [ detailsOpen, setDetailsOpen ] = useState<boolean>();
  const [visibleEntries, setVisibleEntries] = useState<any[]>([]);

  useEffect(()=>{
    setVisibleEntries((entries.filter((x:any)=>x.visible===true)));
  }, [entries]);

  return (
    <Box>
      <Box 
        pad={{ horizontal:'small' }} 
        direction='row-responsive' 
        gap='small' 
        justify='start'
      >
        {visibleEntries.map((x:any, i:number) => {
          const _key = i;
          const ValueExtra = x.valueExtra;
          const Value = x.value;
          const Label = x.label;
          const LabelExtra = x.labelExtra;

          if (i < 3) {
            return (             
              <Box
                key={_key}
                pad='small' 
                round='large'
                gap='xsmall'
                width={{ min:'30%' }}
              >
                <Box>
                  <Text 
                    // color={alt? 'text-weak': 'text-weak'} 
                    color={alt? activeSeries?.seriesTextColor : 'text-weak'}
                    size='xsmall'
                  >
                    { (typeof Label === 'function')? <Label />: Label }
                  </Text>

                  <Text 
                    color={alt? 'text-xweak': 'text-xweak'} 
                    size='xxsmall'
                  >
                    { (typeof LabelExtra === 'function')? <LabelExtra />: LabelExtra }
                  </Text>
                </Box>  

                <Loading condition={x.loading} size='small' color={alt? activeSeries?.seriesTextColor : 'text'}>
                  <Box direction='row-responsive' gap='xsmall' align='center'>
                    { x.valuePrefix && 
                      !mobile && 
                      <Text color={alt? activeSeries?.seriesTextColor : 'text-weak'} size='medium' weight='bold'>
                        {x.valuePrefix}                     
                      </Text>}
                    <Text color={alt? activeSeries?.seriesTextColor : 'text-weak'} weight='bold' size='medium'> 
                      { (typeof Value === 'function')? <Value />: Value }
                    </Text>
                  </Box>

                  { typeof ValueExtra === 'function' ? 
                    <ValueExtra />  :
                    <Text color={alt? activeSeries?.seriesTextColor : 'text-weak'} size='xxsmall'> 
                      { ValueExtra }
                    </Text>}                 
                </Loading>
              </Box>
            );
          } 
          return [];
        })}
      </Box>

      <Box>
        <Collapsible open={detailsOpen}>
          <Box 
            pad={{ horizontal:'small', top:'small' }} 
            direction='row-responsive' 
            gap='medium' 
            justify='start'
          >
            {visibleEntries.map((x:any, i:number) => {
              const _key = i;
              const ValueExtra = x.valueExtra; 
              const Value = x.value;
              const Label = x.label;

              if (x.visible && i>=3 && i<6 ) {
                return (       
                  <Box
                    key={_key}
                    pad='small' 
                    round='large'
                    gap='xsmall'
                    width={{ min:'30%' }}
                  >
                    <Box>
                      <Text 
                        color={alt? activeSeries?.seriesTextColor : 'text-weak'}
                        size='xsmall'
                      >
                        { (typeof Label === 'function')? <Label />: Label }
                      </Text>

                      <Text 
                        color={alt? 'text-xweak': 'text-xweak'} 
                        size='xxsmall'
                      >
                        { x.labelExtra}
                      </Text>
                    </Box> 
                    <Loading condition={x.loading} size='small' color={alt? activeSeries?.seriesTextColor : 'text'}>
                      <Box direction='row-responsive' gap='xsmall' align='center'>
                        { x.valuePrefix && 
                        !mobile && 
                        <Text color={x.active ? activeSeries?.seriesTextColor:'text-xweak'} size='medium' weight='bold'>
                          {x.valuePrefix}                     
                        </Text>}
                        <Text color={x.active? activeSeries?.seriesTextColor:'text-xweak'} weight='bold' size='medium'> 
                          { (typeof Value === 'function')? <Value />: Value }
                        </Text>
                      </Box>     
                      { x.valueExtra && (typeof ValueExtra === 'function')? 
                        <ValueExtra />  :
                        <Text color={alt? 'text-weak': 'text-weak'} size='xxsmall'> 
                          { ValueExtra }
                        </Text>}                 
                    </Loading>
                  </Box>
                );
              } 
              return [];
            })}
          </Box>
        </Collapsible>
      </Box>
  
      { visibleEntries.length > 3 && 
      <Box 
        onClick={()=>setDetailsOpen(!detailsOpen)}
        direction='row' 
        justify='end'
        pad='small'
      > 
        {/* {!detailsOpen?<ChevronDown size='25px' /> : <ChevronUp size='25px' />}   */}
        {!detailsOpen?
          <Text size='xxsmall' color={activeSeries?.seriesTextColor}> more info </Text> 
          :
          <Text size='xxsmall' color={activeSeries?.seriesTextColor}> less info </Text>}
      </Box> }
    </Box>
  );
}

InfoGrid.defaultProps={ alt:false };

export default InfoGrid;
