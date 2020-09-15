import React, { useEffect, useState, useContext } from 'react';
import { Box } from 'grommet';
import PageHeader from '../components/PageHeader';
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
      >
        <Pool /> 
      </Box>
    </>
  );
};

export default PoolView;
