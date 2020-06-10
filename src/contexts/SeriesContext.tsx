import React from 'react';
import firebase, { firestore } from 'firebase';

import { ethers } from 'ethers';
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
    case 'updateSeriesData':
      return {
        ...redState,
        seriesData: action.payload,
      };
    case 'updateDeployedCore':
      return {
        ...redState,
        deployedCore: action.payload,
      };
    case 'updateVatData': 
      return {
        ...redState,
        vatData: action.payload,
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

  const initState = { isLoading: true, seriesData : [], deployedCore: {}, vatData: {}  };
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { chainId, account } = useWeb3React();
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
        } catch (e) { 
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    return chainData;
  };

  const fetchVatData = async (deployedCore:any): Promise<any> => {
    const ilks = await callTx(deployedCore.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);
    const urns = await callTx(deployedCore.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);
    return { ilks, urns };
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

  // post fetching data processing
  const parseVatData = (vatData:any): any => {
    console.log(vatData);
    return { 
      ilks: { 
        Art: vatData.ilks.Art.toString(),
        spot: vatData.ilks.spot.toString(),
        rate: vatData.ilks.rate.toString(),
        line: vatData.ilks.line.toString(),
        dust: vatData.ilks.dust.toString(),
      },
      urns: {
        art: vatData.urns.art.toString(),
        ink: vatData.urns.ink.toString(),
      }
    };
  };

  const getAllData = async (networkId:number|string) => {
    dispatch({ type:'isLoading', payload: true });
    // Get yield addresses from db
    const [ addrData, deployedCore] = await getYieldAddrs(networkId);
    
    // get Vat data from blockchain: 
    const vatData = fetchVatData(deployedCore);

    // Get blockchain based data for each series
    const chainData:any = fetchChainData(addrData, deployedCore);
    
    // Process chain data (number formats, dates etc.)
    // const parsedData:any = parseChainData(chainData);

    dispatch({ type:'updateVatData', payload: parseVatData(await vatData) });
    dispatch({ type:'updateDeployedCore', payload: deployedCore });
    dispatch({ type:'updateSeriesData', payload: parseChainData(await chainData) });
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
