import React from 'react';
import { ethers } from 'ethers';
import moment from 'moment';
import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';
import { 
  FiPlusCircle as PlusCircle,
  FiMinusCircle as MinusCircle,
  FiChevronRight as Right,
  FiChevronLeft as Left,
  FiArrowDownLeft as DownLeft,
  FiArrowUpRight as UpRight,

} from 'react-icons/fi';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';


interface DashLendProps {
  // borrowFn:any
  // activeSeries?:IYieldSeries,
  // maxValue?:number
}

const DashLend = () => {

  const [ addCollateral, setAddCollateral ] = React.useState<boolean>(false);
  const [ borrowType, setBorrowType ] = React.useState<string>('yDai');

  const { state: { deployedContracts, yieldData, userData }, actions } = React.useContext(YieldContext);

  const txHistory = userData?.txHistory?.items || [];
  const txHistory_ = txHistory.filter((x:any) => x.event==='Borrowed' ).map((x:any) => {
    return {
      event: x.args_[3]>0 ? 'Borrow' : 'Repay',
      date: moment(x.date_).format('D MMM YYYY'),
      amount: ethers.utils.formatEther( x.args_[3] ),
    };
  });

  // console.log(userData?.txHistory?.seriesTxs);

  return (
    <Box gap='small' direction='row'>
      <Box basis='1/3' flex gap='small'> 
        <Text color='text-weak' size='xsmall'>Your Positions </Text>
        <Box
          background='background-front'
          fill
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
            <Box basis='1/2'><Text color='text-weak' size='xsmall'>SERIES</Text></Box>
            <Box><Text color='text-weak' size='xsmall'>VALUE AT MATURITY</Text></Box>
            <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box>
            {/* <Box /> */}
          </Box>
          series list here.
        </Box>


      </Box>

      <Box basis='2/3' gap='small'>
        <Text color='text-weak' size='xsmall'>Overview </Text>
        <Box gap='small' direction='row-responsive' fill='horizontal' justify='between' margin={{ bottom:'large' }}>  
          <Box
            background='background-front'
            fill='horizontal'
            round='small'
            pad='large'
          // elevation='medium'
            border
          >
            <Box direction='row' gap='small'>
              <Box pad='small'>
                <DownLeft />
              </Box>
              <Box>
                <Text color='text-weak' size='xsmall'>Current Portfolio Value</Text> 
                <Text color='brand' weight='bold' size='large'>140 Dai</Text> 
              </Box>
            </Box>
          </Box>
          <Box
            background='background-front'
            fill='horizontal'
            round='small'
            pad='large'
          // elevation='medium'
            border
          >
            <Box direction='row' gap='small'>
              <Box pad='small'>
                <UpRight />
              </Box>
              <Box>
                <Text color='text-weak' size='xsmall'>Total Value at Maturity</Text> 
                <Text color='brand' weight='bold' size='large'>150 Dai</Text> 
              </Box>
            </Box>
          </Box>
        </Box>

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
            overflow='auto'
          >
            <Box basis='2/5'><Text color='text-weak' size='xsmall'>TRANSACTION</Text></Box>
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

  );
};

export default DashLend;