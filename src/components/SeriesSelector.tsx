import React, { useEffect, useState, useContext } from 'react';
import { Text, Box, Layer, ResponsiveContext, Button } from 'grommet';
import { 
  FiArrowLeft as ArrowLeft,
  FiCheck as Check,
} from 'react-icons/fi';

import { SeriesContext } from '../contexts/SeriesContext';

import AprBadge from './AprBadge';
import Loading from './Loading';
import FlatButton from './FlatButton';
import RaisedButton from './RaisedButton';

interface ISeriesSelectorProps {
  activeView:string;
  close:any;
}

const SeriesSelector = ({ close, activeView }:ISeriesSelectorProps) => {

  const screenSize = useContext(ResponsiveContext);
  const { state: seriesState, actions: seriesActions } = useContext( SeriesContext );
  const { seriesLoading, activeSeries, seriesData } = seriesState; 
  const { setActiveSeries } = seriesActions;

  const [sortedList, setSortedList] = useState<any>(seriesData);

  const viewMap = new Map([
    ['BORROW', { head: 'DEBT', field: 'ethDebtFYDai_' }],
    ['LEND', { head: 'BALANCE', field: 'fyDaiBalance_' }],
    ['POOL', { head: 'POOL PERCENTAGE', field: 'poolPercent' }],
  ]);

  const handleSelectSeries = (seriesMaturity: number) => {
    setActiveSeries(seriesMaturity);
    close();
  };

  /* filter by isMature, then sort by maturity date  */
  useEffect(()=>{

    const sortedActive = new Map([...seriesData.entries()]
      .filter((x:any)=> !(x[1].isMature()) )
      .sort()
    );
    const sortedMature = new Map([...seriesData.entries()]
      .filter((x:any)=> x[1].isMature() )
      .sort(
        (a:any, b:any)=>{
          return ( a[0]>b[0] ? 0:-1 );
        }
      )
    );
    const mergedMap = new Map([...sortedActive, ...sortedMature]);
    setSortedList(mergedMap);

  }, [seriesData]);

  return (
    <Layer
      onClickOutside={()=>close()}
      onEsc={()=>close()}
      responsive={true}
      animation='slide'  
    >
      <Box
        round='small'
        fill
        background='background-front'
        pad={{ horizontal: 'medium', vertical:'large' }}
        gap='medium'
        width={screenSize!=='small'?{ min:'620px', max:'620px' }: undefined}
      >
        <Box gap='medium'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Choose a series</Text>
          <Text alignSelf='start' size='medium' color='text-weak'>Select a series from the list below</Text>
        </Box>
        <Box 
          gap='none'
        >
          <Box 
            direction='row'
            pad='medium'
            fill='horizontal'
            justify='between'
            gap='small'
          >
            <Box basis={screenSize==='small'?'30%':'30%'}>
              <Text size='small' color='text-weak'>APR</Text>
            </Box>

            <Box fill='horizontal' direction='row' justify='between' gap='small'>

              <Box fill align={screenSize==='small'?'end':undefined}>
                <Text size='small' color='text-weak'>SERIES NAME</Text>
              </Box>

              <Box fill align={screenSize==='small'?'end':undefined}>
                <Text size='small' color='text-weak'>
                  { viewMap.get(activeView.toUpperCase())?.head }         
                </Text>
              </Box>
            </Box>

            { screenSize !== 'small' && 
              <Box direction='row' justify='end' basis='25%'>
                <Text size='small' color='text-weak'> </Text>
              </Box>}
          </Box>

          <Loading condition={seriesLoading} size='large'>
            { !seriesLoading && [...sortedList.values() ].map((x:any, i:any) => {       
              const _key = i;
              const field = viewMap.get(activeView.toUpperCase())?.field || '';

              return ( 
                <Box
                  key={_key}
                  direction='row' 
                  justify='between'
                  onClick={()=>handleSelectSeries(x.maturity)}
                  hoverIndicator='background-mid'
                  background={activeSeries.maturity === x.maturity ?'background-mid':undefined}
                  border='top'
                  fill='horizontal'
                  pad='medium'
                  gap='small'
                >
                  <Box basis={screenSize==='small'?'30%':'30%'} align='center'>
                    <Box direction='row'>
                      <AprBadge activeView={activeView} series={x} />
                    </Box>
                  </Box>

                  <Box fill='horizontal' direction='row' justify='between' gap='small'>
                    <Box fill align={screenSize==='small'?'start':'start'}>
                      <Text size={screenSize} color='brand'>
                        {x.displayName}
                      </Text>
                    </Box>
                    <Box fill align={screenSize==='small'?'end':undefined}>
                      <Text size={screenSize} color='brand'>
                        {x[field]}
                      </Text>
                    </Box>                 
                  </Box>

                  { screenSize !== 'small' && 
                  <Box basis='25%' direction='row' justify='end'>
                    { activeSeries && activeSeries.maturity === x.maturity ? 
                      
                      <Button 
                        primary
                        color={activeSeries.seriesColor}
                        label={
                          <Text size='small'>Selected</Text>           
                        }
                        icon={<Check />}
                      /> : 
                      <RaisedButton 
                        secondary
                        label={<Text size='small'>Select</Text>}
                      />}
                  </Box>}
                </Box>
              );     
            })}
          </Loading>        
        </Box>

        <Box alignSelf='start' margin={{ top:'medium' }}>
          <FlatButton 
            onClick={()=>close()}
            label={
              <Box direction='row' gap='medium' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='small' color='text-weak'> go back </Text>
              </Box>
            }
          />
        </Box>
      </Box>
    </Layer>
  );
};

export default SeriesSelector;
