import React from 'react';
import { Box, Text } from 'grommet';
import moment from 'moment';

import { IYieldSeries } from '../types';

type YieldSeriesProps = {
  series: IYieldSeries;
  seriesAction: any;
  children?: any;
  highlighted?: boolean;
};

const YieldSeriesSummary = ({ 
  series, 
  seriesAction, 
  children, 
  highlighted }: YieldSeriesProps) => {

  const {
    name,
    maturity,
    rate,
    currentValue,
  } = series;

  return (
    <Box
      onClick={() => seriesAction()}
      pad={{ horizontal: 'medium', bottom: 'small', top: 'small' }}
      margin={{ vertical:'xsmall' }}
      align="center"
      justify="between"
      direction="row"
      hoverIndicator={{ color: 'background-frontheader' }}
      // background={highlighted? { color: 'lightgrey' }: {}}
      border={{ color:'background-front' }}
      round="small"
    >
      <Box direction="column">
        <Text weight="bold"> {name}</Text>
        <Box
          round
          align="center"
          pad={{ horizontal: 'small', vertical: 'none' }}
          background="brand"
        >
          {/* <Text size="xsmall"> {rate}%</Text> */}
          <Text size="xsmall"> {rate?.toString()} %</Text>
        </Box>
      </Box>
      <Box direction="column" align='end'>
        <Box direction="row" gap="xsmall">
          <Text size="xsmall">Matures: </Text>
          <Text size="xsmall" weight="bold">
            { moment(maturity).format('MMM YYYY') }
          </Text>
        </Box>
        <Box direction="row" gap="xsmall">
          <Text size="xsmall">Current value:</Text>{' '}
          <Text size="xsmall" weight="bold">{`${currentValue} DAI`}</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default YieldSeriesSummary;
