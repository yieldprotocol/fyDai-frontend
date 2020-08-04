import React from 'react';
import { ethers, BigNumber } from 'ethers';

import * as utils from '../utils';
import { useCallTx, useMath, usePool, useSignerAccount, useWeb3React, useController } from '../hooks';
import { YieldContext } from './YieldContext';

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
    case 'updateAggregates':
      return {
        ...state,
        seriesAggregates: action.payload,
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

  const { account, provider } = useSignerAccount();
  const { chainId } = useWeb3React();

  const initState = { 
    seriesData : new Map(),
    seriesAggregates: {}, // TODO convert to Map 
    seriesRates: new Map(),
    activeSeries: null,
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = React.useContext(YieldContext);
  const { userData, feedData, deployedContracts } = yieldState;

  const { previewPoolTx, checkPoolDelegate }  = usePool();
  const { checkControllerDelegate }  = useController();

  const [ callTx ] = useCallTx();
  const {
    collAmount,
    collValue,
    collPrice,
    debtValAdj,
    collRatio,
    collPercent,
    yieldAPR,
    estCollRatio: estimateRatio,
    minSafeColl,
    daiAvailable,
  } = useMath();

  /*  Runs through all the metric calculations  - no async */
  const _runAggregation = () => {
    const numberOfSeries = state.seriesData.size;
    const collateralAmount = collAmount();
    const collateralPrice = collPrice();
    const collateralValue = collValue();

    let debtYDai = BigNumber.from('0');
    state.seriesData.forEach((x:any)=>{
      debtYDai = x.wethDebtYDai.add(debtYDai);
    });
    const debtYDaiValue = null; // Not needed for now - possibly unknown see below
    const totaldebtDai = null; // Unknown here - because each series has different Dai/yDai rates
    const debtValue = debtValAdj(debtYDai); // calculated as yDai at maturity. i.e. 1:1 
    const collateralRatio = collRatio(collateralValue, debtValue);
    const collateralPercent = collPercent(collateralRatio);
    const minSafeCollateral = minSafeColl(debtValue, 1.5, collateralPrice);
    const maxDaiAvailable = daiAvailable(collateralValue, debtValue, 1.5);

    return {
      numberOfSeries,
      // TODO: fix this duplicate 'easy access' data below from yieldState
      ethPosted: yieldState?.userData?.ethPosted,
      ethPosted_: yieldState?.userData?.ethPosted_,
      ethBalance: yieldState?.userData?.ethBalance,
      ethBalance_: yieldState?.userData?.ethBalance_,
      // Calculated values
      debtYDai,
      debtYDai_: parseFloat(ethers.utils.formatEther(debtYDai)),
      debtValue,
      debtValue_ : parseFloat(ethers.utils.formatEther(debtValue)),
      collateralAmount,
      collateralAmount_: parseFloat(ethers.utils.formatEther(collateralAmount)),
      collateralValue,
      collateralValue_: parseFloat(ethers.utils.formatEther(collateralValue)),
      collateralRatio,
      collateralRatio_: parseFloat(collateralRatio.toString()),
      collateralPercent,
      collateralPercent_ : parseFloat(collateralPercent.toString()),
      minSafeCollateral,
      minSafeCollateral_: parseFloat(ethers.utils.formatEther(minSafeCollateral)),
      maxDaiAvailable,
      maxDaiAvailable_: parseFloat(ethers.utils.formatEther(maxDaiAvailable)),
      // useful functions exported
      estimateRatio,
    };
  };

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
        const sellYDai = await previewPoolTx('sellYDai', seriesArr[0].poolAddress, 1);
        const buyYDai = await previewPoolTx('buyYDai', seriesArr[0].poolAddress, 1);
        const sellDai = await previewPoolTx('sellDai', seriesArr[0].poolAddress, 1);
        const buyDai = await previewPoolTx('buyDai', seriesArr[0].poolAddress, 1);
        return {
          maturity: x.maturity,
          sellYDai,
          buyYDai,
          sellDai,
          buyDai,
        };
      })
    );

    return _ratesData.reduce((acc: any, x:any) => {
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
          _seriesData[i].wethDebtYDai = account? await callTx(deployedContracts.Controller, 'Controller', 'debtYDai', [utils.ETH, x.maturity, account]): BigNumber.from('0');
          _seriesData[i].wethDebtDai = account? utils.mulRay( _seriesData[i].wethDebtYDai, feedData.amm.rates[x.maturity]): BigNumber.from('0');
          _seriesData[i].yieldAPR = yieldAPR(_rates.sellYDai, ethers.utils.parseEther('1'), x.maturity);
        } catch (e) {
          console.log(`Could not load account positions data: ${e}`);
        }
      })
    );

    return _seriesData.reduce((acc: Map<string, any>, x:any) => {
      return acc.set(
        x.maturity,
        { ...x,
          yDaiBalance_: parseFloat(ethers.utils.formatEther(x.yDaiBalance.toString())),
          wethDebtYDai_: parseFloat(ethers.utils.formatEther(x.wethDebtYDai.toString())),
          wethDebtDai_: parseFloat(ethers.utils.formatEther(x.wethDebtDai.toString())),
          yieldAPR_: x.yieldAPR.toFixed(2),
        }
      );
    }, state.seriesData);
  };

  // Get the Positions data for a series list
  const getPositions = async (seriesArr:IYieldSeries[], force:boolean) => {
    let filteredSeriesArr;
    if (force !== true) {
      filteredSeriesArr = seriesArr.filter(x => !state.seriesData.has(x.maturity));
    } else {
      filteredSeriesArr = seriesArr;
    }
    if ( !yieldState?.isLoading && filteredSeriesArr.length > 0) {

      dispatch({ type:'isLoading', payload: true });

      /* Get series rates */
      const rates = await _getRates(filteredSeriesArr);
      dispatch( { type:'updateRates', payload: rates });

      /* Build/re-build series map */
      const seriesMap:any = await _getSeriesData(filteredSeriesArr, rates);
      dispatch( { type:'updateSeries', payload: seriesMap });

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

      /* if there is an account associated, run aggregation */
      account && dispatch({ type:'updateAggregates', payload: _runAggregation() });

      dispatch({ type:'isLoading', payload: false });

    } else {
      console.log('Positions exist... force fetch if required');
    }
  };

  React.useEffect( () => {
    !yieldState?.isLoading && dispatch({ type:'updateAggregates', payload: _runAggregation() });
  }, [ userData, feedData ]);

  React.useEffect( () => {
    chainId && !yieldState?.isLoading && ( async () => {
      await getPositions(yieldState.deployedSeries, false);
    })();
  }, [ account, chainId, yieldState ]);

  const actions = {
    refreshPositions: (series:IYieldSeries[]) => getPositions(series, true),
    setActiveSeries: (seriesMaturity:string) => dispatch({ type:'setActiveSeries', payload: state.seriesData.get(seriesMaturity) }),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
