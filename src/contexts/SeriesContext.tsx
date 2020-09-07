import React from 'react';
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
  const { state: userState } = React.useContext( UserContext );
  const { state: yieldState } = React.useContext(YieldContext);
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
        sellYDai -> Returns how much Dai would be obtained by selling 1 yDai
        buyDai -> Returns how much yDai would be required to buy 1 Dai
        buyYDai -> Returns how much Dai would be required to buy 1 yDai
        sellDai -> Returns how much yDai would be obtained by selling 1 Dai
    */
    const _ratesData = await Promise.all(
      seriesArr.map( async (x:IYieldSeries, i:number) => {
        const _x = { ...x, isMature: ()=>( x.maturity < Math.round(new Date().getTime() / 1000)) };
        const [ sellYDai, buyYDai, sellDai, buyDai ] = await Promise.all([
          await previewPoolTx('sellYDai', _x, 1),
          await previewPoolTx('buyYDai', _x, 1),
          await previewPoolTx('sellDai', _x, 1),
          await previewPoolTx('buyDai', _x, 1),
        ]);
        return {
          maturity: x.maturity,
          sellYDai: sellYDai || BigNumber.from('0'),
          buyYDai: buyYDai || BigNumber.from('0'),
          sellDai: sellDai || BigNumber.from('0'),
          buyDai: buyDai || BigNumber.from('0'),
        };
      })
    );

    const _parsedRatesData = _ratesData.reduce((acc: any, x:any) => {
      return acc.set(
        x.maturity,
        { ...x,
          sellYDai_: parseFloat(ethers.utils.formatEther(x.sellYDai.toString())),
          buyYDai_: parseFloat(ethers.utils.formatEther(x.buyYDai.toString())),
          sellDai_: parseFloat(ethers.utils.formatEther(x.sellDai.toString())),
          buyDai_: parseFloat(ethers.utils.formatEther(x.buyDai.toString())),
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
          _seriesData[i].yieldAPR = yieldAPR(_rates.sellYDai, ethers.utils.parseEther('1'), x.maturity);       
          _seriesData[i].totalSupply = await callTx(x.poolAddress, 'Pool', 'totalSupply', []);
          _seriesData[i].poolTokens = account? await callTx(x.poolAddress, 'Pool', 'balanceOf', [account]): BigNumber.from('0') ;               
          _seriesData[i].hasDelegatedPool = account? await checkPoolDelegate(x.poolAddress, deployedContracts.YieldProxy): null;            
          _seriesData[i].ethDebtDai = account? await debtDai('ETH-A', x.maturity ): BigNumber.from('0') ;     
          _seriesData[i].ethDebtYDai = account? await callTx(deployedContracts.Controller, 'Controller', 'debtYDai', [utils.ETH, x.maturity, account]): BigNumber.from('0');
          _seriesData[i].yDaiBalance = account? await callTx(x.yDaiAddress, 'YDai', 'balanceOf', [account]): BigNumber.from('0') ;
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
          yDaiBalance_: parseFloat(ethers.utils.formatEther(x.yDaiBalance.toString())),
          ethDebtYDai_: parseFloat(ethers.utils.formatEther(x.ethDebtYDai.toString())),
          ethDebtDai_: parseFloat(ethers.utils.formatEther(x.ethDebtDai.toString())),
          poolTokens_: parseFloat(ethers.utils.formatEther(x.poolTokens.toString())),
          poolPercent_: poolPercent(x.totalSupply, x.poolTokens),
          poolState: checkPoolState(x),
          yieldAPR_: x.yieldAPR.toFixed(2),
        }
      );
    }, state.seriesData);

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
      if (!state.activeSeries) {

        /* if no active series or, set it to non-mature series that is maturing soonest. */
        const unmatureSeries: IYieldSeries[] = Array.from(seriesMap.values());
        const toSelect = unmatureSeries
          .filter((x:IYieldSeries)=>!x.isMature())
          .sort((a:IYieldSeries, b:IYieldSeries)=> { return a.maturity-b.maturity } );
        dispatch({ type:'setActiveSeries', payload: seriesMap.get(toSelect[0].maturity) });
        // dispatch({ type:'setActiveSeries', payload: seriesMap.entries().next().value[1] });

      } else if (seriesArr.length===1 ){
        /* if there was only one series updated set that one as the active series */
        dispatch({ type:'setActiveSeries', payload: seriesMap.get(seriesArr[0].maturity) });
      } else {
        // other situation catch
        dispatch({ type:'setActiveSeries', payload: seriesMap.entries().next().value[1] });
      }
      dispatch({ type:'isLoading', payload: false });

      console.log('Series Updated:' );
      console.log(seriesMap);

    } else {
      console.log('Positions exist... Force fetch if required');
    }
  };

  /* Init series context and re-init on any user and/or network change */
  React.useEffect( () => {
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
