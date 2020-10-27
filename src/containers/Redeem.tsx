import React, { useEffect, useState, useContext } from 'react';
import { Box } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { useFYDai, useTxActive } from '../hooks';

import InlineAlert from '../components/InlineAlert';
import ApprovalPending from '../components/ApprovalPending';
import TxStatus from '../components/TxStatus';
import ActionButton from '../components/ActionButton';

interface IRedeemProps {
  close?:any,
}

const Redeem  = ({ close }:IRedeemProps)  => {
  const { state: seriesState, actions: seriesActions } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  const { actions: userActions } = useContext(UserContext);

  const { hasBeenMatured, redeem, redeemActive } = useFYDai();
  const [ txActive ] = useTxActive(['redeem']);

  const [ redeemDisabled, setRedeemDisabled] = useState<boolean>(true);
  const [ matured, setMatured ] = useState<boolean>(false);
  
  const [ warningMsg ] = useState<string|null>(null);
  const [ errorMsg ] = useState<string|null>(null);

  const redeemProcedure = async () =>{
    if(!redeemDisabled) {
      await redeem(activeSeries, activeSeries.fyDaiBalance.toString());
      userActions.updateHistory();
      await Promise.all([
        userActions.updatePosition(),
        seriesActions.updateActiveSeries()
      ]);
    }
  };

  /* Set if the series is mature */ 
  useEffect( () => {
    ( async () => activeSeries && setMatured(await hasBeenMatured(activeSeries.fyDaiAddress)))();
  }, [activeSeries]);

  /* redeem button disabled logic */ 
  useEffect( () => {
    parseFloat(activeSeries?.fyDaiBalance_) > 0 && matured ? 
      setRedeemDisabled(false) 
      : setRedeemDisabled(true);
  }, [activeSeries, matured]);
 
  return (
    
    <Box flex='grow' align='center' fill='horizontal'>
      <InlineAlert warnMsg={warningMsg} errorMsg={errorMsg} />
      { txActive?.type !== 'REDEEM' &&
      <>
        <ActionButton
          onClick={()=>redeemProcedure()} 
          label={`Redeem ${activeSeries?.fyDaiBalance_ || ''} Dai`}
          disabled={redeemDisabled}
          hasDelegatedPool={true}
        />
      </>}
      { redeemActive && !txActive && <ApprovalPending /> } 
      { txActive && <TxStatus tx={txActive} /> }
    </Box>
  );
};

Redeem.defaultProps={ close:null };

export default Redeem;
