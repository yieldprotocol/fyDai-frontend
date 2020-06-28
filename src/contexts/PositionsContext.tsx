import React from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';
import { useCallTx } from '../hooks/yieldHooks';

import { YieldContext } from './YieldContext';
import { ConnectionContext } from './ConnectionContext';

const PositionsContext = React.createContext<any>({});

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

const PositionsProvider = ({ children }:any) => {

  const { state: { chainId, account } } = React.useContext(ConnectionContext);
  // const { chainId, account } = useWeb3React();

  const initState = { positionsIndicator: 0, positionsData : new Map(), positionSelected: '' };
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = React.useContext(YieldContext);
  const [ callTx ] = useCallTx();

  const { deployedCore } = yieldState; 

  const fetchChainData = async (deployedSeries:any) => {
    const chainData:any[] = [];
    await Promise.all(
      deployedSeries.map( async (x:any, i:number) => {
        chainData.push(x);
        try {
          // chainData[i].wethDebtDai = await callTx(deployedCore.Dealer, 'Dealer', 'debtDai', [utils.WETH, x.maturity, account]);
          // chainData[i].wethDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'debtYDai', [utils.WETH, x.maturity, account]);
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
  const parseChainData = (chainData:any) => {
    const positions = state.positionsData;
    chainData.forEach((x:any)=>{
      positions.set(
        x.symbol,
        { ...x,
          // wethDebtYDai_: parseFloat(ethers.utils.formatEther(x.wethDebtYDai.toString())),
          // chaiDebtYDai_: parseFloat(ethers.utils.formatEther(x.chaiDebtYDai.toString())),
        }
      );
    });
    return positions;
  };

  const getPositions = async (seriesArr:any[], force:boolean) => {
    
    let filteredSeriesArr;
    if (force !== true) {
      filteredSeriesArr = seriesArr.filter(x => !state.positionsData.has(x.symbol));
    } else { filteredSeriesArr = seriesArr; }

    if( !yieldState?.isLoading && filteredSeriesArr.length > 0) {
      console.log('Get positions actioned');
      dispatch({ type:'isLoading', payload: true });
      const chainData:any = await fetchChainData(filteredSeriesArr);
      const parsedData:any = await parseChainData(chainData);
      console.log(parsedData);
      dispatch( { type:'updatePositions', payload: parsedData });
      dispatch({ type:'isLoading', payload: false });
    } else {console.log('Positions already exist... force fetch if required')}
  };

  React.useEffect( () => {
    ( async () => { 
      chainId && !yieldState?.isLoading && getPositions([yieldState.deployedSeries[0]], false); 
    })();
  }, [ chainId, yieldState ]);

  const actions = {
    getPositions: (x:any[]) => getPositions(x, false),
    refreshPositions: (x:any[]) => getPositions(x, true),
  };

  return (
    <PositionsContext.Provider value={{ state, actions }}>
      {children}
    </PositionsContext.Provider>
  );
};

export { PositionsContext, PositionsProvider };
