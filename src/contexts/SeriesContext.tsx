import React from 'react';

import moment from 'moment'; 

const SeriesContext = React.createContext<any>({});

const initState = {
  demoData: true,
  seriesData : [
    {
      maturityDate: moment().add(3, 'days').toDate(),
      interestRate: 3.22,
      currentValue: 0.9921,
      balance: 0,
      debt: 0,
    },
    {
      maturityDate: moment().add(3, 'months').toDate(),
      interestRate: 3.51,
      currentValue: 0.9829,
      balance: 0,
      debt: 0,
    },
    {
      maturityDate: moment().add(6, 'months').toDate(),
      interestRate: 3.69,
      currentValue: 0.9732,
      balance: 0,
      debt: 0,
    },
    {
      maturityDate: moment().add(9, 'months').toDate(),
      interestRate: 3.78,
      currentValue: 0.9636,
      balance: 0,
      debt: 0,
    },
    {
      maturityDate: moment().add(12, 'months').toDate(),
      interestRate: 3.91,
      currentValue: 0.9636,
      balance: 0,
      debt: 0,
    },
    {
      maturityDate: moment().add(15, 'months').toDate(),
      interestRate: 3.69,
      currentValue: 0.9732,
      balance: 0,
      debt: 0,
    },
    {
      maturityDate: moment().add(18, 'months').toDate(),
      interestRate: 3.78,
      currentValue: 0.9636,
      balance: 0,
      debt: 0,
    },
    {
      maturityDate: moment().add(21, 'months').toDate(),
      interestRate: 3.91,
      currentValue: 0.9636,
      balance: 0,
      debt: 0,
    },
  ],
};
  
function seriesReducer(state:any, action:any) {
  switch (action.type) {
    case 'update':
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
  const [state, dispatch] = React.useReducer(seriesReducer, initState);
  
  React.useEffect( () => {
    // async data retrieval here. 
  }, [state.open]);

  return (
    <SeriesContext.Provider value={{ state, dispatch }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
