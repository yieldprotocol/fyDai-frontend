import React from 'react';
import { NotifyContext } from '../contexts/NotifyContext';

/* Simple Hook for checking if a transaction family/families are in process */
export const useTxActive = (typeList:string[]) => {
  const { state: { pendingTxs } } = React.useContext(NotifyContext);
  const [txActive, setTxActive] = React.useState<any>(null);
  const upperTypeList = typeList.map( (x:any) => x.toUpperCase() );

  React.useEffect(()=>{
    setTxActive(pendingTxs.find( (x:any)=> upperTypeList.includes(x.type) ));
  }, [ pendingTxs ]);

  return [txActive] as const; 
};

/* Simple Hook for caching retrieved data */
export const useCachedState = (key:string, initialValue:any) => {
  // const genKey = `${chainId}_${key}` || key;
  const genKey = key;
  const [storedValue, setStoredValue] = React.useState(
    () => {
      try {
        const item = window.localStorage.getItem(genKey);
        /* Parse stored json or if none, return initialValue */
        return item ? JSON.parse(item) : initialValue;
      } catch (error) {
        // If error also return initialValue and handle error - needs work
        console.log(error);
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

export const useDebounce = () => {
  console.log('unBoing,..Debounc\'d');
};
