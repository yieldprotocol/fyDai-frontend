import React from 'react';
import firebase, { firestore } from 'firebase';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

import * as Constants from '../constants';
import { IYieldSeries } from '../types';

import { useCallTx } from '../hooks/yieldHooks';

import { NotifyContext } from './NotifyContext';

const SeriesContext = React.createContext<any>({});

firebase.initializeApp({
  apiKey: 'AIzaSyATOt3mpg8B512V-6Pl_2ZqjY1WjE5q49s',
  projectId: 'yield-ydai'
});


const SeriesProvider = ({ children }:any) => {

  const initState = { isLoading: true, seriesData : [], deployedCore: {} };
  const [ state, dispatch ] = React.useReducer(seriesReducer, initState);
  const { chainId } = useWeb3React();

  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);

  const [ callTx ] = useCallTx();

  // reducer
  function seriesReducer(redState:any, action:any) {
    switch (action.type) {
      case 'updateSeries':
        return {
          ...redState,
          seriesData: action.payload,
        };
      case 'updatedeployedCore':
        return {
          ...redState,
          deployedCore: action.payload,
        };
      case 'updateRates':
        return {
          ...redState,
        };
      case 'isLoading':
        return { 
          ...redState,
          isLoading: action.payload,
        };
      default:
        return redState;
    }
  }

  // async get all yield addresses from db in a single call
  const getYieldAddrs = async (networkId:number|string): Promise<any[]> => {
    const seriesAddrs:any[] = [];
    let deployedCore = {};
    try {
      // if ( !firebase.firestore().collection(networkId.toString()).doc('deployedCore').get() ) {
      //   throw new Error('Core not deployed');
      // }
      await firebase.firestore().collection(networkId.toString())
        .get()
        .then( (querySnapshot:any) => {
          querySnapshot.forEach((doc:any) => {
            if ( doc.id === 'deployedCore') {
              deployedCore = doc.data();
            } else {
              seriesAddrs.push(doc.data());
            }
          });
        });
    } catch (e) {
      notifyDispatch({ type: 'fatal', payload:{ message: `${e} - try changing networks` } } );
    }
    return [ seriesAddrs, deployedCore];
  };

  // async add blockchain data
  const getChainData = async (seriesAddrs:IYieldSeries[], deployedCore:any): Promise<IYieldSeries[]> => {
    const chainData:any[] = [];
    console.log(deployedCore);
    await Promise.all(seriesAddrs.map( async (x:any, i:number)=> {
      chainData.push(x);
      try {
        chainData[i].rate = await callTx(x.YDai, 'YDai', 'rate', []);
        // chainData[i].currentValue = (await callTx( deployedCore.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('weth')] )).spot;
      } catch (e) { 
        console.log(`Could not load series blockchain data: ${e}`);
      }
    }));
    return chainData;
  };

  // post fetching data processing
  const processSeriesData = (chainData:IYieldSeries[]): IYieldSeries[] => {
    const processedData:any[] = [];
    chainData.forEach(async (x:any, i:any) =>{
      processedData.push(x);
      processedData[i].rate = x.rate?.div(Constants.BN_RAY).toNumber();
      processedData[i].maturity = new Date( (x?.maturity as number) * 1000 );
    });
    return processedData;
  };

  const getAllData = async (networkId:number|string) => {
    dispatch({ type:'isLoading', payload: true });
    // fetch yield addresses from db
    const [ addrData, deployedCore] = await getYieldAddrs(networkId);
    // fetch chain data
    const chainData:any = await getChainData(addrData, deployedCore);
    // process chain data (number formats, dates etc.)
    const processedData:any = processSeriesData(chainData);
    dispatch({ type:'updatedeployedCore', payload: deployedCore });
    dispatch({ type:'updateSeries', payload: processedData });
    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && getAllData(chainId))();
  }, [chainId]);

  return (
    <SeriesContext.Provider value={{ state, dispatch }}>
      {children}
    </SeriesContext.Provider>
  );
};

export { SeriesContext, SeriesProvider };
