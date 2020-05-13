import React from 'react';
import { Box, Diagram, Stack, Grid, Text, DataTable, Meter, List  } from 'grommet';

import YieldSeries from '../components/YieldSeries';

// const someData = [
//   { maturityDate: new Date('30 June 2020'), interestRate: 3.22, currentValue: 0.9921 },
//   { maturityDate: new Date('31 Sep 2020'), interestRate: 3.51, currentValue: 0.9829 },
//   { maturityDate: new Date('31 Dec 2020'), interestRate: 3.69, currentValue: 0.9732 },
//   { maturityDate: new Date('30 Mar 2021'), interestRate: 3.78, currentValue: 0.9636 },
//   { maturityDate: new Date('30 June 2021'), interestRate: 3.91, currentValue: 0.9636 },
// ];

const someData = [
  { maturityDate: new Date(), interestRate: 3.22, currentValue: 0.9921, balance:0, debt:0 },
  { maturityDate: new Date(), interestRate: 3.51, currentValue: 0.9829, balance:0, debt:0 },
  { maturityDate: new Date(), interestRate: 3.69, currentValue: 0.9732, balance:0, debt:0 },
  { maturityDate: new Date(), interestRate: 3.78, currentValue: 0.9636, balance:0, debt:0 },
  { maturityDate: new Date(), interestRate: 3.91, currentValue: 0.9636, balance:0, debt:0 },
];

const Lend = () => {
  return (
    <Box
      pad='medium'
      round='medium'
      fill
      background='background-front'
      overflow='auto'
    >
      List of available series:

      {someData.map((x, i)=> <Box key={x.maturityDate.toTimeString()}><YieldSeries {...x} /></Box> )}

    </Box>
  );
};

export default Lend; 