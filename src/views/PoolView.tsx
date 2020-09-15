import React, { Suspense, lazy } from 'react';
import { Box } from 'grommet';
import PageHeader from '../components/PageHeader';

const Pool = lazy(() => import('../containers/Pool'));

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
        <Suspense fallback={<Box> loading ... </Box>}>
          <Pool />
        </Suspense>
      </Box>
    </>
  );
};

export default PoolView;
