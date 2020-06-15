import React from 'react';
import moment from 'moment';
import { Box, Grid, Heading, Text, Collapsible, Markdown, Layer } from 'grommet';
import RotateLoader from 'react-spinners/RotateLoader';

import { FiCheckCircle, FiCircle, FiRefreshCw as Refresh } from 'react-icons/fi';
import Series from './x_Series';
import Positions from './x_Positions';
import BorrowAction from '../components/BorrowAction';
import RepayAction from '../components/RepayAction';

import TransactionHistory from '../components/TransactionHistory';

import { YieldContext } from '../contexts/YieldContext';
import { PositionsContext } from '../contexts/PositionsContext';
import { IYieldSeries } from '../types';

import DepositWithdraw from '../components/DepositWithdraw';
import BorrowRepay from '../components/BorrowRepay';
import BuySell from '../components/BuySell';

interface BorrowProps {
  setActiveSeries: any,
  activeSeries:IYieldSeries,
  setShowSeriesLayer: any, 
}

const Lend = ({ setActiveSeries, activeSeries, setShowSeriesLayer }:BorrowProps) => {

  const { state: yieldState, dispatch: yieldDispatch } = React.useContext(YieldContext);
  const { state: positionsState, actions: positionsActions } = React.useContext(PositionsContext);
  // const [ nextColor, setNextColor ] = React.useState<string>('');

  const [ activePosition, setActivePosition ] = React.useState<any>(null);
  // const [ layerOpen, setLayerOpen ] = React.useState<String|null>(null);
  const [ borrowRepayActive, setBorrowRepayActive ] = React.useState<boolean>(true);
  const [ depositWithdrawActive, setDepositWithdrawActive ] = React.useState<boolean>(true);

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
                <Text weight='bold'>{moment(activePosition?.maturity_p).format('MMM')}</Text>
                <Text>{moment(activePosition?.maturity_p).format('Y')}</Text>
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
            background='brandTransparent'
            round
            pad={{ horizontal:'small', vertical:'xsmall' }}
          >
            <Text size='xsmall' color='brand'>{'12'} yDai ≈ 12.01 Dai</Text>
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
        </Box>
      </Box>
    </Box>
  );
};

export default Lend;