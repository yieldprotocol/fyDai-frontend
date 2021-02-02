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
  const { previewPoolTx, checkPoolState, poolTotalSupply, getReserves } = usePool();
  const { debtDai, debtFYDai } = useController();
  const { getBalance } = useToken();

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

    /* Get all the reserves data for the series set CONCURRENTLY */
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

      return acc.set(
        x.maturity,
        { ...x,
          // totalSupply_: cleanValue(ethers.utils.formatEther(x.totalSupply), 2),
          // daiReserves_:  cleanValue(ethers.utils.formatEther(x.daiReserves), 2),
          // fyDaiReserves_: cleanValue(ethers.utils.formatEther(x.fyDaiReserves), 2), 
          // fyDaiVirtualReserves_: cleanValue(ethers.utils.formatEther(x.fyDaiVirtualReserves), 2),
        }
      );
    }, state.seriesData);
    
    console.log('reserves:', _parsedReservesData);
    /* Update state and return  */
    // dispatch( { type:'updateSeries', payload: { ...state.seriesData, _parsedReservesData } });
    return _parsedReservesData;

  };


  /* Get the data for a particular series, OR set of series  (internally callable only) */
  const _getSeriesData = async (seriesArr:IYieldSeries[]) => {
    
    /* Get all the series data for the series CONCURRENTLY */
    const _seriesData = await Promise.all(
      seriesArr.map( async (x:IYieldSeries, i:number) => {
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };

        /* Get data not associated with a particular user */
        const [ 
          sellFYDaiRate,
          totalSupply, 
          [ daiReserves, fyDaiReserves, fyDaiVirtualReserves ] 
        ] = await Promise.all([
          await previewPoolTx('sellFYDai', _x, 1),
          await poolTotalSupply(_x.poolAddress),
          await getReserves(_x)
        ]);

        /* .. and now, With user */
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
          sellFYDaiRate: !(sellFYDaiRate instanceof Error)? sellFYDaiRate : BigNumber.from('0'),
          totalSupply,
          poolTokens,
          daiReserves, 
          fyDaiReserves, 
          fyDaiVirtualReserves,
          ethDebtDai,
          ethDebtFYDai,
          fyDaiBalance,
        };
      })
    );

    /* Parse the data */
    const _parsedSeriesData = _seriesData.reduce((acc: Map<string, any>, x:any) => {
     
      // console.log('preview    :',  x.sellFYDaiRate.toString() );
      // console.log('clientside :', floorDecimal( _rate ) );
      // console.log(' minus     :', ethers.utils.formatEther( (BigNumber.from(floorDecimal( _rate )).sub(x.sellFYDaiRate)).toString() ) );
      // console.log('fee        :',  ethers.utils.formatEther(floorDecimal(fee)) );
      // console.log('apr_ preview', cleanValue( calculateAPR( x.sellFYDaiRate, ethers.utils.parseEther('1'), x.maturity) || '', 3) );
      // console.log('apr_ clientside', cleanValue( calculateAPR( floorDecimal( _rate ), ethers.utils.parseEther('1'), x.maturity) || '', 3) );
      // console.log( 'SellFYDai:', sellFYDai(x.daiReserves, x.fyDaiReserves, ethers.utils.parseEther('1'), secondsToFrom(x.maturity) ));
      // console.log( calculateAPR( x.sellFYDaiRate, ethers.utils.parseEther('1'), x.maturity) );

      const _rate = sellFYDai(
        x.daiReserves, 
        x.fyDaiVirtualReserves, 
        ethers.utils.parseEther('1'), 
        secondsToFrom(x.maturity).toString()
      );
      const yieldAPR = calculateAPR( floorDecimal( _rate ), ethers.utils.parseEther('1'), x.maturity) || '0';

      const poolRatio = divDecimal(x.poolTokens, x.totalSupply);
      const poolPercent = mulDecimal( poolRatio, '100');
      const poolState = checkPoolState(x);
      return acc.set(
        x.maturity,
        { ...x,
          // sellFYDaiRate_: cleanValue(x.sellFYDaiRate, 2),
          totalSupply_: cleanValue(ethers.utils.formatEther(x.totalSupply), 2),
          /* formating below for visual consistenciy - 0.00 */
          fyDaiBalance_: ethers.utils.formatEther(x.fyDaiBalance) === '0.0' ? '0.00' : cleanValue(ethers.utils.formatEther(x.fyDaiBalance), 2),
          ethDebtFYDai_: ethers.utils.formatEther(x.ethDebtFYDai) === '0.0'  ? '0.00' : cleanValue(ethers.utils.formatEther(x.ethDebtFYDai), 2),
          ethDebtDai_: cleanValue(ethers.utils.formatEther(x.ethDebtDai), 2),
          poolTokens_: cleanValue(ethers.utils.formatEther(x.poolTokens), 6),
          yieldAPR_: cleanValue(yieldAPR, 2),
          poolRatio_ : cleanValue(poolRatio, 4),
          poolPercent: cleanValue(poolPercent, 4),
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
        await updateSeries(yieldState.deployedSeries, true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    })();
  }, [ provider, fallbackProvider, chainId, account, yieldLoading ]);

  /* Actions for updating the series Context */
  const actions = {
    updateReserves: (series:IYieldSeries[]) => _getReservesData(series),
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
