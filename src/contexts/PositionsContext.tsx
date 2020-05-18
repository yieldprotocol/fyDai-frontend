import React from 'react';

const PositionsContext = React.createContext<any>({});

const initState = {
  positionsIndicator: 1,
  positionsData : [
    {
      maturityDate: new Date(),
      interestRate: 3.22,
      currentValue: 0.9921,
      balance: 0,
      debt: 0,
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