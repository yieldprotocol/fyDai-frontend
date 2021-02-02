import React, { useEffect, useContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ethers, BigNumber } from 'ethers';

/* utils and support */
import { cleanValue } from '../utils';
import { calculateAPR, divDecimal, mulDecimal, floorDecimal, sellFYDai, buyFYDai, secondsToFrom, getFee } from '../utils/yieldMath';
import { IYieldSeries } from '../types';

/* contexts */
import { YieldContext } from './YieldContext';

/* hooks */ 
import { useSignerAccount } from '../hooks/connectionHooks';
import { usePool } from '../hooks/poolHook';
import { useToken } from '../hooks/tokenHook';
import { useController } from '../hooks/controllerHook';
import { useEvents } from '../hooks/eventHooks';
import { CgArrowsExpandDownLeft } from 'react-icons/cg';

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

  const { pathname } = useLocation();

  /* state from context */
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = useContext(YieldContext);
  const { yieldLoading } = yieldState;

  /* local state */
  const [ seriesFromUrl, setSeriesFromUrl] = useState<number|null>(null);

  /* hooks init */
  const { account, provider, fallbackProvider, chainId } = useSignerAccount();
  const { checkPoolState, poolTotalSupply, getReserves } = usePool();
  const { debtDai, debtFYDai } = useController();
  const { getBalance } = useToken();
  const { addEventListener } = useEvents();

  /* If the url references a series... set that one as active */
  useEffect(()=> {
    pathname && setSeriesFromUrl(parseInt(pathname.split('/')[2], 10));
  }, [ pathname ]);

  /* Populate the series data with the cached/static info */
  const _prePopulateSeriesData = (seriesArr:IYieldSeries[]) => {
    /* preMap is for faster loading - creates an initial map from the cached data */
    const preMap= seriesArr.reduce((acc: Map<string, any>, x:any) => {
      const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
      return acc.set( x.maturity, { ..._x });
    }, state.seriesData);
    dispatch( { type:'updateSeries', payload: preMap });
    return preMap;
  };

  const _getReservesData = async (seriesArr:IYieldSeries[]) => {

    /* Get all the reserves data for the series CONCURRENTLY */
    const _reservesData = await Promise.all(
      seriesArr.map( async (x:IYieldSeries, i:number) => {
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
        /* Get reserves data */
        const [
          totalSupply,
          [ daiReserves, fyDaiReserves, fyDaiVirtualReserves ] 
        ] = await Promise.all([
          await poolTotalSupply(_x.poolAddress),
          await getReserves(_x)
        ]);

        return {
          ..._x,
          totalSupply,
          daiReserves, 
          fyDaiReserves, 
          fyDaiVirtualReserves,
        };
      })
    );
       
    /* Parse the data */
    const _parsedReservesData = _reservesData.reduce((acc: Map<string, any>, x:any) => {
      
      const _rate = sellFYDai(
        x.daiReserves, 
        x.fyDaiVirtualReserves, 
        ethers.utils.parseEther('1'), 
        secondsToFrom(x.maturity).toString()
      );
      const yieldAPR = calculateAPR( floorDecimal( _rate ), ethers.utils.parseEther('1'), x.maturity) || '0';

      return acc.set(
        x.maturity,
        {
          ...x,
          totalSupply_: cleanValue(ethers.utils.formatEther(x.totalSupply), 2),
          daiReserves_:  cleanValue(ethers.utils.formatEther(x.daiReserves), 2),
          fyDaiReserves_: cleanValue(ethers.utils.formatEther(x.fyDaiReserves), 2), 
          fyDaiVirtualReserves_: cleanValue(ethers.utils.formatEther(x.fyDaiVirtualReserves), 2),
          yieldAPR: cleanValue(yieldAPR, 2),
          yieldAPR_: cleanValue(yieldAPR, 2)
        }
      );
    }, new Map() );

    return _parsedReservesData;

  };


  /* Get the data for a particular series, OR set of series  (internally callable only) */
  const _getSeriesData = async (seriesArr:IYieldSeries[]) => {

    const reservesData = await _getReservesData(seriesArr);
    // console.log('reservesData:', reservesData);
    
    /* Get all the series data for the series CONCURRENTLY */
    const _seriesData = await Promise.all(

      seriesArr.map( async (x:IYieldSeries, i:number) => {
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
        /* get all the user specific data */
        const [ 
          poolTokens, 
          ethDebtDai, 
          ethDebtFYDai, 
          fyDaiBalance
        ] =  account && await Promise.all([
          getBalance(_x.poolAddress, 'Pool', account),
          debtDai('ETH-A', _x.maturity ),
          debtFYDai('ETH-A', _x.maturity ), 
          getBalance(_x.fyDaiAddress, 'FYDai', account),
        ]) || new Array(4).fill(BigNumber.from('0'));

        return {
          ..._x,
          poolTokens,
          ethDebtDai,
          ethDebtFYDai,
          fyDaiBalance,
        };
      })
    );

    /* Parse the data */
    const _parsedSeriesData = _seriesData.reduce((acc: Map<string, any>, x:any) => {
     
      /* add in the reserves data and reserve data calcs */
      const _reserves = reservesData.get(x.maturity);
      const poolRatio = divDecimal(x.poolTokens, _reserves.totalSupply);
      const poolPercent = mulDecimal( poolRatio, '100');
      const poolState = checkPoolState(x);

      return acc.set(
        x.maturity,
        { ...x,
          ..._reserves,
          /* formating below for visual consistenciy - 0.00 */
          fyDaiBalance_: ethers.utils.formatEther(x.fyDaiBalance) === '0.0' ? '0.00' : cleanValue(ethers.utils.formatEther(x.fyDaiBalance), 2),
          ethDebtFYDai_: ethers.utils.formatEther(x.ethDebtFYDai) === '0.0'  ? '0.00' : cleanValue(ethers.utils.formatEther(x.ethDebtFYDai), 2),
          ethDebtDai_: cleanValue(ethers.utils.formatEther(x.ethDebtDai), 2),
          poolTokens_: cleanValue(ethers.utils.formatEther(x.poolTokens), 6),
          poolRatio_ : cleanValue(poolRatio, 4),
          poolPercent: cleanValue(poolPercent, 4),
          poolState,
        }
      );
    }, state.seriesData);

    return _parsedSeriesData;
  };

  const updateReserves = async (seriesArr:IYieldSeries[]) => {

    /* Build/Re-build series map with data */
    const reservesMap:Map<any, IYieldSeries> = await _getReservesData(seriesArr);

    /* Combine with exisiting seriesData */
    const _newData = seriesArr.reduce((acc: Map<string, any>, x:any) => { 
      const _reserves = reservesMap.get(x.maturity);
      const _series = state.seriesData.get(x.maturity);
      
      const diff = _reserves?.totalSupply_ && (_reserves?.totalSupply_ - _series.totalSupply_);
      const diffpercent = diff && diff/ _series.totalSupply_ *100;
      const _change = { liqChange: diffpercent, liqChangeLast: (new Date().getTime()/1000)  };

      return acc.set( x.maturity, { ..._series, ..._reserves, ..._change } );
    }, new Map() );

    /* Update state and return  */
    dispatch( { type:'updateSeries', payload: _newData });

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
      const seriesMap:Map<any, IYieldSeries> = await _getSeriesData(seriesArr);
      /* Update state and return  */
      dispatch( { type:'updateSeries', payload: seriesMap });

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
        /* update the series' */
        await updateSeries(yieldState.deployedSeries, true);

        /* Add in an event watcher that updates reserves on pool liquiidty change */
        yieldState?.deployedSeries?.forEach( (x:IYieldSeries) => {
          addEventListener(
            x.poolAddress,
            'Pool',
            'Liquidity',
            [null, null, null, null, null, null],
            ()=> { 
              console.log(`Reserves being updated: ${x.poolAddress}`); 
              updateReserves([x]);
            } 
          );
        });

      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    })();


  }, [ provider, fallbackProvider, chainId, account, yieldLoading ]);


  /* Actions for updating the series Context */
  const actions = {
    updateReserves: (series:IYieldSeries[]) => updateReserves(series),
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
