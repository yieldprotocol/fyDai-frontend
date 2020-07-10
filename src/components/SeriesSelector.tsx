import React from 'react';
import { Anchor, Text, Box, Layer, Header } from 'grommet';

import { IYieldSeries } from '../types';
import { YieldContext } from '../contexts/YieldContext';

import YieldSeriesSummary from './YieldSeriesSummary';
// import YieldSeries from '../../components/YieldSeries';


const SeriesLayer = (props:any) => {

  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);

  const refs = React.useRef<Array<HTMLDivElement | null>>([]);
  const boxRef = React.useRef<any>(null);

  const { close, setActiveSeries, activeSeries } = props;

  // const refsArray = React.useRef([]);
  // const elementsRef = React.useRef(seriesList.map(() => createRef()));
  // TODO: convert to reducer if get more

  const { state } = React.useContext( YieldContext );

  const handleSelectSeries = (series: any) => {
    setActiveSeries(series);
    close();
  };

  React.useEffect(() => {
    !state.isLoading && setSeriesList(state.deployedSeries);
  }, [ state.isLoading ]);

  return (
    <Layer
      onClickOutside={()=>close()}
      onEsc={()=>close()}
    >
      <Header
        // round={{ corner:'bottom', size:'xsmall' }}
        fill='horizontal'
        background='background-mid'
        pad={{ horizontal: 'medium', vertical:'large' }}
      >
        <Text>yDai Series:</Text>
        <Anchor onClick={()=>close()} size='xsmall' label='Cancel' />
      </Header>

      <Box background='background' pad='medium'>
        <Box justify="between" gap='small'>
          {state.isLoading && 'Loading'}
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
