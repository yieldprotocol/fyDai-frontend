import React from 'react';
import { Anchor, Box, Layer } from 'grommet';

import { IYieldSeries } from '../types';
import { YieldContext } from '../contexts/YieldContext';

import { Spinner } from '../components/LoadingSpinner';

import YieldSeriesSummary from '../components/YieldSeriesSummary';
import YieldSeries from '../components/YieldSeries';

const Series = (props:any) => {

  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);

  const refs = React.useRef<Array<HTMLDivElement | null>>([]);
  const boxRef = React.useRef<any>(null);

  // const refsArray = React.useRef([]);
  // const elementsRef = React.useRef(seriesList.map(() => createRef()));

  // TODO: convert to reducer if get more 

  const { state } = React.useContext( YieldContext );

  const handleSelectSeries = (ind: number | null) => {
    openIndex !== ind ?
      setOpenIndex(ind) :
      setOpenIndex(null);
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
    <Box 
      pad="medium"
      border={{ side:'all', color:'lightgreen' }}
      // round
      ref={boxRef}
    >
      <Box justify="between" gap='small'>
        {state.isLoading && <Spinner />}
        {seriesList.map((x:any, i:number) => {
          return (
            <Box
              key={x.name}
              id={x.name}
              ref={(el:any) => {refs.current[i] = el;}}
              round="small"
            >
              <YieldSeriesSummary
                series={x}
                seriesAction={() => handleSelectSeries(i)}
                highlighted={openIndex === i}
              />
              { openIndex === i &&
                <Layer animation="fadeIn">
                  <YieldSeries
                    series={x}
                    seriesAction={() => handleSelectSeries(i)}
                    highlighted={openIndex === i}
                  />
                </Layer>}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Series;
