import React, { useState, useContext } from 'react';
import { Box, Text } from 'grommet';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';

import Redeem from '../containers/Redeem';
import Lend from '../containers/Lend';

import PageHeader from '../components/PageHeader';
import SeriesDescriptor from '../components/SeriesDescriptor';
import Authorization from '../components/Authorization';


interface LendProps {
  activeView?: string;
}

const LendView = ({ activeView: activeViewFromProp  }:LendProps) => {

  const [ activeView, setActiveView ] = useState<string|undefined>( activeViewFromProp );

  const { state: yieldState, yieldActions } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);

  const { isLoading: positionsLoading, seriesData, activeSeries } = seriesState; 

  return (
    <>
      <PageHeader
        title="Lend"
        subtitle="Description of lending"
        tipPrimary="Tip: Convert your Maker vault"
        tipSecondary="View more tips"
      />
      <Box
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
        pad='large'
        gap='medium'
      >
        <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text>
        <SeriesDescriptor activeView='lend' />
        { activeSeries?.isMature === false  && <Lend /> }
        { activeSeries?.isMature === true && <Redeem /> }

      </Box>
    </>
  );
};

LendView.defaultProps = {
  activeView: 'lend',
};

export default LendView;
