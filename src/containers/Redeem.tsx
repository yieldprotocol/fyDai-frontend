import React, { useEffect, useState, useContext } from 'react';
import { Box } from 'grommet';

/* utils and support */

/* contexts */
import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';

/* hooks */
import { useTxActive } from '../hooks/txHooks';
import { useFYDai } from '../hooks/fyDaiHook';

/* components */
import InlineAlert from '../components/InlineAlert';
import TxStatus from '../components/TxStatus';
import ActionButton from '../components/ActionButton';
import { useSignerAccount } from '../hooks/connectionHooks';
import { ethers } from 'ethers';
import { logEvent } from '../utils';

interface IRedeemProps {
  close?:any,
}

const Redeem  = ({ close }:IRedeemProps)  => {
  
  /* state from contexts */
  const { state: { activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { actions: userActions } = useContext(UserContext);

  /* local state */ 
  const [ redeemDisabled, setRedeemDisabled] = useState<boolean>(true);
  const [ matured, setMatured ] = useState<boolean>(false);
  const [ warningMsg ] = useState<string|null>(null);
  const [ errorMsg ] = useState<string|null>(null);

  /* init hooks */
  const { hasBeenMatured, redeem } = useFYDai();
  const [ txActive ] = useTxActive(['redeem']);
  const { account } = useSignerAccount();

  /* execution procedure */
  const redeemProcedure = async () =>{
    if(!redeemDisabled) {

      logEvent(
        'Redeem_initiated', 
        {
          value: ethers.utils.parseEther( activeSeries.fyDaiBalance),
          series: activeSeries ? activeSeries.displayName : null,
          maturity: activeSeries ? activeSeries.maturity: null, 
          time_to_maturity: activeSeries ? (new Date().getTime()/1000) - activeSeries?.maturity : null,
          account: account?.substring(2),
        });

      await redeem(activeSeries, activeSeries.fyDaiBalance.toString());

      /* clean up and refresh */ 
      await Promise.all([
        userActions.updateUser(),
        seriesActions.updateSeries([activeSeries]),
      ]);
    }
  };

  /* Set hasMAtured if the series is mature */ 
  useEffect( () => {
    ( async () => activeSeries && setMatured(await hasBeenMatured(activeSeries.fyDaiAddress)))();
  }, [activeSeries]);

  /* Redeem button disabled logic */ 
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
