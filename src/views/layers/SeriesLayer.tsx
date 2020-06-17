import React from 'react';
import { Anchor, Text, Box, Layer, Header } from 'grommet';

import { IYieldSeries } from '../../types';
import { YieldContext } from '../../contexts/YieldContext';

import { Spinner } from '../../components/LoadingSpinner';

import YieldSeriesSummary from '../../components/YieldSeriesSummary';
// import YieldSeries from '../../components/YieldSeries';


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

  const { state } = React.useContext( YieldContext );

  const handleSelectSeries = (series: any) => {
    setActiveSeries(series);
    closeLayer();
  };

  React.useEffect(() => {
    !state.isLoading && setSeriesList(state.deployedSeries);
  }, [ state.isLoading ]);

  // React.useEffect(() => {
  //   showMore? 
  //     setSeriesList(state.deployedSeries) 
  //     : 
  //     setSeriesList(state.deployedSeries.slice(0, 4));
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
        <Text>yDai Series:</Text>
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
                round="xsmall"
                direction='row'
              >
                <YieldSeriesSummary
                  series={x}
                  seriesAction={() => handleSelectSeries(x)}
                  highlighted={openIndex === i}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

    </Layer>
  );
};

export default SeriesLayer;
