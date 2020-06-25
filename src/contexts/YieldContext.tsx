import React from 'react';
import firebase from 'firebase';

import { ethers } from 'ethers';
// import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';

import { IYieldSeries } from '../types';
import { useCallTx, useBalances } from '../hooks/yieldHooks';

import { NotifyContext } from './NotifyContext';
import { Web3Context } from './Web3Context';

const YieldContext = React.createContext<any>({});

firebase.initializeApp({
  apiKey: 'AIzaSyATOt3mpg8B512V-6Pl_2ZqjY1WjE5q49s',
  projectId: 'yield-ydai'
});

const seriesColors = ['#726a95', '#709fb0', '#a0c1b8', '#f4ebc1', '#3f51b5', '#5677fc', '#03a9f4', '#00bcd4', '#009688', '#259b24', '#8bc34a', '#afb42b', '#ff9800', '#ff5722', '#795548', '#607d8b']; 

// reducer
function reducer(state:any, action:any) {
  switch (action.type) {
    case 'updateDeployedSeries':
      return {
        ...state,
        deployedSeries: action.payload,
      };
    case 'updateDeployedCore':
      return {
        ...state,
        deployedCore: action.payload,
      };
    case 'updateDeployedPeripheral':
      return {
        ...state,
        deployedPeripheral: action.payload,
      };
    case 'updateDeployedExternal':
      return {
        ...state,
        deployedExternal: action.payload,
      };
    case 'updateYieldData':
      return {
        ...state,
        yieldData: action.payload,
      };
    case 'updateExtBalances': 
      return {
        ...state,
        extBalances: action.payload,
      };
    case 'updateMakerData': 
      return {
        ...state,
        makerData: action.payload,
      };
    case 'isLoading':
      return { 
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

const YieldProvider = ({ children }:any) => {

  const initState = {
    isLoading: true,
    deployedSeries : [],
    deployedCore: {},
    deployedPeripheral: {},
    deployedExternal: {},
    yieldData: {},
    makerData: {},
    extBalances:{},
  };
  const [ state, dispatch ] = React.useReducer(reducer, initState);

  const { state: { account, chainId } } = React.useContext(Web3Context);

  // const { chainId } = useWeb3React();

  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const [ callTx ] = useCallTx();
  const { getEthBalance, getTokenBalance }  = useBalances();

  // async get all yield addresses from db 
  const getYieldAddrs = async (networkId:number|string): Promise<any[]> => {
    const _deployedSeries:any[] = [];
    let _deployedCore;
    let _deployedExternal;
    let _deployedPeripheral;
    try {
      _deployedCore = await firebase.firestore().collection(networkId.toString()).doc('deployedCore').get().then( doc => doc.data());
      _deployedExternal = await firebase.firestore().collection(networkId.toString()).doc('deployedExternal').get().then( doc => doc.data());
      _deployedPeripheral = await firebase.firestore().collection(networkId.toString()).doc('deployedPeripheral').get().then( doc => doc.data());

      await firebase.firestore().collection(networkId.toString()).doc('deployedSeries').collection('deployedSeries')
        .get()
        .then( (querySnapshot:any) => {
          querySnapshot.forEach((doc:any) => {
            _deployedSeries.push(doc.data());
          });
        });
    } catch (e) {
      notifyDispatch({ type: 'fatal', payload:{ message: `${e} - try changing networks` } } );
    }
    console.log(_deployedSeries);
    return [ _deployedSeries, _deployedCore, _deployedExternal, _deployedPeripheral ];
  };

  // Async add blockchain data for each series
  const fetchSeriesData = async (seriesAddrs:IYieldSeries[]): Promise<IYieldSeries[]> => {
    const _seriesData:any[] = [];
    await Promise.all(
      seriesAddrs.map( async (x:any, i:number)=> {
        _seriesData.push(x);
        try {
          _seriesData[i].yDaiBalance = await callTx(x.yDai, 'YDai', 'balanceOf', [account]);
        } catch (e) {
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    // Parse and return data
    return _seriesData.map((x:any, i:number) => {
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
    const _yieldData:any = {};
    _yieldData.wethPosted = await callTx(deployedCore.Dealer, 'Dealer', 'posted', [utils.WETH, account]);
    _yieldData.chaiPosted = await callTx(deployedCore.Dealer, 'Dealer', 'posted', [utils.CHAI, account]);
    _yieldData.chaiTotalDebtDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtDai', [utils.CHAI, account]);
    _yieldData.chaiTotalDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtYDai', [utils.CHAI, account]);
    _yieldData.wethTotalDebtDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtDai', [utils.WETH, account]);
    _yieldData.wethTotalDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtYDai', [utils.WETH, account]);
    // parse and return maker data
    return {
      ..._yieldData,
      wethPosted_p: parseFloat(ethers.utils.formatEther(_yieldData.wethPosted.toString())),
      chaiPosted_p: parseFloat(ethers.utils.formatEther(_yieldData.chaiPosted.toString())),
      wethTotalDebtDai_p: parseFloat(ethers.utils.formatEther(_yieldData.wethTotalDebtDai.toString())),
      wethTotalDebtYDai_p: parseFloat(ethers.utils.formatEther(_yieldData.wethTotalDebtYDai.toString())),
      chaiTotalDebtDai_p: parseFloat(ethers.utils.formatEther(_yieldData.chaiTotalDebtDai.toString())),
      chaiTotalDebtYDai_p: parseFloat(ethers.utils.formatEther(_yieldData.chaiTotalDebtYDai.toString())),
    };
  };

  const fetchExtBalances = async (deployedExternal:any): Promise<any> => {
    const _balanceData:any = {};
    _balanceData.ethBalance = await getEthBalance();
    _balanceData.wethBalance = await getTokenBalance(deployedExternal.Weth, 'Weth');
    _balanceData.chaiBalance = await getTokenBalance(deployedExternal.Chai, 'Chai');
    _balanceData.daiBalance = await getTokenBalance(deployedExternal.Dai, 'Dai');
    
    // parse and return maker data
    return {
      ..._balanceData,
      ethBalance_p: parseFloat(ethers.utils.formatEther(_balanceData.ethBalance.toString())),
      wethBalance_p: parseFloat(ethers.utils.formatEther(_balanceData.wethBalance.toString())),
      chaiBalance_p: parseFloat(ethers.utils.formatEther(_balanceData.chaiBalance.toString())),
      daiBalance_p: parseFloat(ethers.utils.formatEther(_balanceData.daiBalance.toString())),
    };
  };

  const fetchMakerData = async (deployedExternal:any): Promise<any> => {
    const _pot = await callTx(deployedExternal.Pot, 'Pot', 'chi', []);
    const _ilks = await callTx(deployedExternal.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);
    const _urns = await callTx(deployedExternal.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);
    // parse and return maker data
    return { 
      ilks: {
        ..._ilks,
        Art_p: utils.rayToHuman(_ilks.Art),
        spot_p: utils.rayToHuman(_ilks.spot),
        rate_p: utils.rayToHuman(_ilks.rate),
        line_p: utils.rayToHuman(_ilks.line),
        dust_p: utils.rayToHuman(_ilks.dust),
      },
      urns: {
        ..._urns,
        art_p: utils.rayToHuman(_urns.art),
        ink_p: utils.rayToHuman(_urns.ink),
      },
      pot: {
        ..._pot,
        chi_p: _pot.chi,
      }
    };
  };

  const getAllData = async (networkId:number|string) => {

    // TODO: Maybe convert to a single dispatch call. See after app dust has settled.
    dispatch({ type:'isLoading', payload: true });

    // #1 Get yield addresses from db
    const [ deployedSeries, deployedCore, deployedExternal, deployedPeripheral ] = await getYieldAddrs(networkId);
    dispatch({ type:'updateDeployedCore', payload: deployedCore });
    dispatch({ type:'updateDeployedExternal', payload: deployedExternal });
    dispatch({ type:'updateDeployedPeripheral', payload: deployedPeripheral });

    // #2 Get extra blockchain data for each series if reqd.
    const extraSeriesData:any = await fetchSeriesData(deployedSeries);
    dispatch({ type:'updateDeployedSeries', payload: extraSeriesData });

    // #3 Get yield core/system data for the user from blockchain
    const yieldData = await fetchYieldData(deployedCore);
    dispatch({ type:'updateYieldData', payload: yieldData });

    // #4 Get Balance data
    const balances = await fetchExtBalances(deployedExternal);
    console.log(balances);
    dispatch({ type:'updateExtBalances', payload: balances });

    // #4 Get MakerDao data
    const makerData = await fetchMakerData(deployedExternal);
    dispatch({ type:'updateMakerData', payload: makerData });

    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && getAllData(chainId))();
  }, [chainId]);

  const actions = {
    updateExtBalances: (x:any) => fetchExtBalances(x).then((res:any)=> dispatch({ type:'updateExtBalances', payload: res })),
    updateYieldBalances: (x:any) => fetchYieldData(x).then((res:any)=> dispatch({ type:'updateYieldData', payload: res }))
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
