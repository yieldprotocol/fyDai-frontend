import React from 'react';
import {
  Anchor,
  Box,
  Heading,
  Diagram,
  Stack,
  Grid,
  Text,
  DataTable,
  Meter,
  List,
  Layer,
  TextInput,
  DropButton,
  Collapsible,

} from 'grommet';
import {
  FaSortAmountDownAlt as SortDes,
  FaSortAmountUpAlt as SortAsc,

} from 'react-icons/fa';

import { SeriesContext } from '../contexts/SeriesContext';

import YieldSeries from '../components/YieldSeries';

import LendForm from '../components/LendForm';

// import LendLayer from './layers/LendLayer';

import { IYieldSeries } from '../types';

const Lend = () => {
  // const [showLendLayer, setShowLendLayer] = React.useState<boolean>();
  // const [selectedSeries, setSelectedSeries] = React.useState<IYieldSeries>();
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);
  const [sortAsc, setSortAsc] = React.useState<boolean>(true);
  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const { state } = React.useContext(SeriesContext);

  const refs = React.useRef<Array<HTMLDivElement | null>>([]);

  const handleSelectSeries = (ind: number | null) => {
    openIndex !== ind ?
      setOpenIndex(ind) :
      setOpenIndex(null);
  };

  React.useEffect(() => {
    if (openIndex && refs.current[openIndex]) {
      // @ts-ignore
      refs.current[openIndex].scrollIntoView({
        block: 'nearest',
        inline: 'start',
        behavior: 'auto',
      });
    }
  }, [openIndex]);

  React.useEffect(() => {
    showMore? setSeriesList(state.seriesData) : setSeriesList(state.seriesData.slice(0, 4));
  }, [ showMore ]);

  return (
    <Box>
      <Box pad="medium" round="medium" fill background="background-front">
        <Box
          justify="between"
          pad='medium'
          gap='medium'
        >
          <Box
            pad={{ top: 'small', bottom: 'medium' }}
            direction="row"
            justify="between"
          >
            <Box
              flex
              direction="row"
              justify="between"
              pad={{ horizontal: 'small' }}
            >
              <Box>Select an available series:</Box>
              {sortAsc ? (
                <SortAsc onClick={() => setSortAsc(!sortAsc)} />
              ) : (
                <SortDes onClick={() => setSortAsc(!sortAsc)} />
              )}
            </Box>
          </Box>
        
          { openIndex!==null && <Layer />}
          <Box gap="small" pad={{ right: 'right' }}>
            {seriesList.map((x:any, i:number) => {
              return (
                <Box
                  id={x.id}
                  key={x.id}
                  direction="row"
                  justify="between"
                  align="baseline"
                  ref={(el:any) => {refs.current[i] = el;}}
                >
                  <Box flex>
                    <YieldSeries
                      series={x}
                      seriesAction={() => handleSelectSeries(i)}
                      highlighted={openIndex === i}
                    >
                      <Collapsible open={openIndex===i}>
                        <LendForm series={x} closeLayer={()=>handleSelectSeries(null)} />
                      </Collapsible>
                    </YieldSeries>
                  </Box>
                </Box>
              );
            })}
            <Box fill='horizontal' direction='row' justify='end' pad='medium'>
              {!showMore ? <Anchor onClick={()=>setShowMore(true)} label='Show more...' /> : <Anchor onClick={()=>setShowMore(false)} label='Show less...' /> }
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Lend;
