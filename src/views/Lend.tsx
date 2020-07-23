import React from 'react';
import moment from 'moment';
import { Box, Button, Heading, Text } from 'grommet';
import RotateLoader from 'react-spinners/RotateLoader';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { IYieldSeries } from '../types';

import LendAction from '../components/LendAction';
import PageHeader from '../components/PageHeader';

import BuySell from '../components/x_BuySell';
import Redeem from '../components/Redeem';

interface LendProps {
  setShowSeriesLayer: any;
  activeView?: string;
}

const Lend = ({ setShowSeriesLayer, activeView: viewFromProp  }:LendProps) => {

  const { state: yieldState, yieldActions } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);

  const [ depositWithdrawActive ] = React.useState<boolean>(true);
  const { isLoading: positionsLoading, seriesData, activeSeries } = seriesState; 


  return (

    <Box gap='small' pad={{ vertical:'large', horizontal:'small' }} fill='horizontal' justify='between'>

      <Box
        direction="row"
        fill="horizontal"
        pad={{ bottom: 'large', horizontal: 'none' }}
        justify="between"
        align="center"
      >
        <PageHeader
          title="Lend"
          subtitle="Description of lending"
          tipPrimary="Tip: Convert your Maker vault"
          tipSecondary="View more tips"
        />
      </Box>
      
      <Box
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
        pad='large'
      >
        <LendAction maxValue={12} borrowFn={(x:any)=>console.log(x)} />
      </Box>
    </Box>

  );
};

export default Lend;
