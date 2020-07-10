import React from 'react';
import { ethers, BigNumber } from 'ethers';
// import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';
import { useCallTx, useEvents, useCachedState, useMath } from '../hooks';

import { YieldContext } from './YieldContext';
import { ConnectionContext } from './ConnectionContext';

const SeriesContext = React.createContext<any>({});

function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updateSeries':
      return {
        ...state,
        seriesData: action.payload,
      };
    case 'updateTotals':
      return {
        ...state,
        seriesTotals: action.payload,
      };
    case 'setActiveSeries':
      return {
        ...state,
        activeSeries: action.payload,
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

// const priceMock = {
//   1601510399: utils.toRay(0.99),
//   1609459199: utils.toRay(0.98),
//   1617235199: utils.toRay(0.96),
//   1625097599: utils.toRay(0.93)
// };

const SeriesProvider = ({ children }:any) => {

  const { state: { chainId, account } } = React.useContext(ConnectionContext);
  const initState = { 
    seriesData : new Map(),
    seriesTotals: {},
    activeSeries: null,
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = React.useContext(YieldContext);

  const [ callTx ] = useCallTx();
  const { collAmount, collValue, debtVal, collRatio, yieldRate, estimateRatio, minSafeCollatAmount, maxDai } = useMath();

  const { deployedContracts, feedData } = yieldState;

  const calculateSeriesTotals = () => {

    const numberOfSeries = state.seriesData.size;
    const collateralAmount = collAmount();
    const collateralValue = collValue();
    // TODO: rushed - this needs some attention to make it pretty/better
    let debtYDai = BigNumber.from('0');
    state.seriesData.forEach((x:any)=>{
      debtYDai = x.wethDebtYDai.add(debtYDai);
    });
    const debtYDaiValue = null; // Not needed for now - possibly unknown see below
    const totaldebtDai = null; // Unknown here - because each series has different Dai/yDai rates
    
    const debtValue = debtVal(debtYDai); // calculated as yDai at maturity. i.e. 1:1
    const collateralRatio = collRatio(collateralValue, debtValue);

    const minSafeCollateral = minSafeCollatAmount(debtValue, BigNumber.from('150'));
    const daiAvailable = maxDai(collateralValue, debtValue, BigNumber.from('150'));

    return {
      numberOfSeries,
      // TODO: fix this duplicate 'easy access' data below from yieldState
      ethPosted: yieldState.userData.ethPosted, ethPosted_: yieldState.userData.ethPosted_,
      ethBalance: yieldState.userData.ethBalance, ethBalance_: yieldState.userData.ethBalance_,

      // calculated values
      debtYDai, debtYDai_: parseFloat(ethers.utils.formatEther(debtYDai)),
      debtValue, debtValue_ : parseFloat(ethers.utils.formatEther(debtValue)),
      collateralAmount, collateralAmount_: parseFloat(ethers.utils.formatEther(collateralAmount)),
      collateralValue, collateralValue_: parseFloat(ethers.utils.formatEther(collateralValue)),
      collateralRatio, collateralRatio_: parseFloat(collateralRatio.toString()),

      minSafeCollateral, minSafeCollateral_: parseFloat(ethers.utils.formatEther(minSafeCollateral)),
      daiAvailable, daiAvailable_: parseFloat(ethers.utils.formatEther(daiAvailable)),
      // useful functions exported
      estimateRatio,
    };
  };

  const getSeriesPosition = async (deployedSeries:any) => {
    const chainData:any[] = [];
    await Promise.all(
      deployedSeries.map( async (x:any, i:number) => {
        chainData.push(x);
        try {
          chainData[i].wethDebtYDai = account ? await callTx(deployedContracts.Dealer, 'Dealer', 'debtYDai', [utils.ETH, x.maturity, account]): '0';
          chainData[i].wethDebtDai = utils.mulRay( chainData[i].wethDebtYDai, feedData.amm.rates[x.maturity] || BigNumber.from('0'));
          // chainData[i].chaiDebtDai = await callTx(deployedContracts.Dealer, 'Dealer', 'debtDai', [utils.CHAI, x.maturity, account]);
          // chainData[i].chaiDebtYDai = await callTx(deployedContracts.Dealer, 'Dealer', 'debtYDai', [utils.CHAI, x.maturity, account]);
          chainData[i].yieldRate = yieldRate(feedData.amm.rates[x.maturity] || BigNumber.from('0'));
          // chainData[i].yieldAnnual = utils.annualizedYieldRate(priceMock.get(x.maturity) || BigNumber.from('0'), x.maturity);
        } catch (e) {
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    return chainData;
  };

  // post fetching data processing
  const parseSeriesPosition = (chainData:any) => {
    const positions = state.seriesData;
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
    // console.log(positions);
    return positions;
  };

  const loadSeriesPositions = async (seriesArr:any[], force:boolean) => {
    let filteredSeriesArr;
    if (force !== true) {
      filteredSeriesArr = seriesArr.filter(x => !state.seriesData.has(x.symbol));
    } else { filteredSeriesArr = seriesArr; }

    if( !yieldState?.isLoading && filteredSeriesArr.length > 0) {
      dispatch({ type:'isLoading', payload: true });
      const chainData:any = await getSeriesPosition(filteredSeriesArr);
      const parsedData:any = await parseSeriesPosition(chainData);
      dispatch( { type:'updatePositions', payload: parsedData });
      dispatch({ type:'isLoading', payload: false });

      const totals = calculateSeriesTotals();
      dispatch( { type:'updateTotals', payload: totals });

      /* if no active series, set it to the first entry of the map. */
      !state.activeSeries && dispatch({ type:'setActiveSeries', payload: parsedData.entries().next().value[1] });
    } else {
      console.log('Positions already exist... force fetch if required');
    }
  };

  React.useEffect( () => {
    ( async () => {
      // account && chainId && !yieldState?.isLoading && loadSeriesPositions([yieldState.deployedSeries[0]], false); 
      account && chainId && !yieldState?.isLoading && await loadSeriesPositions(yieldState.deployedSeries, false);
    })();

  }, [ account, chainId, yieldState ]);

  const actions = {
    getSeriesPositions: (x:any[]) => loadSeriesPositions(x, false),
    refreshSeriesPositions: (x:any[]) => loadSeriesPositions(x, true),
    setActiveSeries: (x:string) => dispatch({ type:'setActiveSeries', payload: x }),
    updateCalculations: () => dispatch( { type:'updateTotals', payload: calculateSeriesTotals() }),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
