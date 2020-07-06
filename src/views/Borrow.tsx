import React from 'react';
import moment from 'moment';
import { Box, Heading, Text} from 'grommet';
import RotateLoader from 'react-spinners/RotateLoader';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { IYieldSeries } from '../types';

import DepositWithdraw from '../components/DepositWithdraw';
import BorrowRepay from '../components/BorrowRepay';

interface BorrowProps {
  setActiveSeries: any,
  activeSeries:IYieldSeries,
  setShowSeriesLayer: any, 
}

const Borrow = ({ setActiveSeries, activeSeries, setShowSeriesLayer }:BorrowProps) => {

  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  // const [ nextColor, setNextColor ] = React.useState<string>('');

  const [ activePosition, setActivePosition ] = React.useState<any>(null);
  const [ borrowRepayActive, setBorrowRepayActive ] = React.useState<boolean>(true);
  const [ depositWithdrawActive, setDepositWithdrawActive ] = React.useState<boolean>(false);

  const { isLoading: positionsLoading, positionsData } = seriesState; 
  const { isLoading: yieldLoading, userData, deployedSeries, deployedCore, yieldData, makerData }  = yieldState;


  React.useEffect( () => {
    ( async () => {
      !positionsLoading && await seriesActions.getPositions([activeSeries]);
      setActivePosition(positionsData.get(activeSeries.symbol));
    })();
    console.log(seriesState);
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
            <Text weight='bold' size='xsmall'> Collateral Balance </Text>
          </Box>
          <Box
            background='brand-transparent'
            round
            pad={{ horizontal:'small', vertical:'xsmall' }}
          >
            <Text size='xsmall' color='brand'>{userData.ethPosted_} ETH</Text>
          </Box>
          {/* <Box
            background='secondary-transparent'
            round
            pad={{ horizontal:'small', vertical:'xsmall' }}
          >
            <Text size='xsmall' color='secondary'>{userData.chaiPosted_} DAI</Text>
          </Box> */}
        </Box>

        <Box direction='row' gap='small' align='baseline'> 
          <Text weight='bold' size='xsmall'>Maturity: </Text>
          <Box round border='all' pad={{ horizontal:'small', vertical:'xsmall' }}>
            <Text size='xsmall'>{moment(activePosition?.maturity_).format('MMMM DD, YYYY')}</Text>
          </Box>
        </Box>
      </Box>

      <Box flex='grow' direction='column'>
        <Box direction='row-responsive' gap='small' justify='between'>
          <DepositWithdraw
            activeSeries={activeSeries}
            active={depositWithdrawActive}
          />
          <BorrowRepay
            activeSeries={activeSeries}
            active={userData.ethPosted_ > 0}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Borrow;