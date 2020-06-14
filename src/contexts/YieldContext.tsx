import React from 'react';
import firebase from 'firebase';

import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';

import { IYieldSeries } from '../types';

import { useCallTx } from '../hooks/yieldHooks';

import { NotifyContext } from './NotifyContext';

const YieldContext = React.createContext<any>({});

firebase.initializeApp({
  apiKey: 'AIzaSyATOt3mpg8B512V-6Pl_2ZqjY1WjE5q49s',
  projectId: 'yield-ydai'
});

const seriesColors = ['#726a95', '#709fb0', '#a0c1b8', '#f4ebc1', '#3f51b5', '#5677fc', '#03a9f4', '#00bcd4', '#009688', '#259b24', '#8bc34a', '#afb42b', '#ff9800', '#ff5722', '#795548', '#607d8b']; 

// reducer
function reducer(redState:any, action:any) {
  switch (action.type) {
    case 'updateDeployedSeries':
      return {
        ...redState,
        deployedSeries: action.payload,
      };
    case 'updateDeployedCore':
      return {
        ...redState,
        deployedCore: action.payload,
      };
    case 'updateMakerData': 
      return {
        ...redState,
        makerData: action.payload,
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

const YieldProvider = ({ children }:any) => {

  const initState = { isLoading: true, deployedSeries : [], deployedCore: {}, makerData: {} };
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { chainId, account } = useWeb3React();
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

  // async add blockchain data (if reqd. - nothing at this point)
  const fetchChainData = async (seriesAddrs:IYieldSeries[], deployedCore:any): Promise<IYieldSeries[]> => {
    const chainData:any[] = [];
    await Promise.all(
      seriesAddrs.map( async (x:any, i:number)=> {
        chainData.push(x);
        try {
          // chainData[i].rate = await callTx(x.YDai, 'YDai', 'rate', []);
          chainData[i].yDaiBalance = await callTx(x.YDai, 'YDai', 'balanceOf', [account]);
        } catch (e) { 
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    return chainData;

  };

  const fetchMakerData = async (deployedCore:any): Promise<any> => {
    const pot = await callTx(deployedCore.Pot, 'Pot', 'chi', []);
    const ilks = await callTx(deployedCore.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);
    const urns = await callTx(deployedCore.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);
    return { ilks, urns, pot };
  };

  // post fetching data processing
  const parseChainData = (chainData:IYieldSeries[]): IYieldSeries[] => {
    return chainData.map((x:any, i:number) => {
      return {
        ...x,
        yDaiBalance_p: ethers.utils.formatEther(x.yDaiBalance.toString()),
        maturity_p: new Date( (x.maturity) * 1000 ),
        seriesColor: seriesColors[i],
      };
    });
  };

  // post fetching data processing
  const parseMakerData = (makerData:any): any => {
    return { 
      ilks: {
        ...makerData.ilks,
        Art_p: utils.rayToHuman(makerData.ilks.Art),
        spot_p: utils.rayToHuman(makerData.ilks.spot),
        rate_p: utils.rayToHuman(makerData.ilks.rate),
        line_p: utils.rayToHuman(makerData.ilks.line),
        dust_p: utils.rayToHuman(makerData.ilks.dust),
      },
      urns: {
        ...makerData.urns,
        art_p: utils.rayToHuman(makerData.urns.art),
        ink_p: utils.rayToHuman(makerData.urns.ink),
      },
      pot: {
        chi_p: makerData.pot.chi,
      }
    };
  };

  const getAllData = async (networkId:number|string) => {
    dispatch({ type:'isLoading', payload: true });
    // Get yield addresses from db
    const [ addrData, deployedCore] = await getYieldAddrs(networkId);
    // get Vat data from blockchain: 
    const makerData = await fetchMakerData(deployedCore);
    // Get blockchain based data for each series
    const chainData:any = await fetchChainData(addrData, deployedCore);

    // TODO: Maybe convert to a single dispatch call. See after app dust has settled.
    dispatch({ type:'updateMakerData', payload: parseMakerData(makerData) });
    dispatch({ type:'updateDeployedCore', payload: deployedCore });
    dispatch({ type:'updateDeployedSeries', payload: parseChainData(chainData) });
    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && getAllData(chainId))();
  }, [chainId]);

  return (
    <YieldContext.Provider value={{ state, dispatch }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
