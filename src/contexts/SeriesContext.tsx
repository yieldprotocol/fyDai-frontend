import React, { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber } from 'ethers';

import * as utils from '../utils';

import { YieldContext } from './YieldContext';

import { useCallTx, useMath, usePool, useSignerAccount, useWeb3React, useController, useToken } from '../hooks';
import { IYieldSeries } from '../types';

const SeriesContext = React.createContext<any>({});

const initState = { 
  seriesData : new Map(),
  activeSeries: null,
};

function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updateSeries':
      return {
        ...state,
        seriesData: action.payload,
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

const SeriesProvider = ({ children }:any) => {

  const { account, provider, fallbackProvider } = useSignerAccount();
  const { chainId } = useWeb3React();
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = useContext(YieldContext);
  const { deployedContracts } = yieldState;

  const { previewPoolTx, checkPoolDelegate, checkPoolState } = usePool();
  const { debtDai } = useController();
  const { getBalance } = useToken();

  const [ callTx ] = useCallTx();
  const { yieldAPR: calcAPR, poolPercent: calcPercent }  = useMath();


  /* Get the data for a particular series, or set of series */
  const _getSeriesData = async (seriesArr:IYieldSeries[]) => {

    /* concurrently get all the series data */
    const _seriesData = await Promise.all(
      seriesArr.map( async (x:IYieldSeries, i:number) => {
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
        /* with no user */
        const [ sellEDaiRate, totalSupply ] = await Promise.all([
          await previewPoolTx('sellEDai', _x, 1),
          await callTx(_x.poolAddress, 'Pool', 'totalSupply', []),
        ]);
        /* with user */
        const [ poolTokens, hasDelegatedPool, ethDebtDai, ethDebtEDai, eDaiBalance] = await Promise.all([
          account? await getBalance(_x.poolAddress, 'Pool', account): BigNumber.from('0'),
          account? await checkPoolDelegate(_x.poolAddress, deployedContracts.YieldProxy): BigNumber.from('0'),
          account? await debtDai('ETH-A', _x.maturity ): BigNumber.from('0'),
          account? await callTx(deployedContracts.Controller, 'Controller', 'debtEDai', [utils.ETH, _x.maturity, account]): BigNumber.from('0'),
          account? await getBalance(_x.eDaiAddress, 'EDai', account): BigNumber.from('0'),
        ]);
        return {
          ..._x,
          sellEDaiRate: !(sellEDaiRate instanceof Error)? sellEDaiRate : BigNumber.from('0'),
          totalSupply,
          poolTokens,
          hasDelegatedPool,
          ethDebtDai,
          ethDebtEDai,
          eDaiBalance,
        };
      })
    );

    /* Parse the data */
    const _parsedSeriesData = _seriesData.reduce((acc: Map<string, any>, x:any) => {
      const yieldAPR = calcAPR(x.sellEDaiRate, ethers.utils.parseEther('1'), x.maturity);
      const poolPercent = calcPercent(x.totalSupply, x.poolTokens);
      const poolState = checkPoolState(x);
      return acc.set(
        x.maturity,
        { ...x,
          sellEDaiRate_: parseFloat(ethers.utils.formatEther(x.sellEDaiRate.toString())),
          totalSupply_: parseFloat(ethers.utils.formatEther(x.totalSupply.toString())),
          eDaiBalance_: parseFloat(ethers.utils.formatEther(x.eDaiBalance.toString())),
          ethDebtEDai_: parseFloat(ethers.utils.formatEther(x.ethDebtEDai.toString())),
          ethDebtDai_: parseFloat(ethers.utils.formatEther(x.ethDebtDai.toString())),
          poolTokens_: parseFloat(ethers.utils.formatEther(x.poolTokens.toString())),
          yieldAPR_: yieldAPR.toFixed(2),
          yieldAPR,
          poolState,
          poolPercent,        
        }
      );
    }, state.seriesData);

    /* Update state and return  */
    dispatch( { type:'updateSeries', payload: _parsedSeriesData });
    return _parsedSeriesData;
  };

  /* Update a list of series */
  const updateSeries = async (seriesArr:IYieldSeries[] ) => {
    dispatch({ type:'isLoading', payload: true });
    /* Build/re-build series map with data */ 
    const seriesMap:any = await _getSeriesData(seriesArr); 
    /* Set the active series */
    if (seriesArr.length===1 ){ 
      /* if there was only one series updated set that one as the active series */   
      dispatch({ type:'setActiveSeries', payload: seriesMap.get(seriesArr[0].maturity) }); 
    } else {
      /* if no active series or multiple updated, set it to non-mature series that is maturing soonest. */
      const unmatureSeries: IYieldSeries[] = Array.from(seriesMap.values());
      const toSelect = unmatureSeries
        .filter((x:IYieldSeries)=>!x.isMature())
        .sort((a:IYieldSeries, b:IYieldSeries)=> a.maturity-b.maturity );
      dispatch({ type:'setActiveSeries', payload: seriesMap.get(toSelect[0].maturity) }); 
    } 
    dispatch({ type:'isLoading', payload: false });
  };

  /* Init all the series once yieldState is not loading and re-init on any user and/or network change */
  useEffect( () => {
    (provider || fallbackProvider) && !yieldState.isLoading && ( async () => {
      await updateSeries(yieldState.deployedSeries);
    })();
  }, [ provider, fallbackProvider, chainId, account, yieldState.isLoading ]);

  /* Actions for updating the series Context */
  const actions = {
    updateSeries: (series:IYieldSeries[]) => updateSeries(series), /* updates one, or any number of series */
    setActiveSeries: (seriesMaturity:string) => dispatch({ type:'setActiveSeries', payload: state.seriesData.get(seriesMaturity) }),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
