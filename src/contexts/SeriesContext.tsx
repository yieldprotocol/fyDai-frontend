import React from 'react';
import firebase, { firestore } from 'firebase';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

import * as Constants from '../constants';
import { IYieldSeries } from '../types';
import { useCallTx } from '../hooks/txHooks';

const SeriesContext = React.createContext<any>({});

firebase.initializeApp({
  apiKey: 'AIzaSyATOt3mpg8B512V-6Pl_2ZqjY1WjE5q49s',
  projectId: 'yield-ydai'
});


const SeriesProvider = ({ children }:any) => {

  const initState = { isLoading: true, seriesData : [], sysAddrList: {} };
  const [ state, dispatch ] = React.useReducer(seriesReducer, initState);
  const { chainId } = useWeb3React();
  const [ callTx ] = useCallTx();

  // reducer
  function seriesReducer(redState:any, action:any) {
    switch (action.type) {
      case 'updateSeries':
        return {
          ...redState,
          seriesData: action.payload,
        };
      case 'updateSysAddrList':
        return {
          ...redState,
          sysAddrList: action.payload,
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
    let sysAddrList = {};
    try {
      await firebase.firestore().collection(networkId.toString())
        .get()
        .then( (querySnapshot:any) => {
          querySnapshot.forEach((doc:any) => {
            if ( doc.id === 'sysAddrList') {
              sysAddrList = doc.data();
            } else {
              seriesAddrs.push(doc.data());
            }
          });
        });
    } catch (e) {
      console.log(`Could not load Yield Addresses: ${e}`);
    }
    return [ seriesAddrs, sysAddrList];
  };

  // async add blockchain data
  const addChainData = async (seriesAddrs:IYieldSeries[], sysAddrList:any): Promise<IYieldSeries[]> => {
    const chainData:any[] = [];
    console.log(sysAddrList);
    await Promise.all(seriesAddrs.map( async (x:any, i:number)=> {
      chainData.push(x);
      try {
        chainData[i].rate = await callTx(x.YDai, 'YDai', 'rate', []);
        chainData[i].currentValue = (await callTx( sysAddrList.vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('weth')] )).spot;
      } catch (e) { console.log(`Could not load series blockchain data: ${e}`); }
    }));
    return chainData; 
  };

  // post fetching data processing
  const processSeriesData = (chainData:IYieldSeries[]): IYieldSeries[] => {
    const processedData:any[] = [];
    chainData.forEach(async (x:any, i:any) =>{
      processedData.push(x);
      processedData[i].rate = x.rate.div(Constants.BN_RAY).toNumber();
      // processedData[i].rate = x.rate.toString()
      processedData[i].maturity = new Date( (x.maturity as number) * 1000 );
    });
    return processedData;
  };

  const getAllData = async (networkId:number|string) => {

    dispatch({ type:'isLoading', payload: true });
    // fetch yield addresses from db
    const [ addrData, sysAddrList] = await getYieldAddrs(networkId);
    // fetch chain data
    const chainData:any = await addChainData(addrData, sysAddrList);
    // process chain data (number formats, dates etc.)
    const processedData:any = processSeriesData(chainData);
    dispatch({ type:'updateSysAddrList', payload: sysAddrList });
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
