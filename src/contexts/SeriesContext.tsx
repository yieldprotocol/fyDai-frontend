import React, { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber } from 'ethers';

import * as utils from '../utils';

import { YieldContext } from './YieldContext';
import { UserContext } from './UserContext';

import { useCallTx, useMath, usePool, useSignerAccount, useWeb3React, useController, useToken } from '../hooks';
import { IYieldSeries } from '../types';

const SeriesContext = React.createContext<any>({});

function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updateSeries':
      return {
        ...state,
        seriesData: action.payload,
      };
    case 'updateRates':
      return {
        ...state,
        seriesRates: action.payload,
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

  const initState = { 
    seriesData : new Map(),
    seriesRates: new Map(),
    activeSeries: null,
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: userState } = useContext( UserContext );
  const { state: yieldState } = useContext(YieldContext);
  const { feedData, deployedContracts } = yieldState;

  const { previewPoolTx, checkPoolDelegate, checkPoolState } = usePool();
  const { checkControllerDelegate, debtDai } = useController();
  const { getBalance } = useToken();

  const [ callTx ] = useCallTx();
  const { yieldAPR, poolPercent }  = useMath();


  /* Get the yield market rates for a particular set of series */
  const _getRates = async (seriesArr:IYieldSeries[]) => {
    /* 
      Rates:
        sellEDai -> Returns how much Dai would be obtained by selling 1 eDai
        buyDai -> Returns how much eDai would be required to buy 1 Dai
        buyEDai -> Returns how much Dai would be required to buy 1 eDai
        sellDai -> Returns how much eDai would be obtained by selling 1 Dai
    */
    const _ratesData = await Promise.all(
      seriesArr.map( async (x:IYieldSeries, i:number) => {
        console.log('rates got')
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
        const [ sellEDai, buyEDai, sellDai, buyDai ] = await Promise.all([
          await previewPoolTx('sellEDai', _x, 1),
          // await previewPoolTx('buyEDai', _x, 1),
          // await previewPoolTx('sellDai', _x, 1),
          // await previewPoolTx('buyDai', _x, 1),
        ]);
        return {
          maturity: x.maturity,
          sellEDai: !(sellEDai instanceof Error)? sellEDai : BigNumber.from('0'),
          // buyEDai: !(buyEDai instanceof Error)? buyEDai : BigNumber.from('0'),
          // sellDai: !(sellDai instanceof Error)? sellDai : BigNumber.from('0'),
          // buyDai: !(buyDai instanceof Error)? buyDai : BigNumber.from('0'),
        };
      })
    );

    const _parsedRatesData = _ratesData.reduce((acc: any, x:any) => {
      return acc.set(
        x.maturity,
        { ...x,
          sellEDai_: parseFloat(ethers.utils.formatEther(x.sellEDai.toString())),
          // buyEDai_: parseFloat(ethers.utils.formatEther(x.buyEDai.toString())),
          // sellDai_: parseFloat(ethers.utils.formatEther(x.sellDai.toString())),
          // buyDai_: parseFloat(ethers.utils.formatEther(x.buyDai.toString())),
        }
      );
    }, state.seriesRates);

    /* update context state and return */
    dispatch( { type:'updateRates', payload: _parsedRatesData });
    return _parsedRatesData;
  };

  /* Get the data for a particular series, or set of series */
  const _getSeriesData = async (seriesArr:IYieldSeries[], rates:Map<string, any>) => {
    const _seriesData:any[] = [];    
    await Promise.all(
      seriesArr.map( async (x:any, i:number) => {
        const _rates = rates.get(x.maturity);
        _seriesData.push(x);
        try {
          _seriesData[i].yieldAPR = yieldAPR(_rates.sellEDai, ethers.utils.parseEther('1'), x.maturity);       
          _seriesData[i].totalSupply = await callTx(x.poolAddress, 'Pool', 'totalSupply', []);
          _seriesData[i].poolTokens = account? await callTx(x.poolAddress, 'Pool', 'balanceOf', [account]): BigNumber.from('0') ;               
          _seriesData[i].hasDelegatedPool = account? await checkPoolDelegate(x.poolAddress, deployedContracts.YieldProxy): null;            
          _seriesData[i].ethDebtDai = account? await debtDai('ETH-A', x.maturity ): BigNumber.from('0') ;     
          _seriesData[i].ethDebtEDai = account? await callTx(deployedContracts.Controller, 'Controller', 'debtEDai', [utils.ETH, x.maturity, account]): BigNumber.from('0');
          _seriesData[i].eDaiBalance = account? await callTx(x.eDaiAddress, 'EDai', 'balanceOf', [account]): BigNumber.from('0') ;
          _seriesData[i].isMature = ()=>( x.maturity < Math.round(new Date().getTime() / 1000));
        } catch (e) {
          console.log(`Could not load account positions data: ${e}`);
        }
      })
    );

    const _parsedSeriesData = _seriesData.reduce((acc: Map<string, any>, x:any) => {
      return acc.set(
        x.maturity,
        { ...x,
          totalSupply_: parseFloat(ethers.utils.formatEther(x.totalSupply.toString())),
          eDaiBalance_: parseFloat(ethers.utils.formatEther(x.eDaiBalance.toString())),
          ethDebtEDai_: parseFloat(ethers.utils.formatEther(x.ethDebtEDai.toString())),
          ethDebtDai_: parseFloat(ethers.utils.formatEther(x.ethDebtDai.toString())),
          poolTokens_: parseFloat(ethers.utils.formatEther(x.poolTokens.toString())),
          poolPercent_: poolPercent(x.totalSupply, x.poolTokens),
          poolState: checkPoolState(x),
          yieldAPR_: x.yieldAPR.toFixed(2),
        }
      );
    }, state.seriesData);

    console.log(_parsedSeriesData); 

    /* Update state and return  */
    dispatch( { type:'updateSeries', payload: _parsedSeriesData });
    return _parsedSeriesData;
  };

  // Get the Positions data for a series list
  const updateSeriesList = async (seriesArr:IYieldSeries[], force:boolean) => {
    let filteredSeriesArr;

    if (force) {
      filteredSeriesArr = seriesArr;     
    } else {
      filteredSeriesArr = seriesArr.filter(x => !state.seriesData.has(x.maturity));    
    }

    if ( !yieldState.isLoading && filteredSeriesArr.length > 0) {
      dispatch({ type:'isLoading', payload: true });

      /* Get series rates and update */
      const rates = await _getRates(filteredSeriesArr);
      
      /* Build/re-build series map with data */
      const seriesMap:any = await _getSeriesData(filteredSeriesArr, rates);
          
      /* set the active series */
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

    } else {
      console.log('Positions exist... Force fetch if required');
    }
  };

  /* Init series context and re-init on any user and/or network change */
  useEffect( () => {
    (provider || fallbackProvider) && !yieldState.isLoading && ( async () => {
      await updateSeriesList(yieldState.deployedSeries, false);
    })();
  }, [ provider, fallbackProvider, chainId, account, yieldState.isLoading ]);

  const actions = {
    updateSeries: (series:IYieldSeries[]) => updateSeriesList(series, true),
    updateActiveSeries: () => updateSeriesList([state.activeSeries], true), // not really required now but may have application later
    setActiveSeries: (seriesMaturity:string) => dispatch({ type:'setActiveSeries', payload: state.seriesData.get(seriesMaturity) }),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
