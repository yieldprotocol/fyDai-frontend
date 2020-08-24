import React from 'react';
import { Box, Text } from 'grommet';

import PageHeader from '../components/PageHeader';
import SeriesDescriptor from '../components/SeriesDescriptor';
import Pool from '../containers/Pool';

const PoolView = () => {
  return (
    <>
      <PageHeader
        title="Pool"
        subtitle="Description of pool"
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
        <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected pool</Text>
        <SeriesDescriptor activeView='pool' />
        <Pool /> 
      </Box>
    </>
  );
};

export default PoolView;
