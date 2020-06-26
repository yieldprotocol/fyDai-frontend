import React, { useState, useCallback, useEffect } from 'react';

export const useCachedState = (key:string, initialValue:any) => {
    
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none, return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue and handle error - needs work
      console.log(error);
      return initialValue;
    }
  });
  const setValue = (value:any) => {
    try {
      // For same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // handle the error cases needs work
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
};

export const useAsync = (asyncFunction:any, immediate = true) => {
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);
  
  // The execute function wraps asyncFunction and
  // handles setting state for pending, value, and error.
  // useCallback ensures the below useEffect is not called
  // on every render, but only if asyncFunction changes.
  const execute = useCallback(() => {
    setPending(true);
    setValue(null);
    setError(null);
    return asyncFunction()
      .then((response:any) => setValue(response))
      .catch((e:any) => setError(e))
      .finally(() => setPending(false));
  }, [asyncFunction]);
  
  // Call execute if we want to fire it right away.
  // Otherwise execute can be called later, such as
  // in an onClick handler.
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);
  return { execute, pending, value, error };
};
