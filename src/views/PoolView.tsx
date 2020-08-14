import React from 'react';
import { Box } from 'grommet';

import PageHeader from '../components/PageHeader';

const PoolView = () => {
  return (
    <>
      <PageHeader
        title="Pool"
        subtitle="Description of pool"
        tipPrimary="Tip: Convert your Maker vault"
        tipSecondary="View more tips"
      />
      <Box>
        pool here
      </Box>
    </>
  );
};

export default PoolView;
