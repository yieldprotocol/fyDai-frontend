import { useMemo, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import Vat from '../contracts/Vat.json';

import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';
import { useDsProxy } from './dsProxyHook';

/**
 * Hook for interacting with the yield 'CRONTROLLER' Contract
 * @returns { function } post
 * @returns { boolean } postActive
 * @returns { function } withdraw
 * @returns { boolean } withdrawActive
 * @returns { function } borrow
 * @returns { boolean } borrowActive
 * @returns { function } repay
 * @returns { boolean } repayActive
 * @returns { function } approveController
 * @returns { boolean } approveActive
 */
export const useMaker = () => {
  const { abi: vatAbi } = Vat;
  
  const getCdpsAbi = [{ 'constant':true, 'inputs':[{ 'internalType':'address', 'name':'manager', 'type':'address' }, { 'internalType':'address', 'name':'guy', 'type':'address' }], 'name':'getCdpsAsc', 'outputs':[{ 'internalType':'uint256[]', 'name':'ids', 'type':'uint256[]' }, { 'internalType':'address[]', 'name':'urns', 'type':'address[]' }, { 'internalType':'bytes32[]', 'name':'ilks', 'type':'bytes32[]' }], 'payable':false, 'stateMutability':'view', 'type':'function' }, { 'constant':true, 'inputs':[{ 'internalType':'address', 'name':'manager', 'type':'address' }, { 'internalType':'address', 'name':'guy', 'type':'address' }], 'name':'getCdpsDesc', 'outputs':[{ 'internalType':'uint256[]', 'name':'ids', 'type':'uint256[]' }, { 'internalType':'address[]', 'name':'urns', 'type':'address[]' }, { 'internalType':'bytes32[]', 'name':'ilks', 'type':'bytes32[]' }], 'payable':false, 'stateMutability':'view', 'type':'function' }];

  const { fallbackProvider, account } = useSignerAccount();
  
  const { state : { deployedContracts } } = useContext<any>(YieldContext);
  const { state: userState, actions: userActions } = useContext(UserContext);

  /* controller contract for txs */
  const [vatContract, setVatContract] = useState<any>();
  const [getCdpsContract, setGetCdpsContract] = useState<any>();

  const { handleTx, handleTxRejectError } = useTxHelpers();
  const { proxyExecute } = useDsProxy();

  useMemo(()=>{
    try {
      deployedContracts.Vat && fallbackProvider &&
      setVatContract( new ethers.Contract( 
        ethers.utils.getAddress(deployedContracts.Vat), 
        vatAbi,
        fallbackProvider
      ));

      deployedContracts.GET_CDPS && fallbackProvider &&
      setGetCdpsContract( new ethers.Contract( 
        ethers.utils.getAddress(deployedContracts.GET_CDPS), 
        getCdpsAbi,
        fallbackProvider
      ));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }, [fallbackProvider, deployedContracts]);

  /**
   * @dev Checks to see if an account (user) has delegated a contract/3rd Party for the controller.
   * @param {string} dsProxyAddress ds porxy address of the user
   * @param {string} collateralType collateral type to filter by (eg. ETH-A)
   * @returns array 
   * @note call function
   */
  const getCDPList = async (
    dsProxyAddress:string,
    collateralType:string|null = null
  ): Promise<any> => {
    let res;
    try {
      res = await getCdpsContract.getCdpsDesc(deployedContracts.CDP_MANAGER, dsProxyAddress);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = [];
    }
    if (!collateralType) {
      return res;
    }
    return res.filter((x:any) => x.ilks !== ethers.utils.formatBytes32String(collateralType));
  };

  /**
   * @dev get the data about a MAKER CDP Vault 
   * @param {string} cdpAddress address of the cdp (as found in CDP manager)
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * 
   * @returns vault info
   * @note call function
   */
  const getCDPData = async (
    cdpAddress:string,
    collateralType: string, 
  ): Promise<BigNumber> => {
    const cdpAddr = account && ethers.utils.getAddress(cdpAddress);
    const collType = ethers.utils.formatBytes32String(collateralType);
    let res;
    try {
      res = await vatContract.urns(collType, cdpAddr);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  return {
    getCDPList,
    getCDPData,
  } as const;
};