import React from 'react';
import { Box, Button, Image, Select, TextInput, Text, Heading, Collapsible } from 'grommet';
import { 
  FiClock as Clock,
} from 'react-icons/fi';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { useYDai, useTxActive } from '../hooks';

import { IYieldSeries } from '../types';
import ethLogo from '../assets/images/tokens/eth.svg';
import SeriesDescriptor from '../components/SeriesDescriptor';
import InlineAlert from '../components/InlineAlert';
import ApprovalPending from '../components/ApprovalPending';
import TransactionPending from '../components/TransactionPending';

interface IRedeemProps {
  close?:any,
}

const Redeem  = ({ close }:IRedeemProps)  => {

  const [redeemPending, setRedeemPending] = React.useState<boolean>(false);
  const [redeemDisabled, setRedeemDisabled] = React.useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = React.useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = React.useState<string|null>(null);

  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);
  const { isLoading, activeSeries } = seriesState;

  const { state: userState, actions: userActions } = React.useContext(UserContext);

  const { isMature, redeem, redeemActive } = useYDai();
  const [ txActive ] = useTxActive(['redeem']);

  const redeemProcedure = async () =>{
    setRedeemPending(true);
    await redeem(activeSeries.yDaiAddress, activeSeries.yDaiBalance);
    await Promise.all([
      userActions.updatePosition(),
      seriesActions.updateActiveSeries()
    ]);
    setRedeemPending(false);
  };

  /* redeem button disabled logic */ 
  React.useEffect( () => {
    if ( activeSeries && activeSeries?.yDaiBalance_ > 0 ){
      setRedeemDisabled(true);
    }
    setRedeemDisabled(true);

  }, [activeSeries]);

  return (

    <>
      <Box flex='grow' align='center' fill='horizontal'>

        <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />

        { txActive?.type !== 'REDEEM' &&
        <Box 
          gap='medium' 
          margin={{ vertical:'large' }}  
          pad='medium'     
          round='small'
          fill='horizontal'
          border='all'
          // background='brand-transparent'
          // elevation='small'
        >    
          <Box direction='row' gap='small' align='center' fill>          
            <Box>
              <Clock />
            </Box>
            <Box> 
              <Text size='xlarge' color='brand' weight='bold'>This series has matured.</Text>         
            </Box>
          </Box>

          <Box
            round='xsmall'
            background={(redeemDisabled) ? 'brand-transparent' : 'brand'}
            onClick={(redeemDisabled)? ()=>{}:()=>redeemProcedure()}  
            pad='small'
            align='center'
          >
            <Text 
              weight='bold'
              size='large'
              color={(redeemDisabled) ? 'text-xweak' : 'text'}
            >
              {`Redeem ${!activeSeries && activeSeries?.yDaiBalance_.toFixed(4) || ''} Dai`}
            </Text>
          </Box>               
        </Box>}
        { redeemActive && !txActive && <ApprovalPending /> } 
        { txActive && <TransactionPending msg={`Redeeming your ${activeSeries?.yDaiBalance_.toFixed(4)} Dai.`} tx={txActive} /> }
      </Box>
    </>
  );
};

Redeem.defaultProps={ close:null };

export default Redeem;
