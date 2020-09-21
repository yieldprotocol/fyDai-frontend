import React, { useEffect, useState, useContext } from 'react';
import { Box, Text } from 'grommet';
import { 
  FiClock as Clock,
} from 'react-icons/fi';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { useEDai, useTxActive } from '../hooks';

import InlineAlert from '../components/InlineAlert';
import ApprovalPending from '../components/ApprovalPending';
import TxPending from '../components/TxPending';
import ActionButton from '../components/ActionButton';
import SeriesDescriptor from '../components/SeriesDescriptor';
import InfoGrid from '../components/InfoGrid';

interface IRedeemProps {
  close?:any,
}

const Redeem  = ({ close }:IRedeemProps)  => {
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { actions: userActions } = useContext(UserContext);

  const [ redeemPending, setRedeemPending] = useState<boolean>(false);
  const [ redeemDisabled, setRedeemDisabled] = useState<boolean>(true);
  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const { redeem, redeemActive } = useEDai();
  const [ txActive ] = useTxActive(['redeem']);

  const redeemProcedure = async () =>{
    if(!redeemDisabled) {
      setRedeemPending(true);
      await redeem(activeSeries.eDaiAddress, activeSeries.eDaiBalance);
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
      setRedeemPending(false);
    }
  };

  /* redeem button disabled logic */ 
  useEffect( () => {
    parseFloat(activeSeries?.eDaiBalance_) > 0 ? 
      setRedeemDisabled(false) 
      : setRedeemDisabled(true);  
  }, [activeSeries]);

  return (
    <>
    <SeriesDescriptor activeView='lend'> 
    {/* <InfoGrid 
      alt
      entries={[
        {
          label: 'Current Debt',
          visible: !!account && !txActive,
          active: true,
          loading: false,     
          value: activeSeries?.ethDebtEDai_? `${activeSeries.ethDebtEDai_} DAI`: '0 DAI',
          valuePrefix: null,
          valueExtra: null, 
        },
        {
          label: 'Dai balance',
          visible: !!account && !txActive,
          active: true,
          loading: repayPending,            
          value: daiBalance_?`${daiBalance_} DAI`: '-',
          valuePrefix: null,
          valueExtra: null,
        },
      ]}
    /> */}
  </SeriesDescriptor>

    <Box
      width={{ max:'750px' }}
      alignSelf='center'
      fill='horizontal'
      background='background-front'
      round='small'
      pad='large'
      gap='medium'
    >
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
        >    
          <Box direction='row' gap='small' align='center' fill>          
            <Box>
              <Clock />
            </Box>
            <Box> 
              <Text size='small' color='brand'> This series has matured.</Text>         
            </Box>
          </Box>

          <ActionButton
            onClick={()=>redeemProcedure()} 
            label={`Redeem ${activeSeries?.eDaiBalance_ || ''} Dai`}
            disabled={redeemDisabled}
          />
                        
        </Box>}
        { redeemActive && !txActive && <ApprovalPending /> } 
        { txActive && <TxPending msg={`You are redeeming ${activeSeries?.eDaiBalance_.toFixed(4)} DAI`} tx={txActive} /> }
      </Box>
    </Box>
    </>
  );
};

Redeem.defaultProps={ close:null };

export default Redeem;
