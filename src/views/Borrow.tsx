import React, { createRef } from 'react';
import { Anchor, Box, Button, Collapsible, Layer } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import YieldSeries from '../components/YieldSeries';
import { IYieldSeries } from '../types';

import BorrowForm from '../components/BorrowForm';

const Borrow = (props:any) => {

  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);

  const refs = React.useRef<Array<HTMLDivElement | null>>([]);

  // const refsArray = React.useRef([]);
  // const elementsRef = React.useRef(seriesList.map(() => createRef()));

  // TODO: convert to reducer if get more 
  const [collateralMethod, setCollateralMethod ]= React.useState<string>('DEPOSIT');
  const { state } = React.useContext( SeriesContext );

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
      <Box 
        pad="medium" 
        round="medium"
        fill
        background="background-front"
      >
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
