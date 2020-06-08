import React from 'react';
import moment from 'moment';
import { Box, Grid, Heading, Text, Collapsible, Markdown } from 'grommet';

import { FiCheckCircle, FiCircle, FiRefreshCw as Refresh } from 'react-icons/fi';
import Series from './x_Series';
import Positions from './x_Positions';

// import BuyAction from '../components/BuyAction';
// import SellAction from '../components/SellAction';

import BuySellAction from '../components/BuySellAction';

import TransactionHistory from '../components/TransactionHistory';

import { PositionsContext } from '../contexts/PositionsContext';
import { IYieldSeries } from '../types';


interface BorrowProps {
  setActiveSeries: any,
  activeSeries:IYieldSeries,
  setShowSeriesLayer:any,
}

const Lend = ({ setActiveSeries, activeSeries, setShowSeriesLayer }:BorrowProps) => {

  const { state: positionsState, dispatch: positionsDispatch } = React.useContext(PositionsContext);

  const {
    name,
    maturity,
    rate,
    symbol,
    currentValue,
  } = activeSeries;

  const { state: posState } = React.useContext(PositionsContext);

  return (
    <Box
      pad={{ horizontal:'medium', vertical:'medium' }}
      // round='medium'
      fill
      gap='small'
    >
      {/* <Grid columns={['auto', '1/3']}> */}
      <Box direction='row-responsive'>
        <Box 
          // elevation='xsmall'
          flex='grow'
          background='background'
          pad='medium'
          round={{ size:'xsmall', corner:'left' }}
        >
          <Box 
            direction='row'
          // justify='between'
            align='baseline'
            gap='small'
          >
            <Heading>{activeSeries?.name}</Heading>
            <Refresh onClick={()=>setShowSeriesLayer(true)} />
          </Box>

          <Box direction="column" align='start'>
          
            <Box direction="row" gap="xsmall">
              <Text size="xxsmall">
                ID #: {symbol}
              </Text>
            </Box>

            <Box direction="row" gap="xsmall">
              <Text size="xxsmall">Matures: </Text>
              <Text size="xxsmall" weight="bold">
                { moment(maturity).format('MMM YYYY') } ( { moment(maturity).toNow() } )
              </Text>
            </Box>
            <Box direction="row" gap="xsmall">
              <Text size="xxsmall">Current value:</Text>{' '}
              <Text size="xxsmall" weight="bold">{`${currentValue} DAI`}</Text>
            </Box>
          </Box>
        </Box>

        <Box 
          direction='row' 
          background='#d4f8d4' 
          pad='medium' 
          align='center' 
          justify='evenly'
          round={{ size:'xsmall', corner:'right' }}
          gap='small'
        >
          <Box direction='column'>
            <Text size='xxsmall'>Current Price:</Text>
            <Text size='small'>1.01 Dai</Text>
            {/* <Text size='xxsmall'>Liquidation Price</Text>
            <Text size='small'>150</Text> */}
          </Box>
          <Box>
            <Text size='xxsmall'>Current Balance:</Text>
            <Text size='small'>25 yDai</Text>
            {/* <Text size='xxsmall'>Borrowing Power:</Text>
            <Text size='small'>13 yDai</Text> */}
          </Box>
        </Box>
      </Box>
      
      <BuySellAction activeSeries={activeSeries} fixedOpen={false} />

      <TransactionHistory activeSeries={activeSeries} fixedOpen={false} />


    </Box>
  );
};

export default Lend;