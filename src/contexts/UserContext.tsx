import React, { useEffect, useContext, createContext, useReducer } from 'react';
import { ethers } from 'ethers';

import { cleanValue } from '../utils';

import {
  calculateAPR,
  borrowingPower, 
  mulDecimal, 
  divDecimal,
  floorDecimal,
  collateralizationRatio,
} from '../utils/yieldMath';

import { YieldContext } from './YieldContext';

import { useToken } from '../hooks/tokenHook';
import { useCachedState, } from '../hooks/appHooks';
import { useController } from '../hooks/controllerHook';
import { useEvents } from '../hooks/eventHooks';
import { useSignerAccount } from '../hooks/connectionHooks';
import { useDsRegistry } from '../hooks/dsRegistryHook';
import { useMaker } from '../hooks/makerHook';

const UserContext = createContext<any>({});

// reducer
function reducer(state: any, action: any) {
  switch (action.type) {
    case 'updatePreferences':
      return {
        ...state,
        preferences: action.payload,
      };
    case 'updatePosition':
      return {
        ...state,
        position: action.payload,
      };
    case 'updateAuthorizations':
      return {
        ...state,
        authorization: action.payload,
      };
    case 'updateTxHistory':
      return {
        ...state,
        txHistory: action.payload,
      };
    case 'updateMakerVaults':
      return {
        ...state,
        makerVaults: action.payload,
      };
    case 'isLoading':
      return {
        ...state,
        userLoading: action.payload,
      };
    default:
      return state;
  }
}

const initState = {
  userLoading: true,
  position: {},
  txHistory: {
    lastBlock: 11066942, 
    items:[],
  },
  authorization:{ hasDsProxy:true },
  preferences:{
    slippage: 0.005, // default === 0.5%
    useTxApproval: false,
    useBuyToAddLiquidity: true,
    showDisclaimer: true,
    themeMode:'auto',
    moodLight: true,
  },
  makerVaults:[],
};

const UserProvider = ({ children }: any) => {

  const [ state, dispatch ] = useReducer(reducer, initState);
  const { state: yieldState } = useContext(YieldContext);
  const { deployedContracts, deployedSeries, feedData } = yieldState;
  const { account, provider } = useSignerAccount();

  /* cache | localStorage declarations */
  const [txHistory, setTxHistory] = useCachedState('txHistory', null);
  const [cachedPreferences, setCachedPreferences] = useCachedState('userPreferences', null );
  
  /* hook declarations */
  const { getEventHistory, parseEventList } = useEvents();
  const { getBalance } = useToken();

  const { getCDPList, getCDPData } = useMaker();

  const { getDsProxyAddress } = useDsRegistry();
  const { 
    collateralPosted, 
    collateralLocked,
    totalDebtDai,
    checkControllerDelegate,
  } = useController();

  /**
   * @dev gets and updates yield positions {}
   */
  const _getPosition = async () => {

    /* Get balances and posted collateral */
    const [
      ethBalance, 
      daiBalance, 
      ethPosted,  
    ]:any[] = await Promise.all([
      getBalance(),
      getBalance(deployedContracts.Dai, 'Dai'),
      collateralPosted('ETH-A'),
    ]);

    const [
      ethLocked,
      debtValue,
    ]:any[] = await Promise.all([
      collateralLocked('ETH-A'),
      totalDebtDai('ETH-A'),
    ]);

    const collateralValue = mulDecimal(ethPosted, feedData.ethPrice); 
    const collateralRatio = collateralizationRatio(ethPosted, feedData.ethPrice, debtValue) || '0';
    const collateralPercent = collateralizationRatio(ethPosted, feedData.ethPrice, debtValue, true) || '0';
    const maxDaiBorrow = borrowingPower( ethPosted, feedData.ethPrice, debtValue );

    const values = {
      ethBalance, 
      daiBalance, 
      ethPosted,
      ethLocked, 
      debtValue,
      collateralValue,
      collateralRatio,
      collateralPercent,
      maxDaiBorrow,
    };

    /* parse to human usable */
    const parsedValues = {  
      ethBalance_ : cleanValue(ethers.utils.formatEther(ethBalance), 6),
      daiBalance_ : cleanValue(ethers.utils.formatEther(daiBalance), 2),
      ethPosted_ : cleanValue(ethers.utils.formatEther(ethPosted), 6),
      ethLocked_ : cleanValue(ethers.utils.formatEther(ethLocked), 6),
      debtValue_ : cleanValue(ethers.utils.formatEther(debtValue), 2),
      collateralValue_ : cleanValue( divDecimal(maxDaiBorrow, '1e18'), 2),
      collateralRatio_ : cleanValue( collateralRatio, 2),
      collateralPercent_: cleanValue( collateralPercent, 2 ), 
      maxDaiBorrow_ : cleanValue( divDecimal(maxDaiBorrow, '1e18'), 2),
    };
    
    dispatch( { type: 'updatePosition', payload: { ...values, ...parsedValues } } );
    // eslint-disable-next-line no-console
    console.log('User updated:', { ...values, ...parsedValues } );
    return { ...values, ...parsedValues };
  };

  /**
   * @dev gets confirmation of contracts that the user has delegated to operate on thier behalf.
   */
  const _getAuthorizations = async () => {
    const _auths:any={};
    _auths.dsProxyAddress = await getDsProxyAddress();
    _auths.hasDsProxy = _auths.dsProxyAddress !== '0x0000000000000000000000000000000000000000';
    _auths.hasDelegatedDsProxy = await checkControllerDelegate(_auths.dsProxyAddress);
    dispatch( { type: 'updateAuthorizations', payload: _auths });
    console.log(_auths);
    return _auths;
  };

  /**
   * @dev gets user transaction history.
   */
  const _getTxHistory = async ( forceUpdate:boolean ) => {
    /* Get transaction history (from cache first or rebuild if an update is forced) */
    // eslint-disable-next-line no-console
    forceUpdate && console.log('Re-building transaction History...');
    const _lastBlock = await provider.getBlockNumber();
    const lastCheckedBlock = (txHistory && forceUpdate)? 11066942: txHistory?.lastBlock || 11066942;

    /* get the collateral transaction history */
    const collateralHistory = await getEventHistory(
      deployedContracts.Controller,
      'Controller',
      'Posted',
      [ethers.utils.formatBytes32String('ETH-A'), account, null],
      lastCheckedBlock+1
    )
      .then((res: any) => parseEventList(res))       /* then parse returned values */
      .then((parsedList: any) => {                   /* then add extra info and calculated values */
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: x.args_[2]>0 ? 'Deposited' : 'Withdrew',
            type: 'controller_posted',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturity: null,
            amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[2] )) ),
            dai: x.args_[2],
            dai_: ethers.utils.formatEther( x.args_[2] ),
          };
        });
      });
    
    /* get the repayment hisotry from the controller */
    const repayHistory = await getEventHistory(
      deployedContracts.Controller,
      'Controller',
      'Borrowed',
      [ ethers.utils.formatBytes32String('ETH-A'), null, account, null],
      lastCheckedBlock+1
    )
      .then((res: any) => parseEventList(res))        /* then parse returned values */
      .then((parsedList: any) => {                    /* then add extra info and calculated values */
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: x.args_[3]<0? 'Repaid' : 'Borrowed_direct',
            type: 'controller_borrowed',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturity: parseInt(x.args_[1], 10),
            amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[3] )) ),
            dai: x.args_[3],
            dai_: ethers.utils.formatEther( x.args_[3] ),
          };
        });     
      });
    
    /* get the trades history from the pool */
    const tradeHistory = await deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Trade',
        [null, null, account, null, null],
        lastCheckedBlock+1
      )
        .then((res:any) => parseEventList(res))     /* then parse returned values */
        .then((parsedList: any) => {                /* then add extra info and calculated values */
          return parsedList.map((x:any) => {
            let evnt;
            const proxyTrade = (x.args[1] !== x.args[2]); 
            if (x.args_[3]>0) {
              proxyTrade ? evnt='Borrowed' : evnt='Closed';
            } else { 
              evnt = 'Lent';
            }
            return {
              ...x,
              event: evnt,
              type: 'pool_trade',
              from: x.args[1],
              to:  x.args[2],
              proxyTraded: proxyTrade,
              maturity: parseInt(x.args_[0], 10),
              amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[3] )) ),
              dai: x.args[3].abs(),
              fyDai: x.args[4].abs(),
              APR: calculateAPR( x.args[3].abs(),  x.args[4].abs(), parseInt(x.args_[0], 10), x.date), 
              dai_: ethers.utils.formatEther( x.args_[3] ),
              fyDai_: ethers.utils.formatEther( x.args_[4] ),
            };
          }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );

    /* get the add liquidity history */ 
    const addLiquidityHistory = await deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Liquidity',
        [null, null, account, null, null, null],
        lastCheckedBlock+1
      )
        .then((res:any) => parseEventList(res))     /* then parse returned values */
        .then((parsedList: any) => {                /* then add extra info and calculated values */
          return parsedList
            .filter((x:any) => x.args[5]>0)
            .map((x:any) => {
              return {
                ...x,
                event: 'Added',
                type: 'pool_liquidity',
                from: x.args[1],
                to:  x.args[2],
                proxyTraded: x.args[1] !== x.args[2],
                maturity: parseInt(x.args_[0], 10),
                amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[5] )) ),
                dai: x.args[3].abs(),
                fyDai: x.args[4].abs(),
                poolTokens: x.args[5].abs(),
                dai_: ethers.utils.formatEther( x.args_[3] ),
                fyDai_: ethers.utils.formatEther( x.args_[4] ),
                poolTokens_: ethers.utils.formatEther( x.args_[5] ),
              };
            }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );

    // /* get the remove liquidity histrory  - I know!! i will combine the two. but filterign is problmeatic */ 
    const removeLiquidityHistory = await deployedSeries.reduce( async ( accP: any, cur:any) => {
      const acc = await accP; 
      const _seriesHist = await getEventHistory(
        cur.poolAddress, 
        'Pool', 
        'Liquidity',
        [null, account, null, null, null, null],
        lastCheckedBlock+1
      )
        .then((res:any) => parseEventList(res))     /* then parse returned values */
        .then((parsedList: any) => {                /* then add extra info and calculated values */
          return parsedList
            .filter((x:any) => x.args[5]<0)
            .map((x:any) => {
              return {
                ...x,
                event: 'Removed',
                type: 'pool_liquidity',
                from: x.args[1],
                to:  x.args[2],
                proxyTraded: x.args[1] !== x.args[2],
                maturity: parseInt(x.args_[0], 10),
                amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[5] )) ),
                dai: x.args[3].abs(),
                fyDai: x.args[4].abs(),
                poolTokens: x.args[5].abs(),
                dai_: ethers.utils.formatEther( x.args_[3] ),
                fyDai_: ethers.utils.formatEther( x.args_[4] ),
                poolTokens_: ethers.utils.formatEther( x.args_[5] ),
              };
            }); 
        });
      return [...acc, ..._seriesHist];
    }, Promise.resolve([]) );
 
    /* get the migration hisotry from the controller */
    const [ cdpMigrationHistory, migrationHistory]  = await Promise.all([  
      /* migration events from cdps in vat */  
      getEventHistory(
        deployedContracts.ImportCdpProxy,
        'ImportCdpProxy',
        'ImportedFromMaker',
        [ null, null, account, null, null],
        lastCheckedBlock+1
      )
        .then((res: any) => parseEventList(res))        /* then parse returned values */
        .then((parsedList: any) => {                    /* then add extra info and calculated values */
          return parsedList.map((x:any) => {
            return {
              ...x,
              event: 'Imported',
              type: 'imported_maker',
              maturity: parseInt(x.args_[0], 10),
              cdpAddr: x.args_[1],
              collateral: x.args[3],
              collateral_: ethers.utils.formatEther(x.args_[3]),
              daiDebt: x.args[4],
              daiDebt_: ethers.utils.formatEther(x.args_[4]),
              amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[4] )) ),
            };
          });     
        }),

      /* migration events from cdps held in maker cdpManager */
      getEventHistory(
        deployedContracts.ImportProxy,
        'ImportProxy',
        'ImportedFromMaker',
        [ null, null, account, null, null],
        lastCheckedBlock+1
      )
        .then((res: any) => parseEventList(res))        /* then parse returned values */
        .then((parsedList: any) => {                    /* then add extra info and calculated values */
          return parsedList.map((x:any) => {
            return {
              ...x,
              event: 'Imported',
              type: 'imported_maker',
              maturity: parseInt(x.args_[0], 10),
              cdpAddr: x.args_[1],
              collateral: x.args[3],
              collateral_: ethers.utils.formatEther(x.args_[3]),
              daiDebt: x.args[4],
              daiDebt_: ethers.utils.formatEther(x.args_[4]),
              amount: Math.abs( parseFloat(ethers.utils.formatEther( x.args_[4] )) ),
            };
          });     
        }),
    ]);

    /* get the repayment hisotry from the controller */
    const rolledHistory = await getEventHistory(
      deployedContracts.RollProxy,
      'RollProxy',
      'Rolled',
      [ ethers.utils.formatBytes32String('ETH-A'), null, null, account, null],
      lastCheckedBlock+1
    )
      .then((res: any) => parseEventList(res))        /* then parse returned values */
      .then((parsedList: any) => {                    /* then add extra info and calculated values */
        return parsedList.map((x:any) => {
          return {
            ...x,
            event: 'Rolled',
            type: 'debt_rolled',
            collateral: ethers.utils.parseBytes32String(x.args_[0]),
            maturityFrom: yieldState.deployedSeries.find((y:any)=> y.poolAddress === x.args_[1]).maturity,
            maturity: yieldState.deployedSeries.find((y:any)=> y.poolAddress === x.args_[2]).maturity,
            amount: parseFloat(ethers.utils.formatEther(x.args_[4])), 
          };
        });     
      });
     
    const updatedHistory = [
      ...collateralHistory,
      ...repayHistory,
      ...tradeHistory,
      ...addLiquidityHistory,
      ...removeLiquidityHistory,
      ...cdpMigrationHistory,
      ...migrationHistory,
      ...rolledHistory
    ];

    console.log(updatedHistory);

    const _payload = {
      account,
      lastBlock: _lastBlock,
      items: (!forceUpdate && txHistory) ? [...txHistory.items, ...updatedHistory] : [...updatedHistory]
    };

    setTxHistory(_payload);
    dispatch( { type: 'updateTxHistory', payload: _payload });

    // eslint-disable-next-line no-console
    console.log(
      'Transaction history updated from block:',
      lastCheckedBlock,
      'to block:',
      _lastBlock
    );

    return _payload;
  };

  /**
   * @dev Gets/updates preferences from cache.
   */
  const _updatePreferences = async (newPrefs:any) => {
    const allPrefs = { ...state.preferences, ...cachedPreferences, ...newPrefs };
    dispatch( { type: 'updatePreferences', payload: allPrefs });
    setCachedPreferences(allPrefs);
    return { allPrefs };
  };

  /**
   * @dev Gets maker vault data.
   */
  const _getMakerVaults = async (
    dsProxyAddress:string,
  ) => {
    let cdpList: any = [];
    if (dsProxyAddress && dsProxyAddress !== '0x0000000000000000000000000000000000000000') {
      cdpList = await getCDPList(dsProxyAddress, 'ETH-A');
    }
    const _cdpData:any = await Promise.all(cdpList[1].map((x:string) => getCDPData(x, 'ETH-A') ) );
    const _makerData = cdpList[0].map((x:any, i:number) => {
      const { rate } = yieldState.feedData.ilks;
      const vaultDaiDebt = mulDecimal(_cdpData[i][1], rate, '1e-27' ) ; // use built in precision equalling for wad * ray
      return {
        'vaultId': x.toString(),
        'vaultCollateralType': ethers.utils.parseBytes32String(cdpList[2][i]),
        'vaultAddress': cdpList[1][i],
        'vaultDisplayName': `${ethers.utils.parseBytes32String(cdpList[2][i])} Vault #${x.toString()}`,
        'vaultCollateral': _cdpData[i][0],
        'vaultCollateral_': cleanValue(ethers.utils.formatEther(_cdpData[i][0]), 2), 
        'vaultMakerDebt': _cdpData[i][1],
        'vaultMakerDebt_': cleanValue(ethers.utils.formatEther(_cdpData[i][1]), 2),    
        'vaultDaiDebt': ethers.BigNumber.from(floorDecimal(vaultDaiDebt)),
        'vaultDaiDebt_': cleanValue( divDecimal( vaultDaiDebt, '1e18'), 2),

      };
    });

    dispatch( { 'type': 'updateMakerVaults', 'payload':  _makerData });
    console.log(_makerData);
  };

  /* initiate the user */
  const initUser = async () => {
    /* Init start */
    dispatch({ type: 'isLoading', payload: true });
    try {
      const [ ,auths] = await Promise.all([
        _getPosition(),
        _getAuthorizations(),
        _updatePreferences(null),
      ]);

      console.log('User basics data updated');
      /* Then get maker data if available */ 
      await _getMakerVaults(auths?.dsProxyAddress);
      await _getTxHistory(false);
      console.log('User extra data updated');
      
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }

    /* Init end */
    dispatch({ type: 'isLoading', payload: false });

  };

  useEffect(()=>{
    // Init everytime it starts or change of user
    !yieldState?.yieldLoading && account && initUser();
    // If user has changed, rebuild and re-cache the history
    !yieldState?.yieldLoading && account && !(txHistory?.account === account) && _getTxHistory(true);
    // re-update preferences 
    !yieldState?.yieldLoading && _updatePreferences(null);

  }, [ account, yieldState.yieldLoading ]);

  /* Exposed actions */
  const actions = {
    updateUser: () =>  account && initUser(),
    updatePosition: () => account && _getPosition(),
    updateAuthorizations: () => account && _getAuthorizations(),
    updateHistory: () => _getTxHistory(false),
    rebuildHistory: async () => {
      dispatch({ type: 'isLoading', payload: true });
      await _getTxHistory(true);
      dispatch({ type: 'isLoading', payload: false });
    },
    updatePreferences: (x:any) => _updatePreferences(x),
    resetPreferences: () => localStorage.removeItem('userPreferences'),
  };

  return (
    <UserContext.Provider value={{ state, actions }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };