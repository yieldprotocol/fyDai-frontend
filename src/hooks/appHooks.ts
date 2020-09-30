import { useEffect, useState, useContext } from 'react';
import { NotifyContext } from '../contexts/NotifyContext';

/* Simple Hook for checking if a transaction family/families are in process */
export const useTxActive = (typeList:string[]) => {
  const { state: { pendingTxs } } = useContext(NotifyContext);
  const [txActive, setTxActive] = useState<any>(null);
  const upperTypeList = typeList.map( (x:any) => x.toUpperCase() );
  useEffect(()=>{
    setTxActive(pendingTxs.find( (x:any)=> upperTypeList.includes(x.type) ));
  }, [ pendingTxs, upperTypeList ]);
  return [txActive] as const; 
};

export const useTxHelpers = () => { 

  const  { dispatch }  = useContext<any>(NotifyContext);

  /* Notification Helpers */
  const txComplete = (receipt:any) => {
    dispatch({ type: 'txComplete', payload: receipt } );
  };
  
  const handleTxError = (msg:string, receipt: any, e:any) => {
    /* silence user rejection errors */
    if (e.code === 4001 ) {
      txComplete(receipt);
    } else {
      // eslint-disable-next-line no-console
      console.log(e.message);
      dispatch({ type: 'notify', payload:{ message: msg, type:'error' } } );
      txComplete(receipt);
    }
  };
  
  const handleTx = async (tx:any) => {
    await tx.wait()
      .then((receipt:any) => {
        txComplete(receipt);
      }, ( error:any ) => {
        handleTxError('Error: Transaction failed. Please see console', tx, error);
      });
  };
  return { handleTx, txComplete, handleTxError };
};

/* Simple Hook for caching & retrieved data */
export const useCachedState = (key:string, initialValue:any) => {
  // const genKey = `${chainId}_${key}` || key;
  const genKey = key;
  const [storedValue, setStoredValue] = useState(
    () => {
      try {
        const item = window.localStorage.getItem(genKey);
        /* Parse stored json or if none, return initialValue */
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        // If error also return initialValue and handle error - needs work
        return initialValue;
      }
    }
  );
  const setValue = (value:any) => {
    try {
      // For same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(genKey, JSON.stringify(valueToStore));
    } catch (error) {
      // handle the error cases needs work
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
};

export const useDebounce = (value:any, delay:number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(
    () => {
      /* Update debounced value after delay */
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      /* Cancel the timeout if value changes (also on delay change or unmount)
      This is how we prevent debounced value from updating if value is changed ...
      .. within the delay period. Timeout gets cleared and restarted. */
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] /* Only re-call effect if value or delay changes */ 
  );
  return debouncedValue;
};


export const useIsLol = (value:string|undefined|null) => {
  
  const [isLol, setIsLol] = useState<any>();
  
  useEffect(()=>{
    value && parseFloat(value) < 0 && setIsLol(true);
    // value && isNaN(value as unknown as number) && setIsLol(true);
    value && parseFloat(value) >= 0 && setIsLol(false);
    !value && setIsLol(false);
  }, [value] );

  return isLol;
};

// export const useParseInput = (value:string|bigNumber) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);
//   useEffect(
//     () => {
//       /* Update debounced value after delay */
//       const handler = setTimeout(() => {
//         setDebouncedValue(value);
//       }, delay);
//       /* Cancel the timeout if value changes (also on delay change or unmount)
//       This is how we prevent debounced value from updating if value is changed ...
//       .. within the delay period. Timeout gets cleared and restarted. */
//       return () => {
//         clearTimeout(handler);
//       };
//     },
//     [value, delay] /* Only re-call effect if value or delay changes */ 
//   );
//   return debouncedValue;
// };
