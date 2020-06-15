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
    case 'updateYieldData':
      return {
        ...redState,
        yieldData: action.payload,
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

  const initState = { isLoading: true, deployedSeries : [], deployedCore: {}, yieldData: {}, makerData: {} };
  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { chainId, account } = useWeb3React();
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const [ callTx ] = useCallTx();

  // async get all yield addresses from db in single call
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

  // Async add blockchain data for each series
  const fetchSeriesData = async (seriesAddrs:IYieldSeries[]): Promise<IYieldSeries[]> => {
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
    // Parse and return data
    return chainData.map((x:any, i:number) => {
      return {
        ...x,
        yDaiBalance_p: ethers.utils.formatEther(x.yDaiBalance.toString()),
        maturity_p: new Date( (x.maturity) * 1000 ),
        seriesColor: seriesColors[i],
      };
    });
  };

  // async yield data for the user address
  const fetchYieldData = async (deployedCore:any): Promise<any> => {
    const yieldData:any = {};
    yieldData.wethPosted = await callTx(deployedCore.WethDealer, 'Dealer', 'posted', [account]);
    yieldData.chaiPosted = await callTx(deployedCore.ChaiDealer, 'Dealer', 'posted', [account]);
    yieldData.chaiTotalDebtDai = await callTx(deployedCore.ChaiDealer, 'Dealer', 'totalDebtDai', [account]);
    yieldData.chaiTotalDebtYDai = await callTx(deployedCore.ChaiDealer, 'Dealer', 'totalDebtYDai', [account]);
    yieldData.wethTotalDebtDai = await callTx(deployedCore.WethDealer, 'Dealer', 'totalDebtDai', [account]);
    yieldData.wethTotalDebtYDai = await callTx(deployedCore.WethDealer, 'Dealer', 'totalDebtYDai', [account]);
    // parse and return maker data
    return {
      ...yieldData,
      wethPosted_p: ethers.utils.formatEther(yieldData.wethPosted.toString()),
      chaiPosted_p: ethers.utils.formatEther(yieldData.chaiPosted.toString()),
      wethTotalDebtDai_p: ethers.utils.formatEther(yieldData.wethTotalDebtDai.toString()),
      wethTotalDebtYDai_p: ethers.utils.formatEther(yieldData.wethTotalDebtYDai.toString()),
      chaiTotalDebtDai_p: ethers.utils.formatEther(yieldData.chaiTotalDebtDai.toString()),
      chaiTotalDebtYDai_p: ethers.utils.formatEther(yieldData.chaiTotalDebtYDai.toString()),
    };
  };

  const fetchMakerData = async (deployedCore:any): Promise<any> => {
    const pot = await callTx(deployedCore.Pot, 'Pot', 'chi', []);
    const ilks = await callTx(deployedCore.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);
    const urns = await callTx(deployedCore.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);
    // parse and return maker data
    return { 
      ilks: {
        ...ilks,
        Art_p: utils.rayToHuman(ilks.Art),
        spot_p: utils.rayToHuman(ilks.spot),
        rate_p: utils.rayToHuman(ilks.rate),
        line_p: utils.rayToHuman(ilks.line),
        dust_p: utils.rayToHuman(ilks.dust),
      },
      urns: {
        ...urns,
        art_p: utils.rayToHuman(urns.art),
        ink_p: utils.rayToHuman(urns.ink),
      },
      pot: {
        ...pot,
        chi_p: pot.chi,
      }
    };
  };

  const getAllData = async (networkId:number|string) => {

    // TODO: Maybe convert to a single dispatch call. See after app dust has settled.
    dispatch({ type:'isLoading', payload: true });
    
    // #1 Get yield addresses from db
    const [ addrData, deployedCore] = await getYieldAddrs(networkId);
    dispatch({ type:'updateDeployedCore', payload: deployedCore });

    // #2 Get blockchain data for each series
    const seriesData:any = await fetchSeriesData(addrData);
    dispatch({ type:'updateDeployedSeries', payload: seriesData });

    // #3 Get yield data (user) from blockchain
    const yieldData = await fetchYieldData(deployedCore);
    dispatch({ type:'updateYieldData', payload: yieldData });

    // #4 get MakerDao data
    const makerData = await fetchMakerData(deployedCore);
    dispatch({ type:'updateMakerData', payload: makerData });

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
