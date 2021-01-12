import React, { useEffect, useState, useContext } from 'react';
import { Box } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

import { useTxActive } from '../hooks/txHooks';
import { useFYDai } from '../hooks/fyDaiHook';

import InlineAlert from '../components/InlineAlert';
import TxStatus from '../components/TxStatus';
import ActionButton from '../components/ActionButton';

import { logEvent } from '../utils/analytics';

interface IRedeemProps {
  close?:any,
}

const Redeem  = ({ close }:IRedeemProps)  => {
  const { state: { seriesLoading, activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  
  const { actions: userActions } = useContext(UserContext);

  const { hasBeenMatured, redeem } = useFYDai();
  const [ txActive ] = useTxActive(['redeem']);

  const [ redeemDisabled, setRedeemDisabled] = useState<boolean>(true);
  const [ matured, setMatured ] = useState<boolean>(false);
  
  const [ warningMsg ] = useState<string|null>(null);
  const [ errorMsg ] = useState<string|null>(null);

  const redeemProcedure = async () =>{
    if(!redeemDisabled) {
      await redeem(activeSeries, activeSeries.fyDaiBalance.toString());
      logEvent({
        category: 'Redeem',
        action: String(activeSeries.fyDaiBalance),
        label: activeSeries.displayName || activeSeries.poolAddress,
      });
      /* clean up and refresh */ 
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateSeries([activeSeries]),
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
          hasPoolDelegatedProxy={true}
        />
      </>}
      { txActive && <TxStatus tx={txActive} /> }
    </Box>
  );
};

Redeem.defaultProps={ close:null };

export default Redeem;
