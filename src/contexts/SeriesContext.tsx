import React from 'react';
import firebase, { firestore } from 'firebase';

import { useWeb3React } from '@web3-react/core';

import * as constants from '../constants';
import { IYieldSeries } from '../types';

import { useCallTx } from '../hooks/yieldHooks';

import { NotifyContext } from './NotifyContext';

const SeriesContext = React.createContext<any>({});

firebase.initializeApp({
  apiKey: 'AIzaSyATOt3mpg8B512V-6Pl_2ZqjY1WjE5q49s',
  projectId: 'yield-ydai'
});

// reducer
function reducer(redState:any, action:any) {
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

const SeriesProvider = ({ children }:any) => {

  const initState = { isLoading: true, seriesData : [], deployedCore: {} };
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { chainId } = useWeb3React();
  const { WETH, CHAI, BN_RAY } = constants; 
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const [ callTx ] = useCallTx();

  // async get all yield addresses from db in a single call
  const getYieldAddrs = async (networkId:number|string): Promise<any[]> => {
    const seriesAddrs:any[] = [];
    let deployedCore = {};
    try {
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
  const fetchChainData = async (seriesAddrs:IYieldSeries[], deployedCore:any): Promise<IYieldSeries[]> => {
    const chainData:any[] = [];
    await Promise.all(
      seriesAddrs.map( async (x:any, i:number)=> {
        chainData.push(x);
        try {
          chainData[i].rate = await callTx(x.YDai, 'YDai', 'rate', []);
        // chainData[i].currentValue = (await callTx( deployedCore.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('weth')] )).spot;
        } catch (e) { 
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    return chainData;
  };

  // post fetching data processing
  const parseChainData = (chainData:IYieldSeries[]): IYieldSeries[] => {
    return chainData.map((x:any, i:number) => {
      return { 
        ...x,
        rate: x.rate?.div(BN_RAY).toNumber(),
        date: new Date( (x?.maturity as number) * 1000 ),
      };
    });
  };

  const getAllData = async (networkId:number|string) => {
    dispatch({ type:'isLoading', payload: true });
    // Get yield addresses from db
    const [ addrData, deployedCore] = await getYieldAddrs(networkId);
    // Get blockchain based data
    const chainData:any = await fetchChainData(addrData, deployedCore);
    // Process chain data (number formats, dates etc.)
    const parsedData:any = parseChainData(chainData);
    dispatch({ type:'updatedeployedCore', payload: deployedCore });
    dispatch({ type:'updateSeries', payload: parsedData });
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
