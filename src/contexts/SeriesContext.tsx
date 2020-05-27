import React from 'react';
import firebase, { firestore } from 'firebase';

import moment from 'moment';
import { useWeb3React } from '@web3-react/core';

const SeriesContext = React.createContext<any>({});

firebase.initializeApp({
  apiKey: 'AIzaSyATOt3mpg8B512V-6Pl_2ZqjY1WjE5q49s',
  projectId: 'yield-ydai'
});

const initState = {
  demoData: true,
  seriesData : [
    {
      id: `yDai-${moment().add(3, 'days').format('YY-MM-30')}`,
      maturityDate: moment().add(3, 'days').toDate(),
      interestRate: 3.22,
      currentValue: 0.9921,
    },
    {

      id: `yDai-${moment().add(3, 'months').format('YY-MM-30')}`,
      maturityDate: moment().add(3, 'months').toDate(),
      interestRate: 3.51,
      currentValue: 0.9829,
    },
    {
      id: `yDai-${moment().add(6, 'months').format('YY-MM-30')}`,
      maturityDate: moment().add(6, 'months').toDate(),
      interestRate: 3.69,
      currentValue: 0.9732,
    },
    {
      id: `yDai-${moment().add(9, 'months').format('YY-MM-30')}`,
      maturityDate: moment().add(9, 'months').toDate(),
      interestRate: 3.78,
      currentValue: 0.9636,

    },
    {
      id: `yDai-${moment().add(12, 'months').format('YY-MM-30')}`,
      maturityDate: moment().add(12, 'months').toDate(),
      interestRate: 3.91,
      currentValue: 0.9636,
    },
    {
      id: `yDai-${moment().add(15, 'months').format('YY-MM-30')}`,
      maturityDate: moment().add(15, 'months').toDate(),
      interestRate: 3.69,
      currentValue: 0.9732,
    },
    {
      id: `yDai-${moment().add(18, 'months').format('YY-MM-30')}`,
      maturityDate: moment().add(18, 'months').toDate(),
      interestRate: 3.78,
      currentValue: 0.9636,
    },
    {
      id: `yDai-${moment().add(21, 'months').format('YY-MM-30')}`,
      maturityDate: moment().add(21, 'months').toDate(),
      interestRate: 3.91,
      currentValue: 0.9636,

    },
  ],
};

function seriesReducer(state:any, action:any) {
  switch (action.type) {
    case 'update':
      return { 
        ...state,
      };
    case 'updateRate':
      return { 
        ...state,
      };
    case 'closeNotify':
      return { ...state, }; 
    default:
      return state;
  }
}

const SeriesProvider = ({ children }:any) => {

  const { active, library, chainId, account } = useWeb3React();
  const [state, dispatch] = React.useReducer(seriesReducer, initState);
  
  
  const getSeriesAddrs = async (networkId:number|string): Promise<any> => {
    const db = firebase.firestore();
    console.log(networkId);
    try {
      db.collection(networkId.toString()).get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
        // doc.data() is never undefined for query doc snapshots
          console.log(doc.id, ' => ', doc.data());
        });
      });
    } catch (e) {console.log(e);}
  };

  React.useEffect( () => {
    chainId && getSeriesAddrs(chainId);
  }, [chainId]);

  return (
    <SeriesContext.Provider value={{ state, dispatch }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
