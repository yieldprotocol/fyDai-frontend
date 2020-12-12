import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { ISignListItem, IYieldSeries } from '../types';

import ImportProxy from '../contracts/ImportProxy.json';
import ImportCdpProxy from '../contracts/ImportCdpProxy.json';


import Controller from '../contracts/Controller.json';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { useSigning } from './signingHook';
import { useDsProxy } from './dsProxyHook';
import { useController } from './controllerHook';
import { genTxCode } from '../utils';

/**
 * Hook for interacting with the ImportProxy Contract.
 * 
 * @returns { function } importPosition
 * @returns { function } importVault
 * 
 * @returns { function } debtToDai
 * @returns { function } daiToDebt
 * 
 */
export const useImportProxy = () => {

  /* contexts */
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { authorization: { hasDelegatedDsProxy } } }  = useContext<any>(UserContext);

  /* hooks */
  const { account, signer } = useSignerAccount();
  const { addControllerDelegate, checkControllerDelegate } = useController();
  const { proxyExecute } = useDsProxy();
  const { delegationSignature, handleSignList } = useSigning();

  const { abi: importCdpProxyAbi } = ImportCdpProxy;
  const { abi: importProxyAbi } = ImportProxy;

  const { abi: controllerAbi } = Controller;

  /* Preset the importProxy and controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ cdpProxyContract, setCdpProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  
  useEffect(()=>{
    deployedContracts?.ImportProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.ImportProxy), 
      importProxyAbi,
      signer
    ));
    deployedContracts?.ImportCdpProxy && signer &&
    setCdpProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.ImportCdpProxy), 
      importCdpProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
  }, [signer, deployedContracts]);

  /**
   * @dev Fork part of a user MakerDAO vault to ImportProxy, and call importProxy to transform it into a Yield vault 
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {string|BigNumber} wethAmount Weth collateral to import
   * @param {string|BigNumber} debtAmount Normalized debt to move ndai * rate = dai
   * 
   * @param {number} cdpID vault number of the cdp to import
   * @param {boolean} viaCdpManager is the cdp managed by the Maker dssCdpManager
   * 
   * @note if BigNumber is used make sure it is already in WEI
   */
  const importPosition = async (
    series:IYieldSeries,
    wethAmount:string|BigNumber,
    debtAmount:string|BigNumber,
    cdpId:number,
    viaCdpMan:boolean=true, /* default to using cdpManager */
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedWeth = BigNumber.isBigNumber(wethAmount)? wethAmount : ethers.utils.parseEther(utils.cleanValue(wethAmount));
    const parsedDebt = BigNumber.isBigNumber(debtAmount)? debtAmount : ethers.utils.parseEther(utils.cleanValue(debtAmount));
    const userAddr = account && ethers.utils.getAddress(account);

    const overrides = {
      gasLimit: BigNumber.from('1000000'),
      value: ethers.utils.parseEther('0')
    };

    // /* Check the signature requirements */
    // const checkSigs = await proxyContract.importPositionCheck(poolAddr);
    // console.log(checkSigs);

    const maxDaiPrice = utils.toRay(2);

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your vault in Maker (CDP Manager)',
        conditional: !viaCdpMan && await checkControllerDelegate(cdpProxyContract.address),  // skip signing if any are TRUE
        signFn: () => delegationSignature(controllerContract, cdpProxyContract.address),    
        fallbackFn: () => addControllerDelegate(cdpProxyContract.address),
      });

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your vault in Maker',
        conditional: viaCdpMan && await checkControllerDelegate(proxyContract.address), // skip signing if any are TRUE
        signFn: () => delegationSignature(controllerContract, proxyContract.address),    
        fallbackFn: () => addControllerDelegate(proxyContract.address),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('IMPORT_POSITION', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    console.log(poolAddr, cdpId, parsedWeth, parsedDebt, maxDaiPrice, signedSigs.get('controllerSig'));
    /* contract fns used:
      importPositionWithSignature(IPool pool, address user, uint256 wethAmount, uint256 debtAmount, uint256 maxDaiPrice, bytes memory controllerSig)
      importCdpPositionWithSignature(IPool pool, uint256 cdp, uint256 wethAmount, uint256 debtAmount, uint256 maxDaiPrice, bytes memory controllerSig) */
    const calldata = viaCdpMan ? 
      cdpProxyContract.interface.encodeFunctionData(
        'importCdpPositionWithSignature', 
        [ poolAddr, cdpId.toString(), parsedWeth, parsedDebt, maxDaiPrice, signedSigs.get('controllerSig') ]
      ) :
      proxyContract.interface.encodeFunctionData(
        'importPositionWithSignature', 
        [ poolAddr, userAddr, parsedWeth, parsedDebt, maxDaiPrice, signedSigs.get('controllerSig') ]
      );

    /* send to the proxy for execution */
    await proxyExecute( 
      viaCdpMan ? cdpProxyContract.address: proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Migrating ${parsedWeth} collateral and/or ${parsedDebt} Debt to ${series.displayNameMobile}`, type:'IMPORT_POSITION', series  }
    );
  };


  /**
   * @dev Fork a user MakerDAO vault to ImportProxy, and call importProxy to transform it into a Yield vault
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number} cdpID vault number of the cdp to import
   * @param {boolean} viaCdpManager is the cdp managed by the Maker dssCdpManager
   */
  const importVault= async (
    series:IYieldSeries,
    cdpId:number,
    viaCdpMan:boolean=true, /* default to using cdpManager */
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const userAddr = account && ethers.utils.getAddress(account);

    const overrides = {
      gasLimit: BigNumber.from('1000000'),
      value: ethers.utils.parseEther('0')
    };

    const maxDaiPrice = utils.toRay(2);

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: !viaCdpMan && await checkControllerDelegate(cdpProxyContract.address),
        signFn: () => delegationSignature(controllerContract, cdpProxyContract.address),    
        fallbackFn: () => addControllerDelegate(cdpProxyContract.address),
      });

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: viaCdpMan && await checkControllerDelegate(proxyContract.address),
        signFn: () => delegationSignature(controllerContract, proxyContract.address),    
        fallbackFn: () => addControllerDelegate(proxyContract.address),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('ADD_LIQUIDITY', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /* 
      contract fn used: 
      importCdpWithSignature(IPool pool, uint256 cdp, uint256 maxDaiPrice, bytes memory controllerSig)
      importVaultWithSignature(IPool pool, address user, uint256 maxDaiPrice, bytes memory controllerSig) 
    */
    const calldata = viaCdpMan ?
      cdpProxyContract.interface.encodeFunctionData( 'importCdpWithSignature', [ poolAddr, cdpId.toString(), maxDaiPrice, signedSigs.get('controllerSig') ] ) :
      proxyContract.interface.encodeFunctionData( 'importVaultWithSignature', [ poolAddr, userAddr, maxDaiPrice, signedSigs.get('controllerSig') ] );

    /* send to the proxy for execution */
    await proxyExecute( 
      viaCdpMan ? cdpProxyContract.address: proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Migrating a MakerVault to  Yield series: ${series.displayNameMobile}`, type:'IMPORT_VAULT', series  }
    );
  };


  /**
   * @dev Convert from MakerDAO debt to Dai
   * @param {string|BigNumber} daiAmount debt amount
   * @returns {Promise<BigNumber>} dai amount
   * @note call function
   */
  const debtToDai = async (
    diaAmount:string|BigNumber,
  ): Promise<BigNumber> => {
    const parsedAmount= BigNumber.isBigNumber(diaAmount)? 
      diaAmount : 
      ethers.utils.parseEther(utils.cleanValue(diaAmount));
    let res;
    try {
      res = await proxyContract.debtToDai(parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Convert from Dai to MakerDAO debt
   * @param {string|BigNumber} daiAmount debt amount
   * @returns {Promise<BigNumber>} dai amount
   * @note call function
   */
  const daiToDebt = async (
    diaAmount:string|BigNumber,
  ): Promise<BigNumber> => {
    const parsedAmount= BigNumber.isBigNumber(diaAmount)? 
      diaAmount : 
      ethers.utils.parseEther(utils.cleanValue(diaAmount));
    let res;
    try {
      res = await proxyContract.daiToDebt(parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };


  /**
   * @dev Minimum weth needed to collateralize an amount of dai in MakerDAO
   * @param {string|BigNumber} daiAmount debt amount
   * @returns {Promise<BigNumber>} dai amount
   * @note call function
   */
  const wethForDai = async (
    diaAmount:string|BigNumber,
  ): Promise<BigNumber> => {
    const parsedAmount= BigNumber.isBigNumber(diaAmount)? 
      diaAmount : 
      ethers.utils.parseEther(utils.cleanValue(diaAmount));
    let res;
    try {
      res = await proxyContract.wethForDai(parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Minimum weth needed to collateralize an amount of fyDai in Yield.
   * @param {string|BigNumber} fyDaiAmount debt amount
   * @returns {Promise<BigNumber>} weth amount 
   * @note call function
   */
  const wethForFYDai = async (
    fyDaiAmount:string|BigNumber,
  ): Promise<BigNumber> => {
    const parsedAmount= BigNumber.isBigNumber(fyDaiAmount)? 
      fyDaiAmount : 
      ethers.utils.parseEther(utils.cleanValue(fyDaiAmount));
    let res;
    try {
      res = await proxyContract.wethForFYDai(parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Amount of fyDai debt that will result from migrating Dai debt from MakerDAO to Yield
   * @param {string|BigNumber} fyDaiAmount debt amount
   * @param {IYieldSeries} series series to act on.
   * @returns {Promise<BigNumber>} weth amount 
   * @note call function
   */
  const fyDaiForDai = async (
    series:IYieldSeries,
    fyDaiAmount:string|BigNumber,
  ): Promise<BigNumber> => {
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedAmount= BigNumber.isBigNumber(fyDaiAmount)? 
      fyDaiAmount : 
      ethers.utils.parseEther(utils.cleanValue(fyDaiAmount));
    let res;
    try {
      res = await proxyContract.fyDaiForDai(poolAddr, parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  /**
   * @dev Amount of dai debt that will result from migrating fyDai debt from Yield to MakerDAO
   * @param {string|BigNumber} fyDaiAmount debt amount
   * @param {IYieldSeries} series series to act on.
   * @returns {Promise<BigNumber>} weth amount 
   * @note call function
   */
  const daiForFYDai = async (
    series:IYieldSeries,
    fyDaiAmount:string|BigNumber,
  ): Promise<BigNumber> => {
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedAmount= BigNumber.isBigNumber(fyDaiAmount)? 
      fyDaiAmount : 
      ethers.utils.parseEther(utils.cleanValue(fyDaiAmount));
    let res;
    try {
      res = await proxyContract.daiForFYDai(poolAddr, parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  return {

    /* exported import Proxy fns */
    importPosition,
    importVault,

    /* call fns */ 
    daiToDebt,
    debtToDai,

    wethForDai,
    wethForFYDai,

    fyDaiForDai,
    daiForFYDai,

  } as const;
};
