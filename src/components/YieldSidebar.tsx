import React from 'react';
import {
  Anchor, 
  Button,
  Box,
  Image,
  Sidebar,
  Text,
  ThemeContext,
  Nav,
  Drop,
} from 'grommet';

import PulseLoader from 'react-spinners/PulseLoader';

import { IYieldSeries } from '../types';
import { YieldContext } from '../contexts/YieldContext';
import YieldSeriesMenuItem from './YieldSeriesMenuItem';



// import YieldSeries from './YieldSeries';

const YieldSidebar = ({ activeSeries, setActiveSeries, setShowSeriesLayer }:{activeSeries:IYieldSeries|null, setActiveSeries:any, setShowSeriesLayer:any}) => {
  const { state } = React.useContext( YieldContext );
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);
  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);

  // const handleSelectSeries = (ind: number | null) => {
  //   openIndex !== ind ?
  //     // setOpenIndex(ind) :
  //     // setOpenIndex(null);
  //     setActiveSeries(ind) :
  //     setOpenIndex(null);
  // };

  React.useEffect(() => {
    !state.isLoading && setSeriesList(state.deployedSeries);
  }, [ state.isLoading ]);

  return (
    
    <Sidebar
      // overflow="auto"
      background="background"
      // header={<SidebarHeader />}
      // footer={<SidebarFooter />}
      pad="none"
      gap='small'
      // align='center'
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
        <PulseLoader size='5px' margin='5' />
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
          color='background-frontheader'
          hoverIndicator='background-frontheader'
          onClick={()=>setShowSeriesLayer(true)}
          label={<Text size='xsmall'>Discover more</Text>}
        />
      </Box>
    </Sidebar>
  );
};

export default YieldSidebar;
