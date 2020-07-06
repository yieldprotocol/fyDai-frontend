import React from 'react';
import { ethers, BigNumber } from 'ethers';
import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';
import { useCallTx, useEvents, useCachedState } from '../hooks';

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

const priceMock = new Map([ 
  [1601510399, utils.toRay(0.99)],
  [1609459199, utils.toRay(0.98)],
  [1617235199, utils.toRay(0.96)],
  [1625097599, utils.toRay(0.93)]
]);

const SeriesProvider = ({ children }:any) => {

  const { state: { chainId, account } } = React.useContext(ConnectionContext);

  const initState = { 
    positionsIndicator: 0,
    positionsData : new Map(),
    positionSelected: ''
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = React.useContext(YieldContext);
  const [ seriesTxHistory, setSeriesTxHistory ] = useCachedState('seriesTxHistory', null);

  const [ callTx ] = useCallTx();
  const { getEventHistory } = useEvents(); 

  const { deployedContracts, makerData,  } = yieldState;

  const getSeriesData = async (deployedSeries:any) => {
    const chainData:any[] = [];
    await Promise.all(
      deployedSeries.map( async (x:any, i:number) => {
        chainData.push(x);
        try {
          // chainData[i].wethDebtDai = await callTx(deployedContracts.Dealer, 'Dealer', 'debtDai', [utils.WETH, x.maturity, account]);
          chainData[i].wethDebtYDai = account? await callTx(deployedContracts.Dealer, 'Dealer', 'debtYDai', [utils.WETH, x.maturity, account]): '0';
          chainData[i].wethDebtDai = utils.mulRay( chainData[i].wethDebtYDai, priceMock.get(x.maturity) || BigNumber.from('0'));
          // chainData[i].chaiDebtDai = await callTx(deployedContracts.Dealer, 'Dealer', 'debtDai', [utils.CHAI, x.maturity, account]);
          // chainData[i].chaiDebtYDai = await callTx(deployedContracts.Dealer, 'Dealer', 'debtYDai', [utils.CHAI, x.maturity, account]);

          chainData[i].yieldRate = utils.yieldRate(priceMock.get(x.maturity) || BigNumber.from('0'));
          // chainData[i].yieldAnnual = utils.annualizedYieldRate(priceMock.get(x.maturity) || BigNumber.from('0'), x.maturity);

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
          wethDebtDai_: parseFloat(ethers.utils.formatEther(x.wethDebtDai.toString())),
          yieldRate_: parseFloat(ethers.utils.formatEther(x.yieldRate.toString())),
          yieldPercent_: parseFloat(ethers.utils.formatEther(x.yieldRate.toString()))*100,
          // chaiDebtYDai_: parseFloat(ethers.utils.formatEther(x.chaiDebtYDai.toString())),
        }
      );
    });
    console.log(positions);
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

  const getSeriesHistory = async () => {
    // getEventHistory(yieldState.deployedSeries[0].YDai, 'YDai', '*', [], 0);
  };

  React.useEffect( () => {
  //  ( async () => yieldState?.deployedSeries[0]?.YDai && getEventHistory(yieldState.deployedSeries[0].YDai, 'YDai', '*', 0))();
  }, [yieldState]);

  React.useEffect( () => {
    ( async () => {
      // account && chainId && !yieldState?.isLoading && loadSeriesPositions([yieldState.deployedSeries[0]], false); 
      account && chainId && !yieldState?.isLoading && loadSeriesPositions(yieldState.deployedSeries, false); 

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
