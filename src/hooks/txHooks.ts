import { useMemo, useEffect, useState, useContext } from 'react';

import { ITx } from '../types';

import { NotifyContext } from '../contexts/NotifyContext';
import { TxContext } from '../contexts/TxContext';

import { useCachedState } from './appHooks';
import { useSignerAccount } from './connectionHooks';

/* Simple Hook for checking if a transaction family/families is in process */
export const useTxActive = (typeList:string[]) => {
  const { state: { pendingTxs } } = useContext(TxContext);
  const [txActive, setTxActive] = useState<any>(null);
  const upperTypeList = typeList.map( (x:any) => x.toUpperCase() );
  useEffect(()=>{
    setTxActive(pendingTxs?.find( (x:any)=> upperTypeList.includes(x.type) ));
  }, [ pendingTxs, upperTypeList ]);
  return [ txActive ] as const; 
};

export const useTxHelpers = () => { 
  const  { dispatch: notify }  = useContext<any>(NotifyContext);
  const  { dispatch  }  = useContext<any>(TxContext);
  const [ pendingCache, setPendingCache ] = useCachedState('txPending', []);
  const { fallbackProvider } = useSignerAccount();

  /* Notification Helpers */
  const txComplete = (receipt:any) => {
    setPendingCache( pendingCache.filter((x:any) => x.tx.hash !== ( receipt.transactionHash || receipt.hash)));
    dispatch({ type: 'txComplete', payload: receipt } );
  };

  const handleTxRejectError = (error:any) => {
    /* silence user rejection errors */
    if ( error.code === 4001 ) {
      notify({ 
        type: 'notify',
        payload: { message: 'Transaction rejected by user.' } 
      });    
    } else {
      // eslint-disable-next-line no-console
      console.log(error.message);
      notify({ 
        type: 'notify', 
        payload: { message: 'The transaction was rejected by the wallet provider. Please see console', type:'error' } 
      });
    }
  };

  const handleTxError = (msg:string, receipt: any, error:any) => {
    // eslint-disable-next-line no-console
    console.log(error.message);
    notify({ 
      type: 'notify', 
      payload:{ message: msg, type:'error' } 
    });
    txComplete(receipt);
  };
  
  const handleTx = async ( tx:ITx ) => {
    dispatch({ type: 'txPending', payload: tx  });
    setPendingCache([...pendingCache, tx ]);
    await tx.tx.wait([2])
      .then((receipt:any) => {
        txComplete(receipt);
      }, ( error:any ) => {
        handleTxError('Error: Transaction failed. Please see console', tx.tx, error);
      });
  };

  const handleCachedTx = async (tx:ITx) => {
    await fallbackProvider.waitForTransaction(tx.tx.hash, 3)
      .then((receipt:any) => {
        console.log(receipt);
        txComplete(receipt);
      }, ( error:any ) => {
        handleTxError('Error: Transaction failed. Please see console', tx.tx, error);
      });
  };

  // useEffect(() => {
  //   // /* bring in cached transactions if any */
  //   !seriesLoading && pendingCache.map((x:any) => { 
  //     dispatch({ type:'txPending', payload:x });
  //     handleCachedTx(x);
  //     // console.log state.pendingTxs);
  //   });
  // }, [seriesLoading]);

  return { handleTx, handleCachedTx, txComplete, handleTxRejectError };
};