import React from 'react';
import * as firebase from 'firebase/app';
import 'firebase/firestore';

import { ethers, BigNumber } from 'ethers';
// import { useWeb3React } from '@web3-react/core';

import * as utils from '../utils';
import { IYieldSeries, IUser } from '../types';
import { NotifyContext } from './NotifyContext';
import { ConnectionContext } from './ConnectionContext';

import { useCallTx, useCachedState, useBalances, useEvents } from '../hooks';

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
    case 'updateDeployedContracts':
      return {
        ...state,
        deployedContracts: action.payload,
      };
    case 'updateYieldData':
      return {
        ...state,
        yieldData: action.payload,
      };
    case 'updateUserData':
      return {
        ...state,
        userData: action.payload,
      };
    case 'updateTxHistory':
      return {
        ...state,
        txHistory: action.payload,
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
    migrationsAddr: '0xAC172aca69D11D28DFaadbdEa57B01f697b34158',
    deployedSeries : [],
    deployedContracts: {},

    // transient
    yieldData: {},
    makerData: {},

    // user and tx
    userData: {},
    txHistory:{},
  };

  const [ state, dispatch ] = React.useReducer(reducer, initState);
  const { dispatch: notifyDispatch } = React.useContext(NotifyContext);
  const { state: { account, chainId, provider } } = React.useContext(ConnectionContext);
  // const { account, chainId } = useWeb3React();

  const [ cachedCore, setCachedCore ] = useCachedState('deployedContracts', null);
  const [ cachedExternal, setCachedExternal ] = useCachedState('deployedContracts', null);
  const [ cachedPeripheral, setCachedPeripheral ] = useCachedState('deployedContracts', null);
  const [ cachedContracts, setCachedContracts ] = useCachedState('deployedContracts', null);
  const [ cachedSeries, setCachedSeries ] = useCachedState('deployedSeries', null);

  // TODO: maybe move this to a separate AppContext?
  const [ userPreferences, setUserPreferences ] = useCachedState('userPreferences', null);
  const [ txHistory, setTxHistory] = useCachedState('txHistory', null);

  const [ callTx ] = useCallTx();
  const { getEventHistory, addEventListener } = useEvents(); 
  const { getEthBalance, getTokenBalance }  = useBalances();

  // async get all public yield addresses from localStorage/chain
  const _getYieldAddrs = async (networkId:number|string, forceUpdate:boolean): Promise<any[]> => {
    const _deployedSeries:any[] = [];
    let _deployedContracts:any;

    // TODO: combine in to a single group? possibly
    const contractGroups = { 
      coreList: ['Dealer', 'Treasury'],
      externalList: ['Chai', 'Dai', 'WethJoin', 'Vat', 'Weth', 'Jug', 'Pot', 'GasToken', 'End', 'DaiJoin' ],
      peripheralList: ['EthProxy', 'Liquidations', 'Unwind'],
      contractList: ['Dealer', 'Treasury', 'Chai', 'Dai', 'WethJoin', 'Vat', 'Weth', 'EthProxy', 'Liquidations']
    };

    try {
      // if (!cachedCore || forceUpdate) {
      //   /* // Depreciated - Firebase connection example for posterity >>
      //   _deployedContracts_firebase = await firebase.firestore()
      //   .collection(networkId.toString()).doc('deployedContracts').get()
      //   .then( doc => doc.data()); */
      //   const coreAddrs = await Promise.all(
      //     contractGroups.coreList.map(async (x:string)=>{
      //       return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
      //     })
      //   );
      //   _deployedContracts = coreAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
      //   window.localStorage.removeItem('deployedContracts');
      //   setCachedCore(_deployedContracts);
      //   console.log('Core contract addresses updated:', _deployedContracts);
      // } else {_deployedContracts = cachedCore;}

      // if (!cachedExternal || forceUpdate) {
      //   const extAddrs = await Promise.all(
      //     contractGroups.externalList.map(async (x:string)=>{
      //       return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
      //     })
      //   );
      //   _deployedContracts = extAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
      //   window.localStorage.removeItem('deployedContracts');
      //   setCachedExternal(_deployedContracts);
      //   console.log('External contract addresses update:', _deployedContracts);
      // } else {_deployedContracts = cachedExternal;}

      // if (!cachedPeripheral || forceUpdate) {
      //   const peripheralAddrs = await Promise.all(
      //     contractGroups.peripheralList.map(async (x:string)=>{
      //       return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
      //     })
      //   );
      //   _deployedContracts = peripheralAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
      //   window.localStorage.removeItem('deployedContracts');
      //   setCachedPeripheral(_deployedContracts);
      //   console.log('Peripheral contract addresses updated:', _deployedContracts);
      // } else {_deployedContracts = cachedPeripheral;}


      if (!cachedContracts || forceUpdate) {
        const contractAddrs = await Promise.all(
          contractGroups.contractList.map(async (x:string)=>{
            return { [ x ] : await callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(x)]) };
          })
        );
        _deployedContracts = contractAddrs.reduce((prevObj, item) => ({ ...prevObj, ...item }), {});
        window.localStorage.removeItem('deployedContracts');
        setCachedContracts(_deployedContracts);
        console.log('Contract addresses updated:', _deployedContracts);
      } else {_deployedContracts = cachedContracts;}


      if (!cachedSeries || forceUpdate) {
        /* // Depreciated - Firebase connection example for posterity >>
        await firebase.firestore().collection(networkId.toString()).doc('deployedSeries').collection('deployedSeries')
          .get()
          .then( (querySnapshot:any) => {
            querySnapshot.forEach((doc:any) => {
              _deployedSeries.push(doc.data());
            });
          }); */
        const _seriesList = await Promise.all(
          [0, 1, 2, 3].map(async (x:number)=>{
            return callTx(state.migrationsAddr, 'Migrations', 'contracts', [ethers.utils.formatBytes32String(`yDai${x}`)]);
          })
        );
        await Promise.all(
          _seriesList.map(async (x:string)=>{
            return { 
              yDai: x,
              name: await callTx(x, 'YDai', 'name', []),
              maturity: (await callTx(x, 'YDai', 'maturity', [])).toNumber(),
              symbol: await callTx(x, 'YDai', 'symbol', []),
            };
          })
        ).then((res:any) => _deployedSeries.push(...res));

        window.localStorage.removeItem('deployedSeries');
        setCachedSeries(_deployedSeries);
        console.log('Series contract addrs updated');
      } else {_deployedSeries.push(...cachedSeries);}

    } catch (e) {
      console.log(e);
      notifyDispatch({ type: 'fatal', payload:{ message: 'Error Getting Yield data (addresses etc.) - Try changing network.' } } );
    }
    return [ _deployedSeries, _deployedContracts, _deployedContracts, _deployedContracts ];
  };

  // Add extra non-cached blockchain data for each series AND PARSE data. (eg. )
  const _getSeriesData = async (seriesAddrs:IYieldSeries[]): Promise<IYieldSeries[]> => {
    const _seriesData:any[] = [];
    await Promise.all(
      seriesAddrs.map( async (x:any, i:number)=> {
        _seriesData.push(x);
        try {
          _seriesData[i].yDaiBalance = account? await callTx(x.yDai, 'YDai', 'balanceOf', [account]): '0';
          _seriesData[i].isMature = await callTx(x.yDai, 'YDai', 'isMature', []);
        } catch (e) {
          console.log(`Could not load series blockchain data: ${e}`);
        }
      })
    );

    // Parse and return data
    return _seriesData.map((x:any, i:number) => {
      return {
        ...x,
        yDaiBalance_: ethers.utils.formatEther(x.yDaiBalance.toString()),
        maturity_: new Date( (x.maturity) * 1000 ),
        seriesColor: seriesColors[i],
      };
    });
  };

  // Fetch non-cached yield protocol general data  (eg. market data - dai/dyai prices)
  const _getYieldData = async (deployedContracts:any ): Promise<any> => {
    
    const _yieldData:any = {
      liquidationPrice: BigNumber.from('100'),
      collateralizationRatio: BigNumber.from('100'),
      // _ilks : await callTx(deployedContracts.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]),
    };

    console.log(_yieldData);
    // parse data if required.
    return {
      ..._yieldData,
      liquidationPrice_: _yieldData.liquidationPrice.toString(),
      collateralizationRatio_: _yieldData.collateralizationRatio.toString(),
    };
  };


  // Yield data for the user address
  const _getUserData = async (deployedContracts:any, forceUpdate:boolean): Promise<any> => {
    const _userData:any = {};
    const _lastBlock = await provider.getBlockNumber();

    /* get balances and posted collateral */
    _userData.ethBalance = await getEthBalance();
    _userData.ethPosted = await callTx(deployedContracts.Dealer, 'Dealer', 'posted', [utils.WETH, account]);
    // _userData.ethTotalDebtYDai = await callTx(deployedContracts.Dealer, 'Dealer', 'totalDebtYDai', [utils.WETH, account]);

    /* get transaction history (from cache first or rebuild if update forced) */
    forceUpdate && window.localStorage.removeItem('txHistory') && console.log('Re-building txHistory...');
    const _postedHistory = await getEventHistory(deployedContracts.Dealer, 'Dealer', 'Posted', [null, account, null], !txHistory?0:txHistory.lastBlock+1 );
    const _borrowedHistory = await getEventHistory(deployedContracts.Dealer, 'Dealer', 'Borrowed', [], !txHistory?0:txHistory.lastBlock+1 );
    // TODO add in AMM history information
    // TODO add in YDai information?
    
    // Testing event listener:
    // addEventListener(deployedContracts.Dealer, 'Dealer', 'Posted', [null, null, null], ( x:any, y:any, z:any )=> console.log(ethers.utils.parseBytes32String(x), y) );

    // TODO : get blocknumber at initialisation of yDaiProtocol instead of using first block(0).
    console.log('txHistory updated from block:', txHistory?.lastBlock+1||0, 'to block:', _lastBlock);
    setTxHistory({
      lastBlock: _lastBlock, 
      items: txHistory ? [ ...txHistory.items, ..._postedHistory, ..._borrowedHistory ]
        : [ ..._postedHistory, ..._borrowedHistory ]
    });
    console.log('txHistory updated');

    /* parse and return user data */
    return {
      ..._userData,
      ethBalance_: parseFloat(ethers.utils.formatEther(_userData.ethBalance.toString())),
      ethPosted_: parseFloat(ethers.utils.formatEther(_userData.ethPosted.toString())),
      txHistory : { 
        ...txHistory,
        items: txHistory?.items,
        collateralTxs: txHistory?.items.filter((x:any)=> x.event === 'Posted'),
        seriesTxs: txHistory?.items.filter((x:any)=> x.event === 'Borrowed'),
        redeemTxs: txHistory?.items.filter((x:any)=> x.event === 'Redeemed'),
        adminTxs: txHistory?.items.map((x:any, i:number)=> i),
      },
      preferences: userPreferences,
      // ethTotalDebtYDai_: parseFloat(ethers.utils.formatEther(_userData.ethTotalDebtYDai.toString())),
      // chaiPosted_: parseFloat(ethers.utils.formatEther(_yieldData.chaiPosted.toString())),
      // chaiTotalDebtYDai_: parseFloat(ethers.utils.formatEther(_yieldData.chaiTotalDebtYDai.toString())),
    };
  };

  // Get maker data
  const _getMakerData = async (deployedContracts:any): Promise<any> => {

    const _ilks = await callTx(deployedContracts.Vat, 'Vat', 'ilks', [ethers.utils.formatBytes32String('ETH-A')]);
    const _urns = await callTx(deployedContracts.Vat, 'Vat', 'urns', [ethers.utils.formatBytes32String('ETH-A'), account ]);
    // parse and return maker data
    return { 
      ilks: {
        ..._ilks,
        // Art_: utils.rayToHuman(_ilks.Art),
        spot_: utils.rayToHuman(_ilks.spot),
        rate_: utils.rayToHuman(_ilks.rate),
        // line_: utils.rayToHuman(_ilks.line),
        // dust_: utils.rayToHuman(_ilks.dust),
      },
      urns: {
        ..._urns,
        art_: utils.rayToHuman(_urns.art),
        ink_: utils.rayToHuman(_urns.ink),
      },
    };
  };

  const initApp = async (networkId:number|string) => {

    dispatch({ type:'isLoading', payload: true });
    // #1 Fetch and update PUBLIC Yield protocol ADDRESSES from cache, chain, or db.
    const [ 
      deployedSeries,
      deployedContracts
    ] = await _getYieldAddrs(networkId, false);
    dispatch({ type:'updateDeployedContracts', payload: deployedContracts });

    let yieldCoreData:any={};
    let extraSeriesData:any={};
    [ yieldCoreData, extraSeriesData ] = await Promise.all([
      // #2 fetch any PUBLIC Yield protocol system data from blockchain
      _getYieldData(deployedContracts),
      // #3 fetch any extra PUBLIC non-cached info for each series and PARSE series data (maturity etc.)
      _getSeriesData(deployedSeries),
    ]);
    dispatch({ type:'updateYieldData', payload: yieldCoreData });
    dispatch({ type:'updateDeployedSeries', payload: extraSeriesData });

    // #4 Fetch any user account data based on address (if any), possibly cached.
    const userData = account ? await _getUserData(deployedContracts, false): { ethBalance_: 0 };
    dispatch({ type:'updateUserData', payload: userData });

    // #5 Get maker data
    const makerData = await _getMakerData(deployedContracts);
    dispatch({ type:'updateMakerData', payload: makerData });
    
    // add listen to rate/spot changes on Maker
    addEventListener(
      deployedContracts.Vat,
      'Vat',
      'LogNote',
      [],
      (x:any, y:any, z:any)=> { 
        console.log(x, y, z); // dispatch({ type:'updateMakerData', payload: {...makerData, makerData.ilks })
      }
    );

    dispatch({ type:'isLoading', payload: false });
  };

  React.useEffect( () => {
    ( async () => chainId && initApp(chainId))();
  }, [chainId, account]);

  const actions = {
    updateUserData: (x:any) => _getUserData(x, true).then((res:any)=> dispatch({ type:'updateUserData', payload: res })),
    updateSeriesData: (x:IYieldSeries[]) => _getSeriesData(x).then((res:any) => dispatch({ type:'updateDeployedSeries', payload: res })),
    updateYieldBalances: (x:any) => _getYieldData(x).then((res:any)=> dispatch({ type:'updateYieldData', payload: res })),
    
    // refreshYieldAddrs: () => _getYieldAddrs(chainId, true),
  };

  return (
    <YieldContext.Provider value={{ state, actions }}>
      {children}
    </YieldContext.Provider>
  );
};

export { YieldContext, YieldProvider };
