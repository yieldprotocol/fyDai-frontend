import React from 'react';
import { Box } from 'grommet';

import PageHeader from '../components/PageHeader';

const Amm = () => {
  return (
    <Box
      gap="small"
      pad={{ vertical: 'large', horizontal: 'small' }}
      fill="horizontal"
      justify="between"
    >
      <Box
        direction="row"
        fill="horizontal"
        pad={{ bottom: 'large', horizontal: 'none' }}
        justify="between"
        align="center"
      >
        <PageHeader
          title="AMM"
          subtitle="Description of AMM"
          tipPrimary="Tip: Convert your Maker vault"
          tipSecondary="View more tips"
        />
      </Box>
    </Box>
  );
};

export default Amm;
