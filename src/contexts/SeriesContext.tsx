import React from 'react';
import { ethers, BigNumber } from 'ethers';

import * as utils from '../utils';
import { useCallTx, useMath } from '../hooks';

import { YieldContext } from './YieldContext';
import { ConnectionContext } from './ConnectionContext';

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
    yieldAPR,
    estCollRatio: estimateRatio,
    minSafeColl,
    daiAvailable,
  } = useMath();

  /*  Runs through all the metric calculations  - no async */
  const _runAggregation = () => {
    const numberOfSeries = state.seriesData.size;
    const collateralAmount = collAmount();
    const collateralValue = collValue();

    let debtYDai = BigNumber.from('0');
    state.seriesData.forEach((x:any)=>{
      // console.log(x);
      debtYDai = x.wethDebtYDai.add(debtYDai);
    });
    const debtYDaiValue = null; // Not needed for now - possibly unknown see below
    const totaldebtDai = null; // Unknown here - because each series has different Dai/yDai rates
    const debtValue = debtVal(debtYDai); // calculated as yDai at maturity. i.e. 1:1
    const collateralRatio = collRatio(collateralValue, debtValue);
    const minSafeCollateral = minSafeColl(debtValue, BigNumber.from('150'));
    const maxDaiAvailable = daiAvailable(collateralValue, debtValue, BigNumber.from('150'));

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
        const sellYDai = await callTx(seriesArr[0].marketAddress, 'Market', 'sellYDaiPreview', [ethers.utils.parseEther('1')]);
        const buyYDai = await callTx(seriesArr[0].marketAddress, 'Market', 'buyYDaiPreview', [ethers.utils.parseEther('1')]);
        const sellDai = await callTx(seriesArr[0].marketAddress, 'Market', 'sellChaiPreview', [ethers.utils.parseEther('1')]);
        const buyDai = await callTx(seriesArr[0].marketAddress, 'Market', 'buyChaiPreview', [ethers.utils.parseEther('1')]);
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
          _seriesData[i].yDaiBalance = account? await callTx(x.yDaiAddress, 'YDai', 'balanceOf', [account]): BigNumber.from('0') ;
          _seriesData[i].isMature = await callTx(x.yDaiAddress, 'YDai', 'isMature', []);

          _seriesData[i].wethDebtYDai = account? await callTx(deployedContracts.Controller, 'Controller', 'debtYDai', [utils.ETH, x.maturity, account]): BigNumber.from('0');
          _seriesData[i].wethDebtDai = account? utils.mulRay( _seriesData[i].wethDebtYDai, feedData.amm.rates[x.maturity]): BigNumber.from('0');

          _seriesData[i].yieldAPR = yieldAPR(_rates.sellYDai, x.maturity);
        } catch (e) {
          console.log(`Could not load account positions data: ${e}`);
        }
      })
    );

    return _seriesData.reduce((acc: Map<string, any>, x:any) => {
      return acc.set(
        x.maturity,
        { ...x,
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
      
      console.log(seriesArr);

      dispatch({ type:'isLoading', payload: true });

      /* get series rates */
      const rates = await _getRates(filteredSeriesArr);
      dispatch( { type:'updateRates', payload: rates });

      /* build series map */
      const seriesMap:any = await _getSeriesData(filteredSeriesArr, rates);
      dispatch( { type:'updateSeries', payload: seriesMap });

      if (seriesArr.length===1 ){
        /* if there was only one series updated set that one as the active series */
        dispatch({ type:'setActiveSeries', payload: seriesMap.get(seriesArr[0].maturity) });
      } else {
        /* if no active series, set it to the first entry of the map. */
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
    ( async () => {
      chainId && !yieldState?.isLoading && await getPositions(yieldState.deployedSeries, false);
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
