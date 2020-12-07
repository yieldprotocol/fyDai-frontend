import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { ISignListItem, IYieldSeries } from '../types';

import ImportProxy from '../contracts/ImportProxy.json';
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
  const { addControllerDelegate } = useController();
  const { proxyExecute } = useDsProxy();
  const { delegationSignature, handleSignList } = useSigning();

  const { abi: importProxyAbi } = ImportProxy;
  const { abi: controllerAbi } = Controller;

  /* Preset the importProxy and controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  
  useEffect(()=>{
    deployedContracts?.ImportProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.ImportProxy), 
      importProxyAbi,
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
   * @note if BigNumber is used make sure it is already in WEI
   */
  const importPosition = async (
    series:IYieldSeries,
    wethAmount:string|BigNumber,
    debtAmount:string|BigNumber,
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

    /* Check the signature requirements */
    const checkSigs = await proxyContract.importPositionCheck(poolAddr);
    console.log(checkSigs);

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    
    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, proxyContract.address),    
        fallbackFn: () => addControllerDelegate(proxyContract.address),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('ADD_LIQUIDITY', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }


    // contract fn used: importPositionWithSignature(IPool pool, address user, uint256 wethAmount, uint256 debtAmount, bytes memory controllerSig)
    const calldata = proxyContract.interface.encodeFunctionData( 
      'importPositionWithSignature', 
      [ poolAddr, userAddr, parsedWeth, parsedDebt, signedSigs.get('controllerSig') ]
    );

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Migrating ${parsedWeth} collateral and/or ${parsedDebt} Debt to ${series.displayNameMobile}`, type:'IMPORT_POSITION', series  }
    );
  };


  /**
   * @dev Fork a user MakerDAO vault to ImportProxy, and call importProxy to transform it into a Yield vault
   * 
   * @param {IYieldSeries} series series to act on.
   */
  const importVault= async (
    series:IYieldSeries,
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const userAddr = account && ethers.utils.getAddress(account);

    const overrides = {
      gasLimit: BigNumber.from('1000000'),
      value: ethers.utils.parseEther('0')
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.importVaultCheck(poolAddr);
    console.log(checkSigs);

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, proxyContract.address),    
        fallbackFn: () => addControllerDelegate(proxyContract.address),
      });
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('ADD_LIQUIDITY', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    // contract fn used: importVaultWithSignature(IPool pool, address user, bytes memory controllerSig)
    const calldata = proxyContract.interface.encodeFunctionData( 
      'importVaultWithSignature', 
      [ poolAddr, userAddr, signedSigs.get('controllerSig') ]
    );

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Migrating a MakerVault to  Yield series: ${series.displayNameMobile}`, type:'IMPORT_VAULT', series  }
    );
  };

  return {

    /* exported import Proxy fns */
    importPosition,
    importVault,

  } as const;
};
