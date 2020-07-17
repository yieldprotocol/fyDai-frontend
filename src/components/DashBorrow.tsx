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

  const [ txHistory, setTxHistory] = React.useState<any>([]);

  const { state: { deployedSeries, deployedContracts, yieldData, userData }, actions } = React.useContext(YieldContext);

  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading, seriesAggregates, activeSeries } = seriesState;
  const {
    maxDaiAvailable_,
    // estimateRatio,
    debtValue_,
    collateralValue_,
    collateralAmount_,
    collateralRatio_,
  } = seriesAggregates;

  React.useEffect(()=> {
    const _txHist = userData?.txHistory?.items || [];
    const txHist = _txHist.filter((x:any) => x.event==='Borrowed' ).map((x:any) => {
      return {
        event: x.args_[3]>0 ? 'Borrow' : 'Repay',
        date: moment(x.date_).format('D MMM YYYY'),
        amount: ethers.utils.formatEther( x.args_[3] ),
      };
    });
    setTxHistory(txHist);
  }, [ userData ]);

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
            <Text color='brand' weight='bold' size='large'> { collateralAmount_? `${collateralAmount_} Eth`: '' }</Text>
          </Box>

          <Box gap='small'>
            <Text color='text-weak' size='xxsmall'> Collateralisation </Text>
            <Text color='brand' weight='bold' size='large'> { collateralRatio_? `${collateralRatio_} %`: '' } </Text>
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
          <Box gap='small'>
            <Text color='text-weak' size='xxsmall'> Current Total Debt Value </Text>
            <Text color='brand' weight='bold' size='large'> { debtValue_? ` approx. ${debtValue_.toFixed(2)}`: '' }</Text>
          </Box>

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
              Series List here
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
            { txHistory.length > 0 ? txHistory.map((x:any, i:number)=>{
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
