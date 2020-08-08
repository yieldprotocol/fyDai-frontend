import React from 'react';
import { ethers } from 'ethers';
import moment from 'moment';

import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput, Layer } from 'grommet';
import { 
  FiPlusCircle as PlusCircle,
  FiMinusCircle as MinusCircle,
  FiChevronRight as Right,
  FiChevronLeft as Left,
  FiCheck as Check,
} from 'react-icons/fi';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import DepositAction from './Deposit';

import TxHistory from '../components/TxHistory';

interface DashBorrowProps {
  // borrowFn:any
  // activeSeries?:IYieldSeries,
  // maxValue?:number
}

const DashBorrow = ({ }:DashBorrowProps) => {

  const [ addCollateral, setAddCollateral ] = React.useState<boolean>(false);

  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { activeSeries } = seriesState; 

  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const { position } = userState;
  const { 
    debtValue_,
    ethPosted_,
    collateralPercent_,
    ethBorrowingPower_: maximumDai
  } = position;

  return (
    <Box gap='small'>
      { addCollateral && 
        <Layer onClickOutside={()=>setAddCollateral(false)}>
          <Box
            width={{ max:'750px' }}
            alignSelf='center'
            fill='horizontal'
            background='background-front'
            round='medium'
            pad='large'
          >
            <DepositAction  />
          </Box>
        </Layer>}
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
          basis='2/3'
        >
          <Box gap='small'>
            <Text color='text-weak' size='xxsmall'> Collateral </Text>
            <Text color='brand' weight='bold' size='large'> { ethPosted_? `${ethPosted_.toFixed(2)} Eth`: '' }</Text>
          </Box>

          <Box gap='small'>
            <Text color='text-weak' size='xxsmall'> Collateralisation </Text>
            <Text color='brand' weight='bold' size='large'> { collateralPercent_? `${collateralPercent_.toFixed(2)} %`: '' } </Text>
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
            <Box direction='row' gap='small'>
              <Text color='brand' size='xsmall'> Approx.</Text>
              <Text color='brand' weight='bold' size='large'> { debtValue_? ` ${debtValue_.toFixed(2)} Dai`: '-' }</Text>
            </Box>
          </Box>
        </Box>
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
              <Box basis='1/2'><Text color='text-weak' size='xxsmall'>SERIES</Text></Box>
              <Box><Text color='text-weak' size='xxsmall'>DEBT</Text></Box>
              {/* <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box> */}
            </Box>
            <Box>

              {activeSeries && 
              <Box
                direction='row' 
                justify='between'
                onClick={()=>console.log(activeSeries.maturity)}
                hoverIndicator='background-mid'
                border='top'
                fill
                pad='medium'
              >
                <Box>
                  <Text alignSelf='start' size='xsmall' color='brand'>
                    {activeSeries.yieldAPR_}%
                  </Text>
                </Box>
                <Box>
                  <Text alignSelf='start' size='xsmall' color='brand'>
                    {activeSeries.displayName}
                  </Text>
                </Box>
                <Box>
                  <Text alignSelf='start' size='xsmall' color='brand'>
                    {activeSeries.ethDebtDai_.toFixed(2)}
                  </Text>
                </Box>
              </Box>}
            </Box>
          </Box>
        </Box>

        <Box basis='2/3' fill gap='small'>
          <Text color='text-weak' size='xsmall'>Your History</Text>
          <TxHistory filterTerms={['Bought', 'Repaid', 'Deposited', 'Withdrew']} view='borrow' />
          {/* <Box
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
              <Box basis='2/5'><Text color='text-weak' size='xsmall'>TRANSACTION</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>AMOUNT</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>DATE</Text></Box>
              <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box>
            </Box>
            <Box>
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
                    fill
                  >
                    <Box basis='2/5'><Text>{x.event}</Text> </Box>
                    <Box><Text> {x.amount} </Text></Box>
                    <Box><Text> {x.date} </Text></Box>
                    <Box><Text> : </Text></Box>
                  </Box>
                );
              }):
              <Box align='center'>
                { !isLoading ? 
                  <Text>Loading...</Text> 
                  : 
                  <Text> No history</Text> } 
              </Box>}
            </Box>
          </Box> */}

        </Box>
      </Box>
    </Box>

  );
};

export default DashBorrow;
