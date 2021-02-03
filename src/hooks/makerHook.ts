import { useMemo, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import Vat from '../contracts/Vat.json';
import { divDecimal, floorDecimal } from '../utils/yieldMath';
import { YieldContext } from '../contexts/YieldContext';
import { useSignerAccount } from './connectionHooks';


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

  /* controller contract for txs */
  const [vatContract, setVatContract] = useState<any>();
  const [getCdpsContract, setGetCdpsContract] = useState<any>();

  useMemo(()=>{
    try {
      deployedContracts.Vat && fallbackProvider &&
      setVatContract( new ethers.Contract( 
        ethers.utils.getAddress(deployedContracts.Vat), 
        vatAbi,
        fallbackProvider,
      ));

      deployedContracts.GetCdps && fallbackProvider &&
      setGetCdpsContract( new ethers.Contract( 
        ethers.utils.getAddress(deployedContracts.GetCdps), 
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
    let cdpList;
    let managedCdpList;
    let accountCdp;
    const collateralBytes = collateralType? ethers.utils.formatBytes32String(collateralType): null;
    try {
      /* check for cdps registered to the dsProxy address in the manager and also directly in vat */ 
      [ managedCdpList, accountCdp ] = await Promise.all([
        getCdpsContract.getCdpsDesc(deployedContracts.DssCdpManager, dsProxyAddress),
        getCdpsContract.getCdpsDesc(deployedContracts.DssCdpManager, account),
      ]);

      // TODO: join the two cdp lists 
      // if (accountCdp.length > 0) { 
      //   cdpList = managedCdpList.push(accountCdp[0]);
      // } else {
      //   cdpList = managedCdpList;
      // }
      cdpList = managedCdpList;
      // eslint-disable-next-line no-console
      console.log(cdpList); console.log(accountCdp);
      
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      cdpList = [];
    }
    if (!collateralBytes) {
      return cdpList;
    }
    return cdpList.filter((x:any) => x.ilks !== collateralBytes);
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

  /**
   * @dev Minimum weth needed to collateralize an amount of dai OR FyDai in MakerDAO
   * @param {string|BigNumber} amount of or Dai / FyDai debt amount
   * @param {string} collateralType collateral type to filter by (default. ETH-A)
   * @returns {Promise<BigNumber>} dai amount
   * @note call function
   */
  const minWethForAmount = async (
    amount:number|BigNumber,
    collateralType: string = 'ETH-A',
  ) => {
    const parsedAmount= BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const collType = ethers.utils.formatBytes32String(collateralType);
    let spot;
    try {
      [,,spot,,] = await vatContract.ilks(collType);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return BigNumber.from('0');
    }
    
    const minWeth = divDecimal(parsedAmount, spot, '1e-27');
    return  floorDecimal( minWeth );

  };

  return {
    getCDPList,
    getCDPData,
    minWethForAmount,
  } as const;
};