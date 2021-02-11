import { useEffect, useState, useContext } from 'react';
import { ITx } from '../types';


/* utils and support */
import { logEvent } from '../utils';
import { TxContext } from '../contexts/TxContext';
import { NotifyContext } from '../contexts/NotifyContext';

import { useSignerAccount } from './connectionHooks'; 

import { useCachedState } from './appHooks';
import { secondsToFrom } from '../utils/yieldMath';



/* Simple Hook for checking if a transaction family/families is in process */
export const useTxActive = (typeList:string[]) => {
  const { state: { pendingTxs } } = useContext(TxContext);
  const { account  } = useSignerAccount();

  const [txActive, setTxActive] = useState<any>(null);
  const upperTypeList = typeList.map( (x:any) => x.toUpperCase() );
  useEffect(()=>{
    setTxActive(pendingTxs?.find( (x:any)=> upperTypeList.includes(x.type) ));
  }, [ pendingTxs, upperTypeList ]);
  return [ txActive ] as const;
};

export const useTxHelpers = () => { 
  const  { dispatch: notify }  = useContext(NotifyContext);
  const  { state, dispatch  }  = useContext(TxContext);

  const { account  } = useSignerAccount();

  const [ pendingCache, setPendingCache ] = useCachedState('txPending', []);

  /* Notification Helpers */

  const txComplete = (receipt:any, txCode:string|null=null) => {  
    dispatch({ type: 'txComplete', payload: { receipt, txCode } } );
    setPendingCache(pendingCache.filter( (x:any)=> x.tx.hash === receipt.hash ));
  };

  const handleTxRejectError = (error:any) => {
    /* Clear the requested signatures and tx activity flag */
    dispatch({ type: 'setTxProcessActive', payload:{ txCode:null, sigs:[] }  });
    /* If user cancelled/rejected the tx, then silence the errors */
    if ( error.code === 4001 ) {
      notify({ 
        type: 'notify',
        payload: { message: 'Transaction rejected by user' } 
      }); 
    } else {
      /* Else, the transaction was cancelled by the wallet provider */
      notify({ 
        type: 'notify', 
        payload: { message: 'The transaction was rejected by the wallet provider. Please see console', type:'error' } 
      });
      // eslint-disable-next-line no-console
      console.log(error.message);
    }
  };
  
  const handleTxError = (msg:string, receipt: any, error:any) => {
    /* Clear the requested signatures and tx activity flag */
    dispatch({ type: 'setTxProcessActive', payload:{ txCode:null, sigs:[] }  });
    notify({ 
      type: 'notify', 
      payload:{ message: msg, type:'error' } 
    });
    txComplete(receipt);
    setPendingCache([]);
    // eslint-disable-next-line no-console
    console.log(error.message);
  };
  
  const handleTx = async ( tx:ITx ) => {
    /* Assign an internal tracking code for the series and type of tx */
    const txCode = tx.type.concat( tx?.series?.maturity.toString() || '' );
    /* Add the tx to txContent */
    dispatch({ type: 'txPending', payload: { ...tx, txCode } });
    /* Add the tx to the cache, for picking up on reload */
    setPendingCache([{ ...tx, txCode }]);
    await tx.tx.wait()
      .then((receipt:any) => {
        logEvent(
          tx.type, 
          {
            value: tx.value,
            series: tx.series ? tx.series.displayName : null,
            maturity: tx.series ? tx.series.maturity : null, 
            time_to_maturity: tx.series ? secondsToFrom(tx.series.maturity.toString()) : null,
            account: account?.substring(2),
            hash: tx.tx.hash.substring(2)
          });
        txComplete(receipt, txCode);
      }, ( error:any ) => {
        handleTxError('Error: Transaction failed. Please see console', tx.tx, error);
        logEvent('TX_ERROR', { user: account?.substring(2), hash: tx.tx.hash.substring(2) } );
      });
  };

  return { handleTx, txComplete, handleTxRejectError };
};