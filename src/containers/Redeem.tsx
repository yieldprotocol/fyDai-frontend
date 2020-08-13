import React from 'react';
import { Box, Button, Image, Select, TextInput, Text, Heading, Collapsible } from 'grommet';
import { 
  FiCheckCircle, 
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiSettings as SettingsGear,
} from 'react-icons/fi';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { useYDai } from '../hooks';

import { IYieldSeries } from '../types';
import ethLogo from '../assets/images/tokens/eth.svg';

interface IRedeemProps {
  close?:any,
}

const Redeem  = ({ close }:IRedeemProps)  => {

  const [redeemPending, setRedeemPending] = React.useState<boolean>(false);
  const [redeemDisabled, setRedeemDisabled] = React.useState<boolean>(true);

  const { state: yieldState, actions: yieldActions } = React.useContext(YieldContext);
  const { deployedContracts } = yieldState;

  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading, activeSeries } = seriesState;

  const { state: userState, actions: userActions } = React.useContext(UserContext);
  const {
    daiBalance_,
    ethBorrowingPower_: maximumDai
  } = userState.position;

  const { isMature, redeem, redeemActive } = useYDai();

  const redeemProcedure = async () =>{
    setRedeemPending(true);
    await redeem(activeSeries.yDaiAddress, activeSeries.yDaiBalance);
    await Promise.all([
      userActions.updatePosition(),
      seriesActions.updateActiveSeries()
    ]);
    setRedeemPending(false);
  };

  React.useEffect( () => {
    (activeSeries?.yDaiBalance_ > 0) && setRedeemDisabled(false);
    // (async () => {
    //   const mature = await isMature(activeSeries.yDaiAddress);
    //   setRedeemDisabled(!mature);
    // })();
  }, [activeSeries]);

  return (

    <Box fill gap='medium' margin={{ vertical:'large' }}>
      
      <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Redeem Dai</Text>
      <Box
        direction='row-responsive'
        fill='horizontal'
        gap='small'
        align='center'
      />

      <Box fill gap='small' pad={{ horizontal:'medium' }}>
        <Box fill direction='row-responsive' justify='between'>

          <Box gap='small'>
            <Box direction='row' gap='small'>
              <Text color='text-weak' size='xsmall'>Current Unit Value</Text>
              <Help />
            </Box>
            <Text color='brand' weight='bold' size='medium'>
              1.01* - no
            </Text>
          </Box>

          <Box gap='small'>
            <Box direction='row' gap='small'>
              <Text color='text-weak' size='xsmall'>Total redeemable value</Text>
              <Help />
            </Box>
            <Text color='brand' weight='bold' size='medium'>
              { activeSeries.yDaiBalance_.toFixed(4) }          
            </Text>
          </Box>         
        </Box>

        <Box fill direction='row-responsive' justify='between'>
          {/* next block */}
        </Box>
      </Box>

      <Box
        fill='horizontal'
        round='small'
        background={(redeemDisabled) ? 'brand-transparent' : 'brand'}
        onClick={(redeemDisabled)? ()=>{}:()=>redeemProcedure()}
        align='center'
        pad='small'
      >
        <Text 
          weight='bold'
          size='large'
          color={( redeemDisabled) ? 'text-xweak' : 'text'}
        >
          {`Redeem ${activeSeries.yDaiBalance_.toFixed(4) || ''} Dai`}
        </Text>
      </Box>
    </Box>
 
  );
};

Redeem.defaultProps={ close:null };

export default Redeem;
