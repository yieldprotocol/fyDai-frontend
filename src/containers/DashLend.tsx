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

import { SeriesContext } from '../contexts/SeriesContext';
import TxHistory from '../components/TxHistory';
import { UserContext } from '../contexts/UserContext';

import { usePool } from '../hooks';
import InfoGrid from '../components/InfoGrid';

interface DashLendProps {
  // borrowFn:any
  // activeSeries?:IYieldSeries,
  // maxValue?:number
}

const DashLend = () => {

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

  const { sellDai, previewPoolTx }  = usePool();

  const [ currentValue, setCurrentValue ] = React.useState<number>(0);

  React.useEffect(() => {
    console.log(position);
    activeSeries && ( async ()=> {
      const preview = await previewPoolTx('SellYDai', activeSeries.poolAddress, activeSeries.yDaiBalance_);
      setCurrentValue( parseFloat(ethers.utils.formatEther(preview)));
    })();
  }, [ activeSeries, ]);

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
            <Box basis='1/2'><Text color='text-weak' size='xxsmall'>SERIES</Text></Box>
            <Box><Text color='text-weak' size='xxsmall'>VALUE AT MATURITY</Text></Box>
            {/* <Box><Text color='text-weak' size='xsmall'>ACTION</Text></Box> */}
            {/* <Box /> */}
          </Box>
         
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
                {activeSeries?.yDaiBalance_.toFixed(2)}
              </Text>
            </Box>
          </Box>}           
        </Box>
      </Box>

      <Box gap='small'>

        <Text color='text-weak' size='xsmall'>Overview </Text>


        <InfoGrid entries={[
          {
            label: 'Current Collateral',
            visible: true,
            active: true,
            loading: !ethPosted_ && ethPosted_ !== 0,     
            value: ethPosted_ ? `${ethPosted_.toFixed(4)} Eth` : '0 Eth',
            valuePrefix: null,
            valueExtra: null, 
          },

          {
            label: 'Collateralization Ratio',
            visible: true,
            active: collateralPercent_ > 0,
            loading: !ethPosted_ &&  ethPosted_ !== 0,            
            value: (collateralPercent_ && (collateralPercent_ !== 0))? `${collateralPercent_}%`: '',
            valuePrefix: null,
            valueExtra: null, 
          },
        ]}
        />

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
                <Text color='brand' weight='bold' size='large'>{currentValue.toFixed(2)}</Text> 
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
                <Text color='brand' weight='bold' size='large'>{activeSeries?.yDaiBalance_.toFixed(2)}</Text> 
              </Box>
            </Box>
          </Box>
        </Box>



        <Box basis='2/3' gap='small' fill>
          <Text color='text-weak' size='xsmall'>Your History</Text>    
          <TxHistory filterTerms={[ 'Bought', 'Sold' ]} view='lend' /> 
        </Box>


      </Box>
    </Box>

  );
};

export default DashLend;