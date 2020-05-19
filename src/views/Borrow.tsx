import React from 'react';
import { Anchor, Box, Button, Collapsible, Layer } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import YieldSeries from '../components/YieldSeries';
import { IYieldSeries } from '../types';

import BorrowForm from '../components/BorrowForm';

// const scrollToRef = (ref:any) => window.scrollTo(0, ref.current);

const Borrow = () => {

  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);
  // TODO: convert to reducer if get more 
  const [collateralMethod, setCollateralMethod ]= React.useState<string>('DEPOSIT');

  const { state } = React.useContext(SeriesContext);

  const refs = seriesList.reduce((acc:any, value:any) => {
    acc[value.id] = React.createRef();
    return acc;
  }, {});

  const handleSelectSeries = (ind: number | null) => {
    openIndex !== ind ?
      setOpenIndex(ind) :
      setOpenIndex(null);
  };

  const isHighlighted = (ind: number) => {
    return (ind === openIndex);
  };

  React.useEffect(() => {
    showMore? setSeriesList(state.seriesData) : setSeriesList(state.seriesData.slice(0, 4));
  }, [ showMore ]);
  
  return (

    <Box overflow='auto'>
      { openIndex!==null && <Layer /> }

      <Box pad="medium" round="medium" fill background="background-front" overflow='auto'>
        <Box
          justify="between"
          pad='medium'
          gap='medium'
        >
          <Box gap='none' direction='row' fill='horizontal' justify='center'>
            <Button 
              primary={collateralMethod === 'DEPOSIT'}
              label='Deposit Collateral'
              style={{ borderRadius:'24px 0px 0px 24px' }}
              onClick={()=>setCollateralMethod('DEPOSIT')}
            />
            <Button 
              primary={collateralMethod === 'MAKER'}
              label='Collaterize a Maker Vault'
              style={{ borderRadius:'0px 24px 24px 0px' }}
              onClick={()=>setCollateralMethod('MAKER')}
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
                  ref={refs[x.id]}
                  key={pKey.toString()}
                  direction="row"
                  justify="between"
                  align="baseline"
                >
                  <Box flex>
                    <YieldSeries
                      series={x}
                      seriesAction={() => { handleSelectSeries(i);}}
                      highlighted={isHighlighted(i)}
                    >
                      <Collapsible open={openIndex===i}>
                        <BorrowForm 
                          series={x}
                          closeLayer={()=>handleSelectSeries(null)}
                          collateralMethod={collateralMethod}
                          setCollateralMethod={setCollateralMethod}
                        />
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

export default Borrow;
