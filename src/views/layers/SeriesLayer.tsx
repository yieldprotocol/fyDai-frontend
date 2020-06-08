import React from 'react';
import { Anchor, Text, Box, Layer, Header } from 'grommet';

import { IYieldSeries } from '../../types';
import { SeriesContext } from '../../contexts/SeriesContext';

import { Spinner } from '../../components/LoadingSpinner';

import YieldSeriesSummary from '../../components/YieldSeriesSummary';
import YieldSeries from '../../components/YieldSeries';

import { FaEye as Eye, FaStar as Star } from 'react-icons/fa';


const SeriesLayer = (props:any) => {

  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);

  const refs = React.useRef<Array<HTMLDivElement | null>>([]);
  const boxRef = React.useRef<any>(null);

  const { closeLayer, setActiveSeries, activeSeries } = props;

  // const refsArray = React.useRef([]);
  // const elementsRef = React.useRef(seriesList.map(() => createRef()));

  // TODO: convert to reducer if get more 

  const { state } = React.useContext( SeriesContext );

  const handleSelectSeries = (series: any) => {
    setActiveSeries(series);
    closeLayer();
  };

  React.useEffect(() => {
    !state.isLoading && setSeriesList(state.seriesData);
  }, [ state.isLoading ]);

  // React.useEffect(() => {
  //   showMore? 
  //     setSeriesList(state.seriesData) 
  //     : 
  //     setSeriesList(state.seriesData.slice(0, 4));
  // }, [ showMore ]);

  return (
    <Layer
      onClickOutside={()=>closeLayer()}
      onEsc={()=>closeLayer()}
    >
      <Header
        // round={{ corner:'bottom', size:'xsmall' }}
        fill='horizontal'
        background='background-frontheader'
        pad={{ horizontal: 'medium', vertical:'large' }}
      >
        <Text>Select a series:</Text>
        <Anchor onClick={()=>closeLayer()} size='xsmall' label='Cancel' />
      </Header>
      <Box background='background' pad='medium'>
        <Box justify="between" gap='small'>
          {state.isLoading && <Spinner />}
          {seriesList.map((x:any, i:number) => {
            return (
              <Box
                key={x.name}
                id={x.name}
                ref={(el:any) => {refs.current[i] = el;}}
                round="small"
                direction='row'
              >
                <YieldSeriesSummary
                  series={x}
                  seriesAction={() => handleSelectSeries(x)}
                  highlighted={openIndex === i}
                />
                <Eye />
                <Star />
              </Box>
            );
          })}
        </Box>
      </Box>

    </Layer>
  );
};

export default SeriesLayer;
