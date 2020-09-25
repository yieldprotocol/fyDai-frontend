import React, { useEffect, useState, useContext } from 'react';
import { Box, Text } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { useEDai, useTxActive } from '../hooks';

import InlineAlert from '../components/InlineAlert';
import ApprovalPending from '../components/ApprovalPending';
import TxPending from '../components/TxPending';
import ActionButton from '../components/ActionButton';
import SeriesMatureBox from '../components/SeriesMatureBox';

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
    
    <Box flex='grow' align='center' fill='horizontal'>
      <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />
      { txActive?.type !== 'REDEEM' &&
      <>
        <ActionButton
          onClick={()=>redeemProcedure()} 
          label={`Redeem ${activeSeries?.eDaiBalance_ || ''} Dai`}
          disabled={redeemDisabled}
          hasDelegatedPool={true}
        />
      </>}

      { redeemActive && !txActive && <ApprovalPending /> } 
      { txActive && <TxPending msg={`You are redeeming ${activeSeries?.eDaiBalance_} DAI`} tx={txActive} /> }
    </Box>
  );
};

Redeem.defaultProps={ close:null };

export default Redeem;
