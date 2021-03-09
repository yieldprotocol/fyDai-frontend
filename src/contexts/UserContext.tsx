import React, { useEffect, useContext, createContext, useReducer } from 'react';
import { ethers } from 'ethers';

import { cleanValue } from '../utils';

import {
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
  authorization:{ hasDsProxy:true },
  preferences:{
    slippage: 0.005, // default === 0.5%
    useTxApproval: false,
    useBuyToAddLiquidity: true,
    showDisclaimer: false,
    themeMode:'auto',
    moodLight: true,
  },
  makerVaults:[],
};

const UserProvider = ({ children }: any) => {

  const [ state, dispatch ] = useReducer(reducer, initState);
  const { state: yieldState } = useContext(YieldContext);
  const { deployedContracts, feedData } = yieldState;
  const { account } = useSignerAccount();

  /* cache | localStorage declarations */
  const [cachedPreferences, setCachedPreferences] = useCachedState('userPreferences', null );
  
  /* hook declarations */
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
      usdcBalance, // note: in mwei
      ethPosted,  
    ]:any[] = await Promise.all([
      getBalance(),
      getBalance(deployedContracts.Dai, 'Dai'),
      // getBalance(deployedContracts.Dai, 'Dai'),
      getBalance(deployedContracts.USDC, 'USDC'),
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
    const usdcBalanceWad = usdcBalance.mul('1000000000000');

    const values = {
      ethBalance, 
      daiBalance,
      usdcBalance, // note: in mwei
      usdcBalanceWad,
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
      usdcBalance_ : cleanValue(ethers.utils.formatUnits(usdcBalance, 'mwei'), 2),
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
    return _auths;
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

    const _cdpData:any = cdpList[1] ? 
      await Promise.all(cdpList[1].map((x:string) => getCDPData(x, 'ETH-A') ) ) : 
      [];
    
    const _makerData = cdpList.length > 0 ? 
      cdpList[0].map((x:any, i:number) => {
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
      }) :
      [];

    dispatch( { 'type': 'updateMakerVaults', 'payload':  _makerData });

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

      // console.log(auths?.dsProxyAddress);

      /* Then get maker data if available */ 
      await _getMakerVaults(auths?.dsProxyAddress);
      
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
    // re-update preferences 
    !yieldState?.yieldLoading && _updatePreferences(null);
    
  }, [ account, yieldState.yieldLoading ]);

  /* Exposed actions */
  const actions = {
    updateUser: () =>  account && initUser(),
    updatePosition: () => account && _getPosition(),
    updateAuthorizations: () => account && _getAuthorizations(),
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