import React from 'react';
import { Anchor, Box, Button, Collapsible } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import YieldSeries from '../components/YieldSeries';
import { IYieldSeries } from '../types';

const Borrow = () => {
  const [makerView, setMakerView] = React.useState<boolean>(false);
  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);


  const { state } = React.useContext(SeriesContext);

  // const handleSelectSeries = (_series: IYieldSeries) => {
  //   // setSelectedSeries(_series);
  //   // setShowLendLayer(true);
  // };
  const handleSelectSeries = (ind: number) => {
    openIndex !== ind ?
      setOpenIndex(ind) :
      setOpenIndex(null);
    // setSelectedSeries(_series);
    // setShowLendLayer(true);
  };

  React.useEffect(() => {
    showMore? setSeriesList(state.seriesData) : setSeriesList(state.seriesData.slice(0, 4));
  }, [ showMore ]);
  
  return (

    <Box pad="medium" round="medium" fill background="background-front">
      <Box
        justify="between"
        pad='medium'
        gap='medium'
      >
        {/* <Box>Choose a collateral option:</Box> */}
        <Box gap='none' direction='row' fill='horizontal' justify='center'>
          <Button 
            primary={!makerView}
            label='Collateral Deposit'
            style={{ borderRadius:'24px 0px 0px 24px' }}
            onClick={()=>setMakerView(false)}
          />
          <Button 
            primary={makerView}
            label='Convert a Maker Vault'
            style={{ borderRadius:'0px 24px 24px 0px' }}
            onClick={()=>setMakerView(true)}
          />
        </Box>
      </Box>

      <Box
        justify="between"
        pad='medium'
        gap='medium'
      >
        <Box>Choose an available series:</Box>
        <Box gap="small" pad={{ right: 'right' }}>

          {seriesList.map((x:any, i:number) => {
            const pKey = i;
            return (
              <Box
                key={pKey.toString()}
                direction="row"
                justify="between"
                align="baseline"
              >
                <Box flex>
                  <YieldSeries
                    series={x}
                    seriesAction={() => handleSelectSeries(i)}
                  >
                    { makerView? 
                      <Collapsible open={openIndex===i}>
                        Hello ::::  Maker Vault migration Options
                      </Collapsible>
                      :
                      <Collapsible open={openIndex===i}>
                        Hello -- Collateral Deposit Options - collapsabel
                      </Collapsible>}
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

      {/* {makerView? 
        <>Maker Vault migration

        </> :

        <Box>
          Collateral Deposit

        </Box>} */}
    </Box>
  );
};

export default Borrow;
