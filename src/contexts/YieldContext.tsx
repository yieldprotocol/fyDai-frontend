import React from 'react';
import firebase from 'firebase';

import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';

import { IYieldSeries } from '../types';
import { useCallTx, useBalances } from '../hooks/yieldHooks';
import { useCachedState } from '../hooks/appHooks';

import { NotifyContext } from './NotifyContext';
import { ConnectionContext } from './ConnectionContext';

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
    // cachable
    deployedSeries : [],
    deployedCore: {},
    deployedExternal: {},
    deployedPeripheral: {},
    // transient
    yieldData: {},
    makerData: {},
    // user
    extBalances: {},
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { state: { account, chainId } } = React.useContext(ConnectionContext);
  // const { account, chainId } = useWeb3React();

  const [ cachedCore, setCachedCore ] = useCachedState('deployedCore', null);
  const [ cachedExternal, setCachedExternal ] = useCachedState('deployedExternal', null);
  const [ cachedPeripheral, setCachedPeripheral ] = useCachedState('deployedPeripheral', null);
  const [ cachedSeries, setCachedSeries ] = useCachedState('deployedSeries', null);

  // const { chainId } = useWeb3React();
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const [ callTx ] = useCallTx();
  const { getEthBalance, getTokenBalance }  = useBalances();

  // async get all public yield addresses from localStorage/chain
  const getYieldAddrs = async (networkId:number|string, forceUpdate:boolean): Promise<any[]> => {
    const _deployedSeries:any[] = [];
    let _deployedCore;
    let _deployedExternal;
    let _deployedPeripheral;

    try {
      if (!cachedCore || forceUpdate) {
        // TODO firebase > chain migration
        _deployedCore = await firebase.firestore()
          .collection(networkId.toString()).doc('deployedCore').get()
          .then( doc => doc.data());
        window.localStorage.removeItem(`${networkId}_deployedCore`);
        setCachedCore(_deployedCore);
        console.log('Core contract list updated');
      } else {_deployedCore = cachedCore;}

      if (!cachedExternal || forceUpdate) {
        // TODO firebase > chain migration
        _deployedExternal = await firebase.firestore()
          .collection(networkId.toString()).doc('deployedExternal').get()
          .then( doc => doc.data());
        window.localStorage.removeItem(`${networkId}_deployedExternal`);
        setCachedExternal(_deployedExternal);
        console.log('External contract list updated');
      } else {_deployedExternal = cachedExternal;}

      if (!cachedPeripheral || forceUpdate) {
        // TODO firebase > chain migration
        _deployedPeripheral = await firebase.firestore()
          .collection(networkId.toString()).doc('deployedPeripheral').get()
          .then( doc => doc.data());
        window.localStorage.removeItem(`${networkId}_deployedPeripheral`);
        setCachedPeripheral(_deployedPeripheral);
        console.log('Peripheral contract list updated');
      } else {_deployedPeripheral = cachedPeripheral;}

      if (!cachedSeries || forceUpdate) {
        // if cache empty or forced update > get series from blockchain (or firebase)
        // TODO firebase > chain migration
        await firebase.firestore().collection(networkId.toString()).doc('deployedSeries').collection('deployedSeries')
          .get()
          .then( (querySnapshot:any) => {
            querySnapshot.forEach((doc:any) => {
              _deployedSeries.push(doc.data());
            });
          });
        window.localStorage.removeItem(`${networkId}_deployedSeries`);
        setCachedSeries(_deployedSeries);
        console.log('Series contract list updated');
      } else {_deployedSeries.push(...cachedSeries);}

    } catch (e) {
      console.log(e);
      notifyDispatch({ type: 'fatal', payload:{ message: 'Error getting Yield system addresses - Try changing network.' } } );
    }
    return [ _deployedSeries, _deployedCore, _deployedExternal, _deployedPeripheral ];
  };

  // Async add blockchain data for each series
  const getSeriesData = async (seriesAddrs:IYieldSeries[]): Promise<IYieldSeries[]> => {
    const _seriesData:any[] = [];
    await Promise.all(
      seriesAddrs.map( async (x:any, i:number)=> {
        _seriesData.push(x);
        try {
          // _seriesData[i].yDaiBalance = await callTx(x.yDai, 'YDai', 'balanceOf', [account]);
        } catch (e) {
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );
    // Parse and return data
    return _seriesData.map((x:any, i:number) => {
      return {
        ...x,
        // yDaiBalance_: ethers.utils.formatEther(x.yDaiBalance.toString()),
        maturity_: new Date( (x.maturity) * 1000 ),
        seriesColor: seriesColors[i],
      };
    });
  };

  // async yield data for the user address
  const getYieldData = async (deployedCore:any): Promise<any> => {
    const _yieldData:any = {};
    // _yieldData.ethBalance = await getEthBalance();
    _yieldData.wethPosted = await callTx(deployedCore.Dealer, 'Dealer', 'posted', [utils.WETH, account]);
    // _yieldData.chaiPosted = await callTx(deployedCore.Dealer, 'Dealer', 'posted', [utils.CHAI, account]);
    // _yieldData.chaiTotalDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtYDai', [utils.CHAI, account]);
    _yieldData.wethTotalDebtYDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtYDai', [utils.WETH, account]);
    // _yieldData.chaiTotalDebtDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtDai', [utils.CHAI, account]);
    // _yieldData.wethTotalDebtDai = await callTx(deployedCore.Dealer, 'Dealer', 'totalDebtDai', [utils.WETH, account]);

    console.log(_yieldData.wethPosted, _yieldData.wethTotalDebtYDai);
    // parse and return maker data
    return {
      ..._yieldData,
      // ethBalance_: parseFloat(ethers.utils.formatEther(_yieldData.ethBalance.toString())),
      wethPosted_: parseFloat(ethers.utils.formatEther(_yieldData.wethPosted.toString())),
      // chaiPosted_: parseFloat(ethers.utils.formatEther(_yieldData.chaiPosted.toString())),
      wethTotalDebtYDai_: parseFloat(ethers.utils.formatEther(_yieldData.wethTotalDebtYDai.toString())),
      // chaiTotalDebtYDai_: parseFloat(ethers.utils.formatEther(_yieldData.chaiTotalDebtYDai.toString())),
      // wethTotalDebtDai_p: parseFloat(ethers.utils.formatEther(_yieldData.wethTotalDebtDai.toString())),
      // chaiTotalDebtDai_p: parseFloat(ethers.utils.formatEther(_yieldData.chaiTotalDebtDai.toString())),
    };
  };

  const getExtBalances = async (deployedExternal:any): Promise<any> => {
    const _balances:any = {};
    _balances.ethBalance = await getEthBalance();
    // _balances.daiBalance = await getTokenBalance(deployedExternal.Dai, 'Dai');
    // _balanceData.wethBalance = await getTokenBalance(deployedExternal.Weth, 'Weth');
    // _balanceData.chaiBalance = await getTokenBalance(deployedExternal.Chai, 'Chai');

    // parse and return maker data
    return {
      ..._balances,
      ethBalance_: parseFloat(ethers.utils.formatEther(_balances.ethBalance.toString())),
      //  daiBalance_: parseFloat(ethers.utils.formatEther(_balances.daiBalance.toString())),
      //  wethBalance_: parseFloat(ethers.utils.formatEther(_balanceData.wethBalance.toString())),
      //  chaiBalance_: parseFloat(ethers.utils.formatEther(_balanceData.chaiBalance.toString())),
    };
  };

  const getUserData = async (): Promise<any> => {
    const _balances:any = {};
    _balances.ethBalance = await getEthBalance();
    // parse and return maker data
    return {
      ..._balances,
      ethBalance_: parseFloat(ethers.utils.formatEther(_balances.ethBalance.toString())),
      // wethBalance_: parseFloat(ethers.utils.formatEther(_balanceData.wethBalance.toString())),
      // chaiBalance_: parseFloat(ethers.utils.formatEther(_balanceData.chaiBalance.toString())),
    };
  };

  const getMakerData = async (deployedExternal:any): Promise<any> => {
    const _pot = await callTx(deployedExternal.Pot, 'Pot', 'chi', []);
    const _ilks = await callTx(deployedExternal.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);
    const _urns = await callTx(deployedExternal.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);
    // parse and return maker data
    return { 
      ilks: {
        ..._ilks,
        Art_: utils.rayToHuman(_ilks.Art),
        spot_: utils.rayToHuman(_ilks.spot),
        rate_: utils.rayToHuman(_ilks.rate),
        line_: utils.rayToHuman(_ilks.line),
        dust_: utils.rayToHuman(_ilks.dust),
      },
      urns: {
        ..._urns,
        art_: utils.rayToHuman(_urns.art),
        ink_: utils.rayToHuman(_urns.ink),
      },
      pot: {
        ..._pot,
        chi_: _pot.chi,
      }
    };
  };

  const getAllData = async (networkId:number|string) => {

    // TODO: Maybe convert to a single dispatch call. See after app dust has settled.
    dispatch({ type:'isLoading', payload: true });

    // #1 Get yield addresses from db
    const [ 
      deployedSeries,
      deployedCore,
      deployedExternal,
      deployedPeripheral
    ] = await getYieldAddrs(networkId, false);
    dispatch({ type:'updateDeployedCore', payload: deployedCore });
    dispatch({ type:'updateDeployedExternal', payload: deployedExternal });
    dispatch({ type:'updateDeployedPeripheral', payload: deployedPeripheral });

    // #2 Get extra blockchain data for each series if reqd.
    const extraSeriesData:any = await getSeriesData(deployedSeries);
    dispatch({ type:'updateDeployedSeries', payload: extraSeriesData });

    // #3 Get yield core/system data for the user from blockchain
    const yieldData = await getYieldData(deployedCore);
    dispatch({ type:'updateYieldData', payload: yieldData });

    // #4 Get Balance data
    const balances = await getExtBalances(deployedExternal);
    console.log(balances);
    dispatch({ type:'updateExtBalances', payload: balances });

    // #5 Get MakerDao data
    // const makerData = await fetchMakerData(deployedExternal);
    // dispatch({ type:'updateMakerData', payload: makerData });

    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && getAllData(chainId))();
  }, [chainId]);

  const actions = {
    updateExtBalances: (x:any) => getExtBalances(x).then((res:any)=> dispatch({ type:'updateExtBalances', payload: res })),
    updateYieldBalances: (x:any) => getYieldData(x).then((res:any)=> dispatch({ type:'updateYieldData', payload: res })),
    refreshYieldAddrs: () => getYieldAddrs(chainId, true)
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
