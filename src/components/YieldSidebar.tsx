import React from 'react';
import {
  Button,
  Box,
  Sidebar,
  Text,
} from 'grommet';

import PulseLoader from 'react-spinners/PulseLoader';

import { IYieldSeries } from '../types';
import { YieldContext } from '../contexts/YieldContext';
import YieldSeriesMenuItem from './YieldSeriesMenuItem';
// import YieldSeries from './YieldSeries';

const YieldSidebar = ({
  activeSeries,
  setActiveSeries,
  setShowSeriesLayer }
: {
  activeSeries:IYieldSeries|null,
  setActiveSeries:any,
  setShowSeriesLayer:any
}) => {

  const { state } = React.useContext( YieldContext );
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);

  const { deployedSeries } = state;
  // const handleSelectSeries = (ind: number | null) => {
  //   openIndex !== ind ?
  //     // setOpenIndex(ind) :
  //     // setOpenIndex(null);
  //     setActiveSeries(ind) :
  //     setOpenIndex(null);
  // };

  React.useEffect(() => {
    !state.isLoading && setSeriesList(deployedSeries);
  }, [ state.isLoading, deployedSeries ]);

  return (
    <Sidebar
      background="background"
      pad="none"
      gap='small'
    >
      <Box margin={{ left: 'small', vertical:'none' }} pad='small'>
        <Text size='large'> Series Available </Text>
      </Box>
      
      {state.isLoading && 
      <Box
        round='xlarge'
        width='xsmall'
        height='xsmall'
        // background={activePosition?.seriesColor}
        justify='center'
        align='center'
        margin='small'
      >
        <PulseLoader size='5px' margin='5px' />
      </Box>}

      {seriesList.map((x:any, i:number) => {
        return (
          <YieldSeriesMenuItem
            key={x.symbol}
            series={x}
            seriesAction={() => setActiveSeries(x)}
            selected={activeSeries === x}
          />
        );
      })}
      <Box pad='small'>
        <Button 
          color='background-mid'
          hoverIndicator='background-mid'
          onClick={()=>setShowSeriesLayer(true)}
          label={<Text size='xsmall'>Discover more</Text>}
        />
      </Box>
    </Sidebar>
  );
};

export default YieldSidebar;
