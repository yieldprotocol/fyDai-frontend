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
    case 'updateAllPositions':
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

  const { deployedCore } = seriesState; 

  const fetchChainData = async (seriesData:any) => {
    const chainData:any[] = [];
    await Promise.all(
      seriesData.map( async (x:any, i:number) => {
        chainData.push(x);
        try {
          chainData[i].yDaiBalance = await callTx(x.YDai, 'YDai', 'balanceOf', [account]);
          chainData[i].wethPosted = await callTx(deployedCore.WethDealer, 'Dealer', 'posted', [account]);

          chainData[i].debtDai = await callTx(deployedCore.WethDealer, 'Dealer', 'debtDai', [x.maturity, account]);
          chainData[i].debtYDai = await callTx(deployedCore.WethDealer, 'Dealer', 'debtYDai', [x.maturity, account]);

          chainData[i].totalDebtDai = await callTx(deployedCore.WethDealer, 'Dealer', 'totalDebtDai', [account]);
          chainData[i].totalDebtWeth = await callTx(deployedCore.WethDealer, 'Dealer', 'totalDebtYDai', [account]);
          // chainData[i].yDaiDebtChai = await callTx(deployedCore.ChaiDealer, 'Dealer', 'debtYDai', [account]);
          // chainData[i].chaiPosted = await callTx(deployedCore.ChaiDealer, 'Dealer', 'posted', [account]);
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
        yDaiBalance: ethers.utils.formatEther(x.yDaiBalance.toString()),
        debtDai: ethers.utils.formatEther(x.debtDai.toString()),
        debtYDai: ethers.utils.formatEther(x.debtYDai.toString()),
        // yDaiDebtChai: ethers.utils.formatEther(x.yDaiDebtChai.toString()),
        wethPosted: ethers.utils.formatEther(x.wethPosted.toString()),
        // chaiPosted: ethers.utils.formatEther(x.chaiPosted.toString()),
        totalDebtDai: ethers.utils.formatEther(x.totalDebtDai.toString()),
        totalDebtWeth: ethers.utils.formatEther(x.totalDebtWeth.toString()),
      };
    });
  };

  const getPositions = async (seriesArr:any) => {
    if(!seriesState?.isLoading) {
      console.log('Get positions actioned');
      dispatch({ type:'isLoading', payload: true });
      const chainData:any = await fetchChainData(seriesArr);
      const parsedData:any = await parseChainData(chainData);
      console.log(parsedData);
      dispatch( { type:'updateAllPositions', payload: parsedData });
      dispatch({ type:'isLoading', payload: false });
    }
  };

  React.useEffect( () => {
    ( async () => { 
      chainId && !seriesState?.isLoading && getPositions([seriesState.seriesData[0]]); 
    })();
  }, [ chainId, seriesState ]);

  const actions = {
    getPositions: (x:any[]) => getPositions(x),
  };

  return (
    <PositionsContext.Provider value={{ state, actions }}>
      {children}
    </PositionsContext.Provider>
  );
};

export { PositionsContext, PositionsProvider };
