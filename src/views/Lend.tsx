import React from 'react';
import moment from 'moment';
import { Box, Heading, Text } from 'grommet';
import RotateLoader from 'react-spinners/RotateLoader';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { IYieldSeries } from '../types';

import BuySell from '../components/BuySell';
import Redeem from '../components/Redeem';

interface BorrowProps {
  setActiveSeries: any,
  activeSeries:IYieldSeries,
  setShowSeriesLayer: any,
}

const Lend = ({ activeSeries }:BorrowProps) => {

  const { state: yieldState } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  // const [ nextColor, setNextColor ] = React.useState<string>('');

  const [ activePosition, setActivePosition ] = React.useState<any>(null);
  // const [ layerOpen, setLayerOpen ] = React.useState<String|null>(null);
  // const [ ] = React.useState<boolean>(true);
  const [ depositWithdrawActive ] = React.useState<boolean>(true);

  const { isLoading: positionsLoading, positionsData } = seriesState; 
  const {
    yDaiBalance_,
  }  = activeSeries;

  React.useEffect( () => {
    ( async () => {
      !positionsLoading && await seriesActions.getPositions([activeSeries]);
      setActivePosition(positionsData.get(activeSeries.symbol));
    })();
    console.log(seriesState);
  }, [ activeSeries ]);

  return (

    <Box gap='small' pad={{ vertical:'small', horizontal:'large' }}>
      <Box justify='between'>
        <Box direction='row' justify='between'>
          <Box width='75%'>
            <Heading level='3'>Lend Dai</Heading>
            <Box pad={{ vertical:'small' }}>
              <Text size='small'>
                Interest is calculated on a yearly basis and paid out when the term matures: 
                In this case 3 months, earning you 3.5% - 4% APR through yDai.
              </Text>
            </Box>
          </Box>

          { positionsLoading? 
            <Box
              round='xlarge'
              width='xsmall'
              height='xsmall'
              // background={activePosition?.seriesColor}
              justify='center'
              align='center'
              margin='small'
            >
              {/* <RotateLoader color='#009E83' /> */}
              <RotateLoader color={activePosition?.seriesColor || '#009E83'} />
            </Box>
            :
            <Box
              round='xlarge'
              width='xsmall'
              height='xsmall'
              background={activePosition?.seriesColor}
              justify='center'
              align='center'
              margin='small'
            >
              <Box align='center'>
                <Text weight='bold'>{moment(activePosition?.maturity_).format('MMM')}</Text>
                <Text>{moment(activePosition?.maturity_).format('Y')}</Text>
              </Box>
            </Box>}
        </Box>
      </Box>

      <Box 
        direction='row-responsive'
        gap='xsmall'
        justify='between'
        align='baseline'
        margin={{ vertical:'medium' }}
      >
        <Box
          direction='row'
          gap='xsmall'
          align='baseline'
        >
          <Box>
            <Text weight='bold' size='xsmall'> yDai Balance </Text>
          </Box>
          <Box
            background='brand-transparent'
            round
            pad={{ horizontal:'small', vertical:'xsmall' }}
          >
            <Text size='xsmall' color='brand'>{yDaiBalance_} yDai ≈ {yDaiBalance_*1.01} Dai</Text>
          </Box>
        </Box>

        <Box direction='row' gap='small' align='baseline'> 
          <Text weight='bold' size='xsmall'>Maturity: </Text>
          <Box round border='all' pad={{ horizontal:'small', vertical:'xsmall' }}>
            <Text size='xsmall'>{moment(activePosition?.maturity_p).format('MMMM DD, YYYY')}</Text>
          </Box>
        </Box>
      </Box>

      <Box flex='grow' direction='column'>
        <Box direction='row-responsive' gap='small' justify='between'>
          <BuySell
            activeSeries={activeSeries}
            active={depositWithdrawActive}
          />
          <Redeem
            activeSeries={activeSeries}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Lend;