import React from 'react';
import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';
import { 
  FiPlusCircle as PlusCircle,
  FiMinusCircle as MinusCircle,
  FiChevronRight as Right,
  FiChevronLeft as Left,
} from 'react-icons/fi';

import { Chart } from 'react-charts';

import { useMaker } from '../hooks/makerHooks';

interface DashBorrowProps {
  // borrowFn:any
  // activeSeries?:IYieldSeries,
  // maxValue?:number
}

const DashBorrow = ({ }:DashBorrowProps) => {

  const [ addCollateral, setAddCollateral ] = React.useState<boolean>(false);
  const [ borrowType, setBorrowType ] = React.useState<string>('yDai');

  // const data = React.useMemo(
  //   () => [
  //     {
  //       label: 'Series 1',
  //       data: [
  //         [0, 0.95],
  //         [1, 0.96],
  //         [2, 0.97],
  //         [3, 0.98],
  //         [4, 0.99],
  //         [5, 1],
  //       ],
  //     },
  //     {
  //       label: 'Series 2',
  //       data: [
  //         [0, 0.89],
  //         [1, 0.90],
  //         [2, 0.91],
  //         [3, 0.92],
  //         [4, 0.93],
  //         [5, 0.94],
  //         [6, 0.95],
  //         [7, 0.96],
  //         [8, 0.97],
  //         [9, 0.98],
  //         [10, 0.99],
  //         [11, 1],
  //       ],
  //     },
  //   ],
  //   []
  // );

  // const axes = React.useMemo(
  //   () => [
  //     { primary: true, type: 'time', position: 'bottom' },
  //     { type: 'linear', position: 'left' },
  //   ],
  //   []
  // );

  return (
    <Box gap='small'>
      <Text color='text-weak' size='xsmall'>Overview </Text>
      <Box gap='small' direction='row-responsive' fill='horizontal' justify='between' margin={{ bottom:'large' }}>  

        <Box
          background='background-front'
          fill='horizontal'
          round='small'
          pad={{ vertical:'small', horizontal:'large' }}
          // elevation='medium'
          border
          direction='row'
          justify='between'
          align='center'
          basis={addCollateral? '2/3': '1/3'}
        >
          <Box gap='small'>
            <Text color='text-weak' size='xxsmall'> Collateral </Text>
            <Text color='brand' weight='bold' size='large'> 23 Eth </Text>
          </Box>

          <Box gap='small'>
            <Text color='text-weak' size='xxsmall'> Collateralisation </Text>
            <Text color='brand' weight='bold' size='large'> 123% </Text>
          </Box>
          {!addCollateral? <PlusCircle size='25' color='brand' onClick={()=>setAddCollateral(!addCollateral)} />
            :
          <Left size='25' color='brand' onClick={()=>setAddCollateral(!addCollateral)} />}
        </Box>

        <Box
          basis='1/3'
          background='background-front'
          fill='horizontal'
          round='small'
          pad='large'
          // elevation='medium'
          border

        >
          BORROW col2
        </Box>
        {!addCollateral &&
        <Box
          basis='1/3'
          background='background-front'
          fill='horizontal'
          round='small'
          pad='large'
          // elevation='medium'
          border

        >
          borrow column 3
          {/* <Chart data={data} axes={axes} /> */}
        </Box>}
      </Box>
      
      
      <Box direction='row-responsive' gap='small'>
        <Box basis='1/3' fill gap='small'> 
          <Text color='text-weak' size='xsmall'>Your Positions </Text>
          <Box
            background='background-front'
            fill='horizontal'
            round='small'
            pad='large'
            // elevation='medium'
            border

          >
            box 1
          </Box>

        </Box>
        <Box basis='2/3' fill gap='small'>
          <Text color='text-weak' size='xsmall'>Your History</Text>
          <Box
            background='background-front'
            fill='horizontal'
            round='small'
            pad='none'
            // elevation='medium'
            border
          >
            <Box 
              direction='row'
              gap='xsmall'
              justify='between'
              background='background-mid'
              pad='small'
              round={{ size:'small', corner:'top' }}
            >
              <Box basis='1/2'><Text color='text-weak' size='xsmall'>TRANSACTION</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>AMOUNT</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>DATE</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box>
            </Box>

            { [1, 2, 3, 4, 5].map((x:any, i:number)=>{
              const key_ = i;
              return (
                <Box
                  pad='small'
                  direction='row'
                  gap='xsmall'
                  key={key_}
                  justify='between'
                >
                  <Box basis='1/2'> {x} </Box>
                  <Box> {x} </Box>
                  <Box> {x} </Box>
                  <Box> {x}</Box>
                </Box>

              );
            })}

          </Box>
        </Box>
      </Box>

    </Box>

  );
};

export default DashBorrow;
