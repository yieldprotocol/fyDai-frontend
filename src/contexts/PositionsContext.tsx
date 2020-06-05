import React from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import moment from 'moment';
import * as constants from '../constants';
import { SeriesContext } from './SeriesContext';

import { useCallTx } from '../hooks/yieldHooks';

const PositionsContext = React.createContext<any>({});

function reducer(redState:any, action:any) {
  switch (action.type) {
    case 'updatePositions':
      return { 
        ...redState,
        positionsData: action.payload,
      };
    case 'addNewPosition':
      return { 
        ...redState,
      };
    case 'indicatorPlus':
      return { 
        ...redState,
        positionsIndicator: redState.positionsIndicator+1,
      };
    case 'indicatorMinus':
      return { 
        ...redState,
        positionsIndicator: redState.positionsIndicator-1
      };
    case 'isLoading':
      return { 
        ...redState,
        isLoading: action.payload
      };
    default:
      return redState;
  }
}

const PositionsProvider = ({ children }:any) => {
  const { chainId, account } = useWeb3React();
  const { WETH, CHAI } = constants; 
  const initState = { positionsIndicator: 0, positionsData : [] };
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: seriesState } = React.useContext(SeriesContext);
  const [ callTx ] = useCallTx();

  const fetchChainData = async (seriesData:any) => {
    const chainData:any[] = [];
    await Promise.all(
      seriesData.map( async (x:any, i:number)=> {
        chainData.push(x);
        try {
          chainData[i].daiDebt = await callTx(x.Dealer, 'Dealer', 'debtDai', [WETH, account]);
          chainData[i].yDaiDebtWeth = await callTx(x.Dealer, 'Dealer', 'debtYDai', [WETH, account]);
          chainData[i].yDaiDebtChai = await callTx(x.Dealer, 'Dealer', 'debtYDai', [CHAI, account]);
          chainData[i].wethPosted = await callTx(x.Dealer, 'Dealer', 'posted', [WETH, account]);
          chainData[i].chaiPosted = await callTx(x.Dealer, 'Dealer', 'posted', [CHAI, account]);
        } catch (e) { 
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    return chainData;
  };

  // post fetching data processing
  const parseChainData = (chainData:any) => {
    return chainData.map((x:any, i:number) => {
      return { 
        ...x,
        daiDebt: ethers.utils.formatEther(x.daiDebt.toString()),
        yDaiDebtWeth: ethers.utils.formatEther(x.yDaiDebtWeth.toString()),
        yDaiDebtChai: ethers.utils.formatEther(x.yDaiDebtChai.toString()),
        wethPosted: ethers.utils.formatEther(x.wethPosted.toString()),
        chaiPosted: ethers.utils.formatEther(x.chaiPosted.toString()),
      };
    });
  };

  const getAllPositions = async () => {
    if(!seriesState?.isLoading) {
      dispatch({ type:'isLoading', payload: true });
      const chainData:any = await fetchChainData(seriesState.seriesData);
      const parsedData:any = await parseChainData(chainData);
      console.log(parsedData);
      dispatch( { type:'updatePositions', payload: parsedData });
      dispatch({ type:'isLoading', payload: false });
    }
  };

  React.useEffect( () => {
    ( async () => chainId && getAllPositions())();
  }, [ chainId, seriesState ]);

  return (
    <PositionsContext.Provider value={{ state, dispatch }}>
      {children}
    </PositionsContext.Provider>
  );
};

export { PositionsContext, PositionsProvider };


// const initState_old = {
//   positionsIndicator: 1,
//   positionsData : [
//     {
//       posId: 1,
//       series_id: `yDai-${moment().add(3, 'months').format('YY-MM-30')}`,
//       maturityDate: moment().add(3, 'months').toDate(),
//       interestRate: 3.22,
//       currentValue: 0.9921,
//       collateral: [ 
//         { type: 'ETH', value: 1.21234, debt: 100, balance: 100 },
//       ],
//     },
//     {
//       posId: 2,
//       series_id: `yDai-${moment().add(6, 'months').format('YY-MM-30')}`,
//       maturityDate: moment().add(3, 'months').toDate(),
//       interestRate: 3.22,
//       currentValue: 0.9921,
//       collateral: [
//         { type: 'ETH', value: 1.2234234234, debt: 100, balance: 100 },
//         { type: 'CHAI', value: 100, debt: 50, balance: 50},

//       ],
//     },
//     {
//       posId: 3,
//       series_id: `yDai-${moment().add(12, 'months').format('YY-MM-30')}`,
//       maturityDate: moment().add(3, 'months').toDate(),
//       interestRate: 3.22,
//       currentValue: 0.9921,
//       collateral: [ 
//         { type: 'ETH', value: 1.223423423423423423234, debt: 100, balance: 100 },
//       ],
//     },
//   ],
// };