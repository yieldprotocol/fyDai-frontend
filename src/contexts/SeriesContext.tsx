import React from 'react';
import { ethers, BigNumber } from 'ethers';

import * as utils from '../utils';

import { YieldContext } from './YieldContext';
import { UserContext } from './UserContext';

import { useCallTx, useMath, usePool, useSignerAccount, useWeb3React, useController } from '../hooks';
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

  const { account } = useSignerAccount();
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

  const { previewPoolTx, checkPoolDelegate }  = usePool();
  const { checkControllerDelegate }  = useController();
  const [ callTx ] = useCallTx();
  const { yieldAPR }  = useMath();

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
      seriesArr.map( async (x:any, i:number) => {
        // TODO fix this when all markets are operational => x.market (not seriesArr[0].market )
        const [ sellYDai, buyYDai, sellDai, buyDai ] = await Promise.all([
          await previewPoolTx('sellYDai', seriesArr[0].poolAddress, 1),
          await previewPoolTx('buyYDai', seriesArr[0].poolAddress, 1),
          await previewPoolTx('sellDai', seriesArr[0].poolAddress, 1),
          await previewPoolTx('buyDai', seriesArr[0].poolAddress, 1)
        ]);

        return {
          maturity: x.maturity,
          sellYDai,
          buyYDai,
          sellDai,
          buyDai,
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
        console.log(_rates.sellYDai.toString());
        _seriesData.push(x);
        try {
          _seriesData[i].hasDelegatedPool = await checkPoolDelegate(x.poolAddress, x.yDaiAddress);
          _seriesData[i].hasDelegatedController = await checkControllerDelegate(deployedContracts.Controller, x.daiProxyAddress);
          _seriesData[i].yDaiBalance = account? await callTx(x.yDaiAddress, 'YDai', 'balanceOf', [account]): BigNumber.from('0') ;
          _seriesData[i].isMature = await callTx(x.yDaiAddress, 'YDai', 'isMature', []);
          _seriesData[i].ethDebtYDai = account? await callTx(deployedContracts.Controller, 'Controller', 'debtYDai', [utils.ETH, x.maturity, account]): BigNumber.from('0');
          _seriesData[i].ethDebtDai = account? utils.mulRay( _seriesData[i].ethDebtYDai, _rates.sellYDai): BigNumber.from('0');
          _seriesData[i].yieldAPR = yieldAPR(_rates.sellYDai, ethers.utils.parseEther('1'), x.maturity);
        } catch (e) {
          console.log(`Could not load account positions data: ${e}`);
        }
      })
    );

    const _parsedSeriesData = _seriesData.reduce((acc: Map<string, any>, x:any) => {
      return acc.set(
        x.maturity,
        { ...x,
          yDaiBalance_: parseFloat(ethers.utils.formatEther(x.yDaiBalance.toString())),
          ethDebtYDai_: parseFloat(ethers.utils.formatEther(x.ethDebtYDai.toString())),
          ethDebtDai_: parseFloat(ethers.utils.formatEther(x.ethDebtDai.toString())),
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
    if (force !== true) {
      filteredSeriesArr = seriesArr.filter(x => !state.seriesData.has(x.maturity));
    } else {
      filteredSeriesArr = seriesArr;
    }
    if ( !yieldState.isLoading && filteredSeriesArr.length > 0) {
      dispatch({ type:'isLoading', payload: true });

      /* Get series rates and update */
      const rates = await _getRates(filteredSeriesArr);
      
      /* Build/re-build series map */
      const seriesMap:any = await _getSeriesData(filteredSeriesArr, rates);
          
      /* set the active series */
      if (!state.activeSeries) {
        /* if no active series or , set it to the first entry of the map. */
        dispatch({ type:'setActiveSeries', payload: seriesMap.entries().next().value[1] });
      } else if (seriesArr.length===1 ){
        /* if there was only one series updated set that one as the active series */
        dispatch({ type:'setActiveSeries', payload: seriesMap.get(seriesArr[0].maturity) });
      } else {
        // other situation catch
        dispatch({ type:'setActiveSeries', payload: seriesMap.entries().next().value[1] });
      }

      dispatch({ type:'isLoading', payload: false });

      console.log('Series Updated:' );
      console.log(filteredSeriesArr);

    } else {
      console.log('Positions exist... Force fetch if required');
    }
  };

  React.useEffect( () => {
    !userState.isLoading &&
    !yieldState.isLoading &&
    console.log('triggered series update');
    // ( async () => {
    //   await updateSeriesList(yieldState.deployedSeries, false);
    // })();
  }, [ userState.balances ]);

  /* Init series context and re-init on any user and/or network change */
  React.useEffect( () => {
    chainId && !yieldState.isLoading && ( async () => {
      await updateSeriesList(yieldState.deployedSeries, false);
    })();
  }, [ chainId, account, yieldState.isLoading ]);

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
