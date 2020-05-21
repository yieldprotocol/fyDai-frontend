import React from 'react';
import { Box, DropButton, Stack, Text, Collapsible } from 'grommet';
import moment from 'moment';

import { IYieldSeries } from '../types';

type YieldSeriesProps = {
  series: IYieldSeries;
  seriesAction: any;
  children: any;
  highlighted?: boolean;
};

function YieldSeries({ series, seriesAction, children, highlighted }: YieldSeriesProps) {

  const {
    maturityDate: date,
    interestRate: interest,
    currentValue: value,
    balance,
    debt,
  } = series;

  // const [open, setOpen] = React.useState<boolean>(false);

  return (
    <Box
      elevation="xsmall"
      round="small"
      pad={{ horizontal: 'medium' }}
      background='background-front'
      style={highlighted?{ zIndex:20 }:{ zIndex:0 }}
    >
      <Box
        onClick={() => seriesAction()}
        // onClick={() => setOpen(!open)}
        pad={{ horizontal: 'medium', bottom: 'small', top: 'small' }}
        margin={{ vertical:'xsmall' }}
        align="center"
        justify="between"
        direction="row"
        hoverIndicator={{ color: 'lightgrey' }}
        background={highlighted? { color: 'lightgrey' }: {}}
        round="small"
      >

        <Box direction="column">
          <Text weight="bold"> yDai-{moment(date).format('MMYY')}</Text>
          <Box
            round
            align="center"
            pad={{ horizontal: 'small', vertical: 'none' }}
            background="brand"
          >
            <Text size="xsmall"> {interest}%</Text>
          </Box>
          {/* <Box direction='row' gap='xsmall'> */}
          {/* </Box> */}
        </Box>

        <Box direction="column">
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
      </Box>
      { children }
    </Box>
  );
}

export default YieldSeries;
