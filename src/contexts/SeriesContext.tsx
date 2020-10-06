import React, { useEffect, useContext } from 'react';
import { ethers, BigNumber } from 'ethers';

import * as utils from '../utils';

import { YieldContext } from './YieldContext';

import { useCallTx, useMath, usePool, useSignerAccount, useWeb3React, useController, useToken } from '../hooks';
import { IYieldSeries } from '../types';

const SeriesContext = React.createContext<any>({});

const initState = { 
  seriesData : new Map(),
  activeSeries: null,
  seriesLoading : true,
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
        seriesLoading: action.payload
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
  const { yieldLoading, deployedContracts } = yieldState;

  const { previewPoolTx, checkPoolDelegate, checkPoolState } = usePool();
  const { debtDai } = useController();
  const { getBalance } = useToken();

  const [ callTx ] = useCallTx();
  const { yieldAPR: calcAPR, poolPercent: calcPercent }  = useMath();

  const _prePopulateSeriesData = (seriesArr:IYieldSeries[]) => {
    /* preMap is for faster loading - creates an initial map from the cached data */
    const preMap= seriesArr.reduce((acc: Map<string, any>, x:any) => {
      const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
      return acc.set( x.maturity, { ..._x });
    }, state.seriesData);
    dispatch( { type:'updateSeries', payload: preMap });
    return preMap;
  };

  /* Get the data for a particular series, or set of series */
  const _getSeriesData = async (seriesArr:IYieldSeries[]) => {

    /* concurrently get all the series data */
    const _seriesData = await Promise.all(
      seriesArr.map( async (x:IYieldSeries, i:number) => {
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
        /* with no user */
        const [ sellFyDaiRate, totalSupply ] = await Promise.all([
          await previewPoolTx('sellFyDai', _x, 1),
          await callTx(_x.poolAddress, 'Pool', 'totalSupply', []),
        ]);

        /* with user */
        const [ poolTokens, hasDelegatedPool, ethDebtDai, ethDebtFyDai, fyDaiBalance] =  account && await Promise.all([
          getBalance(_x.poolAddress, 'Pool', account),
          checkPoolDelegate(_x.poolAddress, deployedContracts.YieldProxy),
          debtDai('ETH-A', _x.maturity ),
          callTx(deployedContracts.Controller, 'Controller', 'debtFyDai', [utils.ETH, _x.maturity, account]),
          getBalance(_x.fyDaiAddress, 'FyDai', account),
        ]) || [];

        return {
          ..._x,
          sellFyDaiRate: !(sellFyDaiRate instanceof Error)? sellFyDaiRate : BigNumber.from('0'),
          totalSupply,
          poolTokens: poolTokens || BigNumber.from('0'),
          hasDelegatedPool: hasDelegatedPool || false, // TODO check this
          ethDebtDai: ethDebtDai || BigNumber.from('0'),
          ethDebtFyDai : ethDebtFyDai || BigNumber.from('0'),
          fyDaiBalance : fyDaiBalance || BigNumber.from('0'),
        };
      })
    );

    /* Parse the data */
    const _parsedSeriesData = _seriesData.reduce((acc: Map<string, any>, x:any) => {
      const yieldAPR = calcAPR(x.sellFyDaiRate, ethers.utils.parseEther('1'), x.maturity);
      const poolPercent = calcPercent(x.totalSupply, x.poolTokens).toFixed(4);
      const poolState = checkPoolState(x);
      return acc.set(
        x.maturity,
        { ...x,
          sellFyDaiRate_: utils.cleanValue(ethers.utils.formatEther(x.sellFyDaiRate), 2),
          totalSupply_: utils.cleanValue(ethers.utils.formatEther(x.totalSupply), 2),
          fyDaiBalance_: utils.cleanValue(ethers.utils.formatEther(x.fyDaiBalance), 2),
          ethDebtFyDai_: utils.cleanValue(ethers.utils.formatEther(x.ethDebtFyDai), 2),
          ethDebtDai_: utils.cleanValue(ethers.utils.formatEther(x.ethDebtDai), 2),
          poolTokens_: utils.cleanValue(ethers.utils.formatEther(x.poolTokens), 6),
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
  const updateSeries = async (seriesArr:IYieldSeries[], firstLoad:boolean ) => {
    if(!yieldLoading) {
      dispatch({ type:'isLoading', payload: true });

      /* pre-populate info with cached data if available */
      if (firstLoad) {
        const preMap:any = _prePopulateSeriesData(seriesArr);
        const preSeries: IYieldSeries[] = Array.from(preMap.values());
        const preSelect = preSeries
          .filter((x:IYieldSeries)=>!x.isMature())
          .sort((a:IYieldSeries, b:IYieldSeries)=> a.maturity-b.maturity );
        dispatch({ type:'setActiveSeries', payload: preMap.get(preSelect[0].maturity) }); 
      }
      
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
    }
  };

  /* Init all the series once yieldState is not loading and re-init on any user and/or network change */
  useEffect( () => {
    (provider || fallbackProvider) && !yieldLoading && ( async () => {
      await updateSeries(yieldState.deployedSeries, true);
    })();
  }, [ provider, fallbackProvider, chainId, account, yieldLoading ]);

  /* Actions for updating the series Context */
  const actions = {
    updateSeries: (series:IYieldSeries[]) => updateSeries(series, false), /* updates one, or any number of series */
    updateActiveSeries: () => updateSeries([state.activeSeries], false), /* updates only the active series */
    setActiveSeries: (seriesMaturity:string) => dispatch({ type:'setActiveSeries', payload: state.seriesData.get(seriesMaturity) }),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
