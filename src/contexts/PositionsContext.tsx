import React from 'react';
import moment from 'moment'; 

const PositionsContext = React.createContext<any>({});

const initState = {
  positionsIndicator: 1,
  positionsData : [
    {
      posId: 1,
      series_id: `yDai-${moment().add(3, 'months').format('MMYY')}`,
      maturityDate: moment().add(3, 'months').toDate(),
      interestRate: 3.22,
      currentValue: 0.9921,
      collateral: [ 
        { type: 'ETH', value: 1.2, debt: 100, balance: 100 },
      ],
    },
    {
      posId: 2,
      series_id: `yDai-${moment().add(6, 'months').format('MMYY')}`,
      maturityDate: moment().add(3, 'months').toDate(),
      interestRate: 3.22,
      currentValue: 0.9921,
      collateral: [
        { type: 'ETH', value: 1.2, debt: 100, balance: 100 },
      ],
    },
    {
      posId: 3,
      series_id: `yDai-${moment().add(12, 'months').format('MMYY')}`,
      maturityDate: moment().add(3, 'months').toDate(),
      interestRate: 3.22,
      currentValue: 0.9921,
      collateral: [ 
        { type: 'ETH', value: 1.2, debt: 100, balance: 100 },
      ],
    },
  ],
};
  
function positionsReducer(state:any, action:any) {
  switch (action.type) {
    case 'addNewPosition':
      return { 
        ...state,
      };
    case 'indicatorPlus':
      return { 
        ...state,
        positionsIndicator: state.positionsIndicator+1,
      };
    case 'indicatorMinus':
      return { 
        ...state,
        positionsIndicator: state.positionsIndicator-1
      };
    default:
      return state;
  }
}

const PositionsProvider = ({ children }:any) => {
  const [state, dispatch] = React.useReducer(positionsReducer, initState);
  
  React.useEffect( () => {
    // async data retrieval here. 
  }, [state.open]);

  return (
    <PositionsContext.Provider value={{ state, dispatch }}>
      {children}
    </PositionsContext.Provider>
  );
};

export { PositionsContext, PositionsProvider };