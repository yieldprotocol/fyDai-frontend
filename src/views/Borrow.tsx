import React from 'react';
import moment from 'moment';
import { Box, Grid, Heading, Text, Collapsible, Markdown, Layer } from 'grommet';

import { FiCheckCircle, FiCircle, FiRefreshCw as Refresh } from 'react-icons/fi';
import Series from './x_Series';
import Positions from './x_Positions';
import BorrowAction from '../components/BorrowAction';
import RepayAction from '../components/RepayAction';

import TransactionHistory from '../components/TransactionHistory';

import { YieldContext } from '../contexts/YieldContext';
import { PositionsContext } from '../contexts/PositionsContext';
import { IYieldSeries } from '../types';

interface BorrowProps {
  setActiveSeries: any,
  activeSeries:IYieldSeries,
  setShowSeriesLayer: any, 
}

const Borrow = ({ setActiveSeries, activeSeries, setShowSeriesLayer }:BorrowProps) => {

  const { state: yieldState, dispatch: yieldDispatch } = React.useContext(YieldContext);
  const { state: positionsState, actions: positionsActions } = React.useContext(PositionsContext);

  const [ activePosition, setActivePosition ] = React.useState<any>(null);
  const [ layerOpen, setLayerOpen ] = React.useState<String|null>(null);

  const { isLoading: positionsLoading, positionsData } = positionsState; 
  const { isLoading: yieldLoading, deployedSeries, deployedCore, yieldData, makerData }  = yieldState;


  React.useEffect( () => {
    ( async () => {
      !positionsLoading && await positionsActions.getPositions([activeSeries]);
      setActivePosition(positionsData.get(activeSeries.symbol));
    })();
    console.log(positionsState);
  }, [ activeSeries ]);

  const {
    name,
    maturity,
    rate,
    symbol,
    currentValue,
  } = activeSeries;

  return (

    <Box gap='small' pad={{ vertical:'small', horizontal:'large' }}>
      <Box justify='between'>
        <Box direction='row' justify='between'>
          <Box width='75%'>
            <Heading level='3'>Borrow yDai</Heading>
            <Box pad={{ vertical:'small' }}>
              <Text size='small'>
                Interest is calculated on a yearly basis 
                and paid out when the term matures: 
                In this case 3 months, earning you 3.75% fixed-rate interest through yDai
              </Text>
            </Box>
          </Box>

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
              <Text weight='bold'>{moment(activePosition?.maturity_p).format('MMM')}</Text>
              <Text>{moment(activePosition?.maturity_p).format('Y')}</Text>
            </Box>

          </Box>
        </Box>
      </Box>

      <Box 
        direction='row-responsive'
        gap='xsmall'
        justify='between'
        align='baseline'
      > 
        <Box
          direction='row'
          gap='xsmall'
          align='baseline'
        >
          <Box>
            <Text weight='bold' size='xsmall'> Collateral Balances </Text>
          </Box>
          <Box
            background='brandTransparent'
            round
            pad='xsmall'
          >
            <Text size='xsmall' color='brand'>{yieldData.wethPosted_p} ETH</Text>
          </Box>
          <Box
            background='secondaryTransparent'
            round
            pad='xsmall'
          >
            <Text size='xsmall' color='secondary'>{yieldData.chaiPosted_p} DAI</Text>
          </Box>
        </Box>

        <Box direction='row' gap='small'> 
          <Text weight='bold' size='xsmall'>Maturity: </Text>
          <Text size='xsmall'>{moment(activePosition?.maturity_p).format('MMMM DD, YYYY')}</Text>
        </Box>
      </Box>

      <Box flex='grow' direction='column'>
        <Box direction='row-responsive' gap='small' justify='between'>
          <Box background="grey" fill>
            task 1
          </Box>
          '>>'
          <Box background="grey" fill>
            task 2
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Borrow;