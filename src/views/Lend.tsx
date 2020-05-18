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
  FaQuestionCircle as Question,
  FaCaretDown as CaretDown,

} from 'react-icons/fa';

import { SeriesContext } from '../contexts/SeriesContext';

import YieldSeries from '../components/YieldSeries';

import LendForm from '../components/LendForm';

// import LendLayer from './layers/LendLayer';

import { IYieldSeries } from '../types';

const Lend = () => {
  const [showLendLayer, setShowLendLayer] = React.useState<boolean>();
  const [selectedSeries, setSelectedSeries] = React.useState<IYieldSeries>();
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);

  const [sortAsc, setSortAsc] = React.useState<boolean>(true);
  const [showMore, setShowMore] = React.useState<boolean>(false);

  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const { state } = React.useContext(SeriesContext);

  // const handleSelectSeries = (_series: IYieldSeries) => {
  //   setOpenIndex(1); 
  //   // setSelectedSeries(_series);
  //   // setShowLendLayer(true);
  // };

  const handleSelectSeries = (ind: number | null) => {
    openIndex !== ind ?
      setOpenIndex(ind) :
      setOpenIndex(null);
    // setSelectedSeries(_series);
    // setShowLendLayer(true);
  };

  const handleCloseLayer = () => {
    setShowLendLayer(false);
  };

  React.useEffect(() => {
    showMore? setSeriesList(state.seriesData) : setSeriesList(state.seriesData.slice(0, 4));
  }, [ showMore ]);

  return (
    <Box pad="medium" round="medium" fill background="background-front">
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

      <Box gap="small" pad={{ right: 'right' }}>
        {seriesList.map((x:any, i:number) => {
          const pKey = i;
          return (
            <Box
              direction="row"
              key={pKey.toString()}
              justify="between"
              align="baseline"
            >
              <Box flex>
                <YieldSeries
                  series={x}
                  seriesAction={() => handleSelectSeries(i)}
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
  );
};

export default Lend;
