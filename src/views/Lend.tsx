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
  { maturityDate: 1, interestRate: 3.22, currentValue: 0.9921 },
  { maturityDate: 2, interestRate: 3.51, currentValue: 0.9829 },
  { maturityDate: 3, interestRate: 3.69, currentValue: 0.9732 },
  { maturityDate: 4, interestRate: 3.78, currentValue: 0.9636 },
  { maturityDate: 5, interestRate: 3.91, currentValue: 0.9636 },
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

      <List
        // primaryKey="maturityDate"
        // secondaryKey="interestRate"
        data={someData}
      />

      {/* {someData.map((x, i)=> <Box key={x.maturityDate} hoverIndicator={true}> {x.maturityDate} </Box>)} */}

      {/* <Stack guidingChild={1}>
        <Diagram
          connections={
            [{ fromTarget: 'today', toTarget: '0', thickness:'hair', color: 'dark-3' }]
              .concat(
                someData.map((x, i)=> ({
                  fromTarget: `${i}`,
                  toTarget: `${i+1}`,
                  thickness: 'hair',
                  color: 'dark-3',
                  label: '3-Months',
                })
                ))
          }
        />
        <Box>
          <Grid
            columns={{
              count: 6,
              size: 'auto'
            }}
            margin="medium"
            gap="medium"
          >
            <Box direction="column" gap='small'>
              <Box id='today' pad="xsmall" background="brand" round> Today </Box>
              {someData.map((x, i)=>{
                return (
                  <Box id={`${i}`} key={x.maturityDate.toTimeString()} pad="xsmall" background="light-4" round>
                    {i+1}
                  </Box>
                );
              })}
            </Box>
          </Grid>
        </Box>
      </Stack> */}

    </Box>
  );
};

export default Lend; 