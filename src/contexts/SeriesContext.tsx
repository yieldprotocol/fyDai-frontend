import React, { useEffect, useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ethers, BigNumber } from 'ethers';

import { cleanValue, ETH,  } from '../utils';
import { calculateAPR, divDecimal, mulDecimal } from '../utils/yieldMath';

import { IYieldSeries } from '../types';

import { YieldContext } from './YieldContext';

import { useSignerAccount } from '../hooks/connectionHooks';
import { usePool } from '../hooks/poolHook';

import { useToken } from '../hooks/tokenHook';
import { useController } from '../hooks/controllerHook';
import { useCallTx } from '../hooks/chainHooks';

const SeriesContext = React.createContext<any>({});

const initState = { 
  seriesData : new Map(),
  activeSeriesId: null,
  seriesLoading : true,
};

function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updateSeries':
      return {
        ...state,
        seriesData: action.payload,
      };
    case 'setActiveSeriesId':
      return {
        ...state,
        activeSeriesId: action.payload,
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

  const { account, provider, fallbackProvider, chainId } = useSignerAccount();
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = useContext(YieldContext);
  const { yieldLoading, deployedContracts } = yieldState;

  const { previewPoolTx, checkPoolState } = usePool();
  const { debtDai } = useController();
  
  const { getBalance } = useToken();

  const [ callTx ] = useCallTx();

  // const { poolPercent: calcPercent }  = useMath();

  const { pathname } = useLocation();
  const [ seriesFromUrl, setSeriesFromUrl] = useState<number|null>(null);

  useEffect(()=> {
    pathname && setSeriesFromUrl(parseInt(pathname.split('/')[2], 10));
  }, [ pathname ]);

  const _prePopulateSeriesData = (seriesArr:IYieldSeries[]) => {
    /* preMap is for faster loading - creates an initial map from the cached data */
    const preMap= seriesArr.reduce((acc: Map<string, any>, x:any) => {
      const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
      return acc.set( x.maturity, { ..._x });
    }, state.seriesData);
    dispatch( { type:'updateSeries', payload: preMap });
    return preMap;
  };

  /* PRIVATE Get the data for a particular series, OR set of series  */
  const _getSeriesData = async (seriesArr:IYieldSeries[]) => {
    
    /* concurrently get all the series data */
    const _seriesData = await Promise.all(
      seriesArr.map( async (x:IYieldSeries, i:number) => {
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
        /* with no user */
        const [ sellFYDaiRate, totalSupply ] = await Promise.all([
          await previewPoolTx('sellFYDai', _x, 1),
          await callTx(_x.poolAddress, 'Pool', 'totalSupply', []),
        ]);

        /* with user */
        const [ 
          poolTokens, 
          ethDebtDai, 
          ethDebtFYDai, 
          fyDaiBalance
        ] =  account && await Promise.all([
          getBalance(_x.poolAddress, 'Pool', account),
          debtDai('ETH-A', _x.maturity ),
          callTx(deployedContracts.Controller, 'Controller', 'debtFYDai', [ ETH, _x.maturity, account]),
          getBalance(_x.fyDaiAddress, 'FYDai', account),
        ]) || [];

        return {
          ..._x,
          sellFYDaiRate: !(sellFYDaiRate instanceof Error)? sellFYDaiRate : BigNumber.from('0'),
          totalSupply,
          poolTokens: poolTokens || BigNumber.from('0'),
          ethDebtDai: ethDebtDai || BigNumber.from('0'),
          ethDebtFYDai : ethDebtFYDai || BigNumber.from('0'),
          fyDaiBalance : fyDaiBalance || BigNumber.from('0'),
        };
      })
    );

    /* Parse the data */
    const _parsedSeriesData = _seriesData.reduce((acc: Map<string, any>, x:any) => {
      const yieldAPR = calculateAPR(x.sellFYDaiRate, ethers.utils.parseEther('1'), x.maturity) || '0';
      const poolRatio = divDecimal(x.poolTokens, x.totalSupply) || '0';
      const poolPercent = mulDecimal( poolRatio, '100');
      const poolState = checkPoolState(x);
      return acc.set(
        x.maturity,
        { ...x,
          sellFYDaiRate_: cleanValue(ethers.utils.formatEther(x.sellFYDaiRate), 2),
          totalSupply_: cleanValue(ethers.utils.formatEther(x.totalSupply), 2),
          /* formating below for visual consistenciy - 0.00 */
          fyDaiBalance_: ethers.utils.formatEther(x.fyDaiBalance) === '0.0' ? '0.00' : cleanValue(ethers.utils.formatEther(x.fyDaiBalance), 2),
          ethDebtFYDai_: ethers.utils.formatEther(x.ethDebtFYDai) === '0.0'  ? '0.00' : cleanValue(ethers.utils.formatEther(x.ethDebtFYDai), 2),
          ethDebtDai_: cleanValue(ethers.utils.formatEther(x.ethDebtDai), 2),
          poolTokens_: cleanValue(ethers.utils.formatEther(x.poolTokens), 6),
          yieldAPR_: cleanValue(yieldAPR, 2),
          poolRatio_ : cleanValue(poolRatio, 4),
          poolPercent_: cleanValue(poolPercent, 4),
          yieldAPR,
          poolState,
        }
      );
    }, state.seriesData);

    console.log(_parsedSeriesData);
    /* Update state and return  */
    dispatch( { type:'updateSeries', payload: _parsedSeriesData });
    return _parsedSeriesData;
  };

  /* PUBLIC EXPOSED (via actions) Update series from a list of series */
  const updateSeries = async (seriesArr:IYieldSeries[], firstLoad:boolean ) => {

    if(!yieldLoading) {
      dispatch({ type:'isLoading', payload: true });

      /* Pre-populate info with cached data if available */
      if (firstLoad) {
        const preMap:any = _prePopulateSeriesData(seriesArr);
        const preSeries: IYieldSeries[] = Array.from(preMap.values());
        const preSelect = preSeries
          .filter((x:IYieldSeries)=>!x.isMature())
          .sort((a:IYieldSeries, b:IYieldSeries)=> a.maturity-b.maturity );
        /* check if the value in the url is a valid series date, if so, use it */
        if (preMap.get(seriesFromUrl)) {
          dispatch({ type:'setActiveSeriesId', seriesFromUrl });
        } else {
          dispatch({ type:'setActiveSeriesId', payload: preSelect[0].maturity });
        }
      }
      
      /* Build/Re-build series map with data */ 
      const seriesMap:any = await _getSeriesData(seriesArr);

      /* Set the activeSeries if there isn't one already */
      if (!state.activeSeriesId || seriesArr.length > 1) {
        /* if no active series, set it to non-mature series that is maturing soonest. */
        const unmatureSeries: IYieldSeries[] = Array.from(seriesMap.values());
        const toSelect = unmatureSeries
          .filter((x:IYieldSeries)=>!x.isMature())
          .sort((a:IYieldSeries, b:IYieldSeries)=> a.maturity-b.maturity );

        /* check if the value in the url is a valid series date, if so, use it */
        if (seriesMap.get(seriesFromUrl)) {
          dispatch({ type:'setActiveSeriesId', payload: seriesFromUrl });
        } else {
          dispatch({ type:'setActiveSeriesId', payload: toSelect[0].maturity });
        }
      }
      dispatch({ type:'isLoading', payload: false });
    }
  };

  /* Init all the series once yieldState is not loading and re-init on any user and/or network change */
  useEffect( () => {
    (provider || fallbackProvider) && !yieldLoading && ( async () => {
      try {
        await updateSeries(yieldState.deployedSeries, true);
      } catch (e) {
        console.log(e);
      }
    })();
  }, [ provider, fallbackProvider, chainId, account, yieldLoading ]);

  /* Actions for updating the series Context */
  const actions = {
    updateAllSeries: () => updateSeries(yieldState.deployedSeries, false),
    updateSeries: (series:IYieldSeries[]) => updateSeries(series, false), /* updates one, or any number of series */
    updateActiveSeries: () => updateSeries([state.seriesData.get(state.activeSeriesId)], false), /* updates only the active series */
    setActiveSeries: (seriesMaturity:string) => dispatch({ type:'setActiveSeriesId', payload: seriesMaturity }),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
