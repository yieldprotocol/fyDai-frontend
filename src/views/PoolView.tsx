import React from 'react';
import { Box } from 'grommet';
import PageHeader from '../components/PageHeader';
import Pool from '../containers/Pool';
import RaisedBox from '../components/RaisedBox';

const PoolView = () => {
  return (
    <>
      <PageHeader
        title="Pool"
        subtitle="Description of pool"
        tipPrimary="Tip: Convert your Maker vault"
        tipSecondary="View more tips"
      />
      <RaisedBox
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
      >
        <Pool />
      </RaisedBox>
    </>
  );
};

export default PoolView;
