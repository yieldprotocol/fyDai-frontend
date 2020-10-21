import { useEffect, useState, useContext } from 'react';
import { TxContext } from '../contexts/TxContext';
import { useCachedState } from './appHooks';
import { useSignerAccount } from './connectionHooks';

/* Simple Hook for checking if a transaction family/families is in process */
export const useTxActive = (typeList:string[]) => {
  const { state: { pendingTxs } } = useContext(TxContext);
  const [txActive, setTxActive] = useState<any>(null);
  const upperTypeList = typeList.map( (x:any) => x.toUpperCase() );
  useEffect(()=>{
    setTxActive(pendingTxs.find( (x:any)=> upperTypeList.includes(x.type) ));
  }, [ pendingTxs, upperTypeList ]);
  return [ txActive ] as const; 
};

export const useTxHelpers = () => { 
  const  { dispatch }  = useContext<any>(TxContext);
  const [ pendingCache, setPendingCache ] = useCachedState('txPending', []);
  const { fallbackProvider } = useSignerAccount();

  /* Notification Helpers */
  const txComplete = (receipt:any) => {
    console.log(receipt);
    setPendingCache( pendingCache.filter((x:any) => x.hash !== ( receipt.transactionHash || receipt.hash)) );
    dispatch({ type: 'txComplete', payload: receipt } );
  };

  const handleTxBuildError = (error:any) => {
    /* silence user rejection errors */
    if ( error.code === 4001 ) {
      dispatch({ 
        type: 'notify',
        payload: { message: 'Transaction rejected by user.' } 
      });    
    } else {
      // eslint-disable-next-line no-console
      console.log(error.message);
      dispatch({ 
        type: 'notify', 
        payload: { message: 'The transaction was rejected by the wallet provider. Please see console', type:'error' } 
      });
    }
  };

  const handleTxError = (msg:string, receipt: any, error:any) => {
    // eslint-disable-next-line no-console
    console.log(error.message);
    dispatch({ 
      type: 'notify', 
      payload:{ message: msg, type:'error' } 
    });
    txComplete(receipt);
  };
  
  const handleTx = async (tx:any) => {
    setPendingCache([...pendingCache, tx]);
    await tx.wait([2])
      .then((receipt:any) => {
        txComplete(receipt);
      }, ( error:any ) => {
        handleTxError('Error: Transaction failed. Please see console', tx, error);
      });
  };

  const handleCachedTx = async (tx:any ) => {
    await fallbackProvider.waitForTransaction(tx.hash, 2)
      .then((receipt:any) => {
        console.log('tx complete', receipt);
        setPendingCache( pendingCache.filter((x:any) =>x.hash !== ( receipt.transactionHash || receipt.hash)) );
        // txComplete(receipt);
      }, ( error:any ) => {
        handleTxError('Error: Transaction failed. Please see console', tx, error);
      });
  };

  return { handleTx, handleCachedTx, txComplete, handleTxBuildError };
};