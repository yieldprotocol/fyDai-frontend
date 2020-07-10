import React from 'react';
import { ethers } from 'ethers';
import moment from 'moment';

import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';
import { 
  FiPlusCircle as PlusCircle,
  FiMinusCircle as MinusCircle,
  FiChevronRight as Right,
  FiChevronLeft as Left,
} from 'react-icons/fi';

import { Chart } from 'react-charts';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';

interface DashBorrowProps {
  // borrowFn:any
  // activeSeries?:IYieldSeries,
  // maxValue?:number
}

const DashBorrow = ({ }:DashBorrowProps) => {

  const [ addCollateral, setAddCollateral ] = React.useState<boolean>(false);

  const { state: { deployedSeries, deployedContracts, yieldData, userData }, actions } = React.useContext(YieldContext);

  const txHistory = userData?.txHistory?.items || [];
  const txHistory_ = txHistory.filter((x:any) => x.event==='Borrowed' ).map((x:any) => {

    const eventType = x.args_[3]>0 ? 'Borrow' : 'Repay';
    // const series = deployedSeries.get(x.args_[2]);
    const eventName = `${eventType} `;
    const date = moment(x.date_).format('D MMM YYYY');
    const amount = ethers.utils.formatEther( x.args_[3] );

    return { eventType, date, amount };
  });

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
          round='medium'
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
          round='medium'
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
          round='medium'
          pad='large'
          // elevation='medium'
          border
        >
          borrow column 3
          {/* <Chart data={data} axes={axes} /> */}
        </Box>}
      </Box>
      
      
      <Box direction='row-responsive' gap='small'>
        <Box basis='1/3' flex gap='small'>
          <Text color='text-weak' size='xsmall'>Your Positions </Text>
          <Box
            background='background-front'
            fill
            round='medium'
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
              round={{ size:'medium', corner:'top' }}
            >
              <Box basis='1/2'><Text color='text-weak' size='xsmall'>SERIES</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>DEBT</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box>
            </Box>
            <Box>
              sereis list here
 
            </Box>
            
          </Box>

        </Box>
        <Box basis='2/3' fill gap='small'>
          <Text color='text-weak' size='xsmall'>Your History</Text>
          <Box
            background='background-front'
            fill='horizontal'
            round='medium'
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
              round={{ size:'medium', corner:'top' }}
            >
              <Box basis='1/2'><Text color='text-weak' size='xsmall'>TRANSACTION</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>AMOUNT</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>DATE</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box>
            </Box>
            { txHistory_.length > 0 ? txHistory_.map((x:any, i:number)=>{
              const key_ = i;
              return (
                <Box
                  pad='small'
                  direction='row'
                  gap='xsmall'
                  key={key_}
                  justify='between'
                  hoverIndicator='background-mid'
                  onClick={()=>console.log('click')}
                >
                  <Box basis='2/5'> {x.event} </Box>
                  <Box> {x.amount} </Box>
                  <Box> {x.date} </Box>
                  <Box> ACTION A </Box>
                </Box>
              );
            }):
            <Box>
              Loading history...
            </Box>}

          </Box>
        </Box>
      </Box>

    </Box>

  );
};

export default DashBorrow;
