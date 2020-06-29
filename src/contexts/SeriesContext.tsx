import React from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';
import { useCallTx } from '../hooks/yieldHooks';

import { YieldContext } from './YieldContext';
import { ConnectionContext } from './ConnectionContext';

const SeriesContext = React.createContext<any>({});

function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updatePositions':
      return {
        ...state,
        positionsData: action.payload,
      };
    case 'isLoading':
      return { 
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
}

const SeriesProvider = ({ children }:any) => {

  const { state: { chainId, account } } = React.useContext(ConnectionContext);

  const initState = { positionsIndicator: 0, positionsData : new Map(), positionSelected: '' };
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = React.useContext(YieldContext);
  const [ callTx ] = useCallTx();

  const { deployedCore } = yieldState; 

  const getSeriesData = async (deployedSeries:any) => {
    const chainData:any[] = [];
    await Promise.all(
      deployedSeries.map( async (x:any, i:number) => {
        chainData.push(x);
        try {
          // chainData[i].wethDebtDai = await callTx(deployedCore.Dealer, 'Dealer', 'debtDai', [utils.WETH, x.maturity, account]);
          chainData[i].wethDebtYDai = account? await callTx(deployedCore.Dealer, 'Dealer', 'debtYDai', [utils.WETH, x.maturity, account]): '0';
          // chainData[i].chaiDebtDai = await callTx(deployedCore.Dealer, 'Dealer', 'debtDai', [utils.CHAI, x.maturity, account]);
          // chainData[i].chaiDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'debtYDai', [utils.CHAI, x.maturity, account]);
        } catch (e) {
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    return chainData;
  };

  // post fetching data processing
  const parseSeriesData = (chainData:any) => {
    const positions = state.positionsData;
    chainData.forEach((x:any)=>{
      positions.set(
        x.symbol,
        { ...x,
          wethDebtYDai_: parseFloat(ethers.utils.formatEther(x.wethDebtYDai.toString())),
          // chaiDebtYDai_: parseFloat(ethers.utils.formatEther(x.chaiDebtYDai.toString())),
        }
      );
    });
    return positions;
  };

  const loadSeriesPositions = async (seriesArr:any[], force:boolean) => {

    let filteredSeriesArr;

    if (force !== true) {
      filteredSeriesArr = seriesArr.filter(x => !state.positionsData.has(x.symbol));
    } else { filteredSeriesArr = seriesArr; }

    if( !yieldState?.isLoading && filteredSeriesArr.length > 0) {
      dispatch({ type:'isLoading', payload: true });
      const chainData:any = await getSeriesData(filteredSeriesArr);
      const parsedData:any = await parseSeriesData(chainData);
      dispatch( { type:'updatePositions', payload: parsedData });
      dispatch({ type:'isLoading', payload: false });
    } else {
      console.log('Positions already exist... force fetch if required');
    }
  };

  React.useEffect( () => {
    ( async () => {
      account && chainId && !yieldState?.isLoading && loadSeriesPositions([yieldState.deployedSeries[0]], false); 
    })();
  }, [ account, chainId, yieldState ]);

  const actions = {
    getPositions: (x:any[]) => loadSeriesPositions(x, false),
    refreshPositions: (x:any[]) => loadSeriesPositions(x, true),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
