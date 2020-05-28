import React from 'react';
import { Box, Heading, Header, Text } from 'grommet';
import moment from 'moment';
import {
  FaTimes as Close,
  FaInfoCircle as Info, 
} from 'react-icons/fa';

import { IYieldSeries } from '../types';

// import SeriesForm from './SeriesForm';
import YieldPosition from './YieldPosition';

import AddCollateralForm from './AddCollateralForm';

import { PositionsContext } from '../contexts/PositionsContext';

type YieldSeriesProps = {
  series: IYieldSeries;
  seriesAction: any;
  highlighted?: boolean;
  children?:any;
};

const YieldSeries = ({ 
  series, 
  seriesAction, 
  highlighted }: YieldSeriesProps) => {

  const {
    id,
    maturityDate: date,
    interestRate: interest,
    currentValue: value,
  } = series;

  const [ seriesPosition, setSeriesPosition] = React.useState<any>();
  const [ showDepositForm, setShowDepositForm] = React.useState<boolean>(!seriesPosition);

  const { state: positionsState, dispatch: positionsDispatch } = React.useContext(PositionsContext);

  React.useEffect(()=>{
    setSeriesPosition(positionsState.positionsData.find((x:any)=> x.series_id === series.id ));
  }, [positionsState]);

  return (

    <Box
      round="small"
      background='background-front'
      style={{ minWidth:'300px', minHeight:'400px' }}
      fill
      justify='between'
    >
      <Box>
        <Header 
          background='background-frontheader'
          onClick={() => seriesAction()}
          pad={{ horizontal: 'medium', bottom: 'small', top: 'small' }}
          align="center"
          justify="between"
          direction="row"
          hoverIndicator={{ color: 'lightgrey' }}
          round="small"
        >
          <Box direction="column">
            <Text weight="bold"> {id}</Text>
            <Box
              round
              align="center"
              pad={{ horizontal: 'small', vertical: 'none' }}
              background="brand"
            >
              <Text size="xsmall"> {interest}%</Text>
            </Box>
          </Box>
          <Box direction="column" align='end'>
            <Box direction="row" gap="xsmall">
              <Text size="xsmall">Matures: </Text>
              <Text size="xsmall" weight="bold">
                {moment(date).format('MMM YYYY')}
              </Text>
            </Box>
            <Box direction="row" gap="xsmall">
              <Text size="xsmall">Current value:</Text>{' '}
              <Text size="xsmall" weight="bold">{`${value} DAI`}</Text>
            </Box>
          </Box>
          {highlighted && <Box pad='xsmall'><Close /></Box>}
        </Header>

        <Box pad='medium'>
          { seriesPosition ?
            <>
              <Box><Heading level='5'> Positions held in this series:</Heading></Box>
              <Box margin={{ vertical:'none' }} gap='small'>
                { seriesPosition.collateral.map((x:any)=>{
                  return (
                    <Box key={x.type}>
                      <YieldPosition position={x} input={false} selectPositionFn={(e:any)=>console.log(e)} />
                    </Box>
                  );
                })}
              </Box>
            </>
            :
            <Box 
              direction='row'
              gap='small'
              color='border'
              border='all'
              margin='large'
              pad='small'
              justify='center'
              align='baseline'
              round='small'
            >
              {/* <Info /> */}
              No collateral deposited yet.
            </Box>}
        </Box>
      </Box>

      <Box background='background-frontheader' round direction='row' justify='center'>
        <AddCollateralForm
          series={series}
          hasPosition={!!seriesPosition}
        />
      </Box>

    </Box>
  );
};

export default YieldSeries;
