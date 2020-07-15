import React from 'react';
import { ethers, BigNumber } from 'ethers';

import { AnyARecord } from 'dns';
import * as utils from '../utils';
import { useCallTx, useMath } from '../hooks';

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

  const { state: { chainId, account } } = React.useContext(ConnectionContext);

  const initState = { 
    seriesData : new Map(),
    seriesAggregates: {}, // TODO convert to Map
    seriesRates: new Map(),
    activeSeries: null,
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: yieldState } = React.useContext(YieldContext);
  const { userData, feedData, deployedContracts } = yieldState;

  const [ callTx ] = useCallTx();
  const {
    collAmount,
    collValue,
    debtVal,
    collRatio,
    yieldRate,
    estimateCollRatio: estimateRatio,
    minSafeCollatAmount,
    maxDai 
  } = useMath();

  /*  Runs through all the metric calculations  - no async */
  const _runAggregation = () => {
    const numberOfSeries = state.seriesData.size;
    const collateralAmount = collAmount();
    const collateralValue = collValue();
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
      ethPosted: yieldState?.userData?.ethPosted,
      ethPosted_: yieldState?.userData?.ethPosted_,
      ethBalance: yieldState?.userData?.ethBalance,
      ethBalance_: yieldState?.userData?.ethBalance_,
      // calculated values
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
      minSafeCollateral,
      minSafeCollateral_: parseFloat(ethers.utils.formatEther(minSafeCollateral)),
      daiAvailable,
      daiAvailable_: parseFloat(ethers.utils.formatEther(daiAvailable)),
      // useful functions exported
      estimateRatio,
    };
  };

  /* Get the yield market rates for a particular set of series */
  const _getRates = async (_seriesArr:any[]) => {
    const _rates = state.seriesRates;
    const _ratesData = await Promise.all(
      _seriesArr.map(async (x:any, i:number) => {
        const sellYDai = await callTx(_seriesArr[0].market, 'Market', 'sellYDaiPreview', [ethers.utils.parseEther('1')]);
        const buyYDai = await callTx(_seriesArr[0].market, 'Market', 'buyYDaiPreview', [ethers.utils.parseEther('1')]);
        const sellDai = await callTx(_seriesArr[0].market, 'Market', 'sellChaiPreview', [ethers.utils.parseEther('1')]);
        const buyDai = await callTx(_seriesArr[0].market, 'Market', 'buyChaiPreview', [ethers.utils.parseEther('1')]);
        return {
          name: x.name,
          sellYDai,
          buyYDai,
          sellDai,
          buyDai,
        };
      })
    );

    _ratesData.forEach((x:any)=>{
      _rates.set(
        x.name,
        { ...x,
          // wethDebtYDai_: parseFloat(ethers.utils.formatEther(x.wethDebtYDai.toString())),
          // wethDebtDai_: parseFloat(ethers.utils.formatEther(x.wethDebtDai.toString())),
          // yieldRate_: parseFloat(ethers.utils.formatEther(x.yieldRate.toString())),
          // yieldPercent_: parseFloat(ethers.utils.formatEther(x.yieldRate.toString()))*100,
        }
      );
    });
    console.log(_rates);
    return _rates;
  };

  /* Get the data for a particular series, or set of series */
  const _getSeriesData = async (_seriesArr:any[], _rates:Map<string, any>) => {
    const _seriesData:any[] = [];
    const _positions = state.seriesData;

    await Promise.all(
      _seriesArr.map( async (x:any, i:number) => {

        const r = _rates.get(x.name);
        console.log(r.sellYDai);
        _seriesData.push(x);
        try {
          _seriesData[i].yDaiBalance = account? await callTx(x.yDai, 'YDai', 'balanceOf', [account]): BigNumber.from('0') ;
          _seriesData[i].isMature = await callTx(x.yDai, 'YDai', 'isMature', []);
          _seriesData[i].wethDebtYDai = account? await callTx(deployedContracts.Controller, 'Controller', 'debtYDai', [utils.ETH, x.maturity, account]): BigNumber.from('0');
          _seriesData[i].wethDebtDai = account? utils.mulRay( _seriesData[i].wethDebtYDai, feedData.amm.rates[x.maturity]): BigNumber.from('0');
          _seriesData[i].yieldRate = yieldRate(feedData.amm.rates[x.maturity]);
        } catch (e) {
          console.log(`Could not load account positions data: ${e}`);
        }
      })
    );

    _seriesData.forEach((x:any)=>{
      _positions.set(
        x.name,
        { ...x,
          wethDebtYDai_: parseFloat(ethers.utils.formatEther(x.wethDebtYDai.toString())),
          wethDebtDai_: parseFloat(ethers.utils.formatEther(x.wethDebtDai.toString())),
          yieldRate_: parseFloat(ethers.utils.formatEther(x.yieldRate.toString())),
          yieldPercent_: parseFloat(ethers.utils.formatEther(x.yieldRate.toString()))*100,
        }
      );
    });
    console.log(_positions);
    return _positions;
  };

  // TODO  add typings for a series

  // Get the Positions data for a series list
  const getPositions = async (seriesArr:any[], force:boolean) => {
    let filteredSeriesArr;

    if (force !== true) {
      filteredSeriesArr = seriesArr.filter(x => !state.seriesData.has(x.name));
    } else {
      filteredSeriesArr = seriesArr;
    }

    if( !yieldState?.isLoading && filteredSeriesArr.length > 0) {
      dispatch({ type:'isLoading', payload: true });

      const rates = await _getRates(filteredSeriesArr);
      dispatch( { type:'updateSeries', payload: rates });

      const seriesMap:any = await _getSeriesData(filteredSeriesArr, rates);
      dispatch( { type:'updateSeries', payload: seriesMap });

      if (!state.activeSeries) {
        /* if no active series, set it to the first entry of the map. */
        dispatch({ type:'setActiveSeries', payload: seriesMap.entries().next().value[1] });
      } else if (seriesArr.length===1 ){
        /* or, if there was only one series updated set that one as the active series */
        dispatch({ type:'setActiveSeries', payload: seriesMap.get(seriesArr[0].name) });
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
    ( async () => {
      chainId && !yieldState?.isLoading && await getPositions(yieldState.deployedSeries, false);
    })();
  }, [ account, chainId, yieldState ]);

  const actions = {
    // getPositions: (x:any[]) => getPositions(x, false),
    refreshPositions: (x:any[]) => getPositions(x, true),
    setActiveSeries: (x:string) => dispatch({ type:'setActiveSeries', payload: x }),
  };

  return (
    <SeriesContext.Provider value={{ state, actions }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
