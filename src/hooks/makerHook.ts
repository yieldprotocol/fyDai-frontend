import { useMemo, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';

import { YieldContext } from '../contexts/YieldContext';

import Vat from '../contracts/Vat.json';
import DssCdpManager from '../contracts/DssCdpManager.json';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';

import { IYieldSeries } from '../types';

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

  const { fallbackProvider, account, signer } = useSignerAccount();
  const { state : { deployedContracts } } = useContext<any>(YieldContext);

  /* controller contract for txs */
  const [vatContract, setVatContract] = useState<any>();
  const [getCdpsContract, setGetCdpsContract] = useState<any>();
  const { previewPoolTx } = usePool();

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
      [managedCdpList, accountCdp] = await Promise.all([
        getCdpsContract.getCdpsDesc(deployedContracts.DssCdpManager, dsProxyAddress),
        getCdpsContract.getCdpsDesc(deployedContracts.DssCdpManager, account),
        // vatContract.urns(collateralBytes || ethers.utils.formatBytes32String('ETH-A'), dsProxyAddress)
      ]);

      // cdpList = [ cdpManList.map((x:any)=> x 'managed':true } )]
      // console.log(cdpSingle);
      // cdpList = cdpManList.concat(cdpSingle);
      cdpList = managedCdpList;
      console.log(cdpList);

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
   * @dev Convert from MakerDAO debt to Dai
   * @param {string|BigNumber} daiAmount debt amount
   * @param {string} collateralType collateral type to filter by (default. ETH-A)
   * @returns {Promise<BigNumber>} dai amount
   * @note call function
   */
  const makerDebtToDai = async (
    amount:number|BigNumber,
    collateralType: string = 'ETH-A',
  ) => {
    const parsedAmount= BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const collType = ethers.utils.formatBytes32String(collateralType);
    let rate;
    try {
      [,rate,,,] = await vatContract.ilks(collType);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      rate = 0;
    }
    return  utils.mulRay(parsedAmount, rate);
  };

  /**
   * @dev Convert from Dai to MakerDAO debt
   * @param {string|BigNumber} daiAmount debt amount
   * @param {string} collateralType collateral type to filter by (default. ETH-A)

   * @returns {Promise<BigNumber>} dai amount
   * @note call function
   */

  const daiToMakerDebt = async (
    amount:number|BigNumber,
    collateralType: string = 'ETH-A',
  ) => {
    const parsedAmount= BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const collType = ethers.utils.formatBytes32String(collateralType);
    let rate;
    try {
      [,rate,,,] = await vatContract.ilks(collType);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return BigNumber.from('0');
    }
    return  utils.divRay(parsedAmount, rate);
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
    return  utils.divRay(parsedAmount, spot);
  };

  /**
   * @dev Amount of fyDai debt that will result from migrating Dai debt from MakerDAO to Yield
   * @param {IYieldSeries} series series to act on.
   * @param {string|BigNumber} fyDaiAmount debt amount
   * @returns {Promise<BigNumber>} weth amount 
   * @note call function
   */
  const fyDaiForDai = async (
    series: IYieldSeries,
    amount:number|BigNumber,
  ) =>{
    /* Processing and/or sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    let preview:BigNumber|Error;
    try {
      preview = await previewPoolTx('buydai', series, parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return BigNumber.from('0');
    }
    return preview;
  };

  /**
   * @dev Amount of dai debt that will result from migrating fyDai debt from Yield to MakerDAO
   * @param {string|BigNumber} fyDaiAmount debt amount
   * @param {IYieldSeries} series series to act on.
   * @returns {Promise<BigNumber>} weth amount 
   * @note call function
   */
  const daiForFyDai =async (
    series: IYieldSeries,
    amount:number|BigNumber,
  ) => {
    /* Processing and/or sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    let preview:BigNumber|Error;
    try {
      preview = await previewPoolTx('buyFydai', series, parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      return BigNumber.from('0');
    }
    return preview;
  };

  /* using dai in account */

  const genVault =async (
    dsProxyAddress: string,
  ) => { 
    const cdpMgr = new ethers.Contract( 
      ethers.utils.getAddress('0x1476483dD8C35F25e568113C5f70249D3976ba21'), 
      DssCdpManager.abi,
      signer
    );
    try {  
      // await cdpMgr.open(ethers.utils.formatBytes32String('ETH-A'), dsProxyAddress).wait();
      const cdp = await cdpMgr.last(dsProxyAddress);
      const urn = await cdpMgr.urns(cdp);
      const owns = await cdpMgr.owns(cdp);
      console.log(cdp.toString(), urn, owns);
      // await vatContract.hope(cdpMgr.address).wait();
      // await cdpMgr.enter(dsProxyAddress, cdp).wait();
      // await vatContract.move(dsProxyAddress, urn, ethers.utils.parseEther('100') ).wait();
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  return {
    getCDPList,
    getCDPData,
    makerDebtToDai,
    daiToMakerDebt,
    minWethForAmount,
    fyDaiForDai,
    daiForFyDai,
    genVault,
  } as const;
};