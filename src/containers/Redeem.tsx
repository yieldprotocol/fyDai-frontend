import React from 'react';
import { Box, Button, Image, Select, TextInput, Text, Heading, Collapsible } from 'grommet';
import { 
  FiCheckCircle, 
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiSettings as SettingsGear,
  FiClock as Clock,
} from 'react-icons/fi';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { useYDai } from '../hooks';

import { IYieldSeries } from '../types';
import ethLogo from '../assets/images/tokens/eth.svg';
import SeriesDescriptor from '../components/SeriesDescriptor';
import InlineAlert from '../components/InlineAlert';

interface IRedeemProps {
  close?:any,
}

const Redeem  = ({ close }:IRedeemProps)  => {

  const [redeemPending, setRedeemPending] = React.useState<boolean>(false);
  const [redeemDisabled, setRedeemDisabled] = React.useState<boolean>(true);

  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

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

    if ( activeSeries?.yDaiBalance_ === 0 ){
      setRedeemDisabled(true);
    }
    setRedeemDisabled(false);
  }, [activeSeries]);

  return (

    <>
      <Box flex='grow' gap='medium' align='center' fill='horizontal'>
        
        {/* <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Selected series</Text>
        <SeriesDescriptor activeView='lend' /> */}

        <Box fill gap='small' pad={{ horizontal:'medium' }}>
          <Box fill direction='row-responsive' justify='start' gap='large'>
            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Portfolio Value at Maturity</Text>
                <Help />
              </Box>
              <Text color='brand' weight='bold' size='medium'> {activeSeries && `${activeSeries?.yDaiBalance_.toFixed(2)} Dai` || '-'} </Text>
            </Box>

            <Box gap='small'>
              {/* somthing else here */}
            </Box>
          </Box>
        </Box>

        <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />

        <Box gap='medium' margin={{ vertical:'large' }}>    
          <Box alignSelf='center' direction='row' gap='small' align='center' fill>          
            <Box>
              <Clock />
            </Box>
            <Box> 
              <Text size='xlarge' color='brand' weight='bold'>This series has matured.</Text>         
            </Box>
          </Box>  
    
          { activeSeries?.yDaiBalance_ > 0 &&
            <Box
              round='small'
              background={(redeemDisabled) ? 'brand-transparent' : 'brand'}
              onClick={(redeemDisabled)? ()=>{}:()=>redeemProcedure()}
              align='center'             
            >
              <Box pad='small'>
                <Text 
                  weight='bold'
                  size='large'
                  color={( redeemDisabled) ? 'text-xweak' : 'text'}
                >
                  {`Redeem your ${activeSeries.yDaiBalance_.toFixed(4) || ''} Dai`}
                </Text>
              </Box>
            </Box>}  
                     
        </Box>
      </Box>
    </>
  );
};

Redeem.defaultProps={ close:null };

export default Redeem;
