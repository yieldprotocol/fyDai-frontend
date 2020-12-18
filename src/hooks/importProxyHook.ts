import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { ISignListItem, IYieldSeries } from '../types';

import ImportProxy from '../contracts/ImportProxy.json';
import ImportCdpProxy from '../contracts/ImportCdpProxy.json';


import Controller from '../contracts/Controller.json';

import Vat from '../contracts/Vat.json';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { useSigning } from './signingHook';
import { useDsProxy } from './dsProxyHook';
import { useController } from './controllerHook';
import { usePool } from './poolHook';
import { useMaker } from './makerHook';

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
  const { account, signer, fallbackProvider } = useSignerAccount();
  const { addControllerDelegate, checkControllerDelegate } = useController();
  const { proxyExecute } = useDsProxy();
  const { delegationSignature, handleSignList } = useSigning();
  const { previewPoolTx } = usePool();

  const { daiToMakerDebt, minWethForAmount } = useMaker();

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
    daiDebtAmount:string|BigNumber,
    cdpId:number,
    viaCdpMan:boolean=true, /* default to using cdpManager */
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    let parsedWeth = BigNumber.isBigNumber(wethAmount)? wethAmount : ethers.utils.parseEther(wethAmount);
    let parsedDaiDebt = BigNumber.isBigNumber(daiDebtAmount)? daiDebtAmount : ethers.utils.parseEther(daiDebtAmount);
    const userAddr = account && ethers.utils.getAddress(account);

    const overrides = {
      gasLimit: BigNumber.from('1000000'),
      value: ethers.utils.parseEther('0')
    };

    // const makerDebt = await daiToMakerDebt(parsedDaiDebt);

    /* calculate expected max safety values  */  
    let maxDaiPrice:BigNumber;         
    const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
    if ( !(preview instanceof Error) ) {  
      const one = utils.toRay(1);
      const onePointOne = utils.toRay(1.1);
      const rayPrice = preview.mul(BigNumber.from('1000000000'));
      maxDaiPrice = one.add( utils.mulRay(onePointOne, rayPrice.sub(one) ));
      console.log(maxDaiPrice.toString());
    } else {
      throw(preview);
    }

    /* below for testing only - remove for prod */

    const vat = new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts.Vat), 
      Vat.abi,
      fallbackProvider,
    );
    // parsedWeth = ((await vat.urns(ethers.utils.formatBytes32String('ETH-A'), '0x6BAC65a4CA5C1AfcfcDdafd63b1E7C5F51C905eA')).ink) .div(BigNumber.from('6'));
    // parsedDaiDebt = ((await vat.urns(ethers.utils.formatBytes32String('ETH-A'), '0x6BAC65a4CA5C1AfcfcDdafd63b1E7C5F51C905eA')).art) .div(BigNumber.from('6'));
    
    console.log(parsedDaiDebt, ethers.utils.formatEther(parsedDaiDebt));
    console.log(parsedWeth, ethers.utils.formatEther(parsedWeth));

    maxDaiPrice = utils.toRay(2);
    /* above for testing */

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    if (viaCdpMan === true) {
      requestedSigs.set('controllerSig',
        { id: genTxCode('AUTH_CONTROLLER', null),
          desc: 'Allow your proxy to interact with your vault in Maker (CDP Manager)',
          conditional: await checkControllerDelegate(cdpProxyContract.address),  
          signFn: () => delegationSignature(controllerContract, cdpProxyContract.address),    
          fallbackFn: () => addControllerDelegate(cdpProxyContract.address),
        });
    }

    if (viaCdpMan === false) {
      requestedSigs.set('controllerSig',
        { id: genTxCode('AUTH_CONTROLLER', null),
          desc: 'Allow your proxy to interact with your vault in Maker',
          conditional: await checkControllerDelegate(proxyContract.address), 
          signFn: () => delegationSignature(controllerContract, proxyContract.address),    
          fallbackFn: () => addControllerDelegate(proxyContract.address),
        });
    }

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('IMPORT_POSITION', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    
    /* contract fns used:
      importPositionWithSignature(IPool pool, address user, uint256 wethAmount, uint256 debtAmount, uint256 maxDaiPrice, bytes memory controllerSig)
      importCdpPositionWithSignature(IPool pool, uint256 cdp, uint256 wethAmount, uint256 debtAmount, uint256 maxDaiPrice, bytes memory controllerSig) */
    const calldata = viaCdpMan ? 
      cdpProxyContract.interface.encodeFunctionData(
        'importCdpPositionWithSignature', 
        [ poolAddr, cdpId.toString(), parsedWeth, parsedDaiDebt, maxDaiPrice, signedSigs.get('controllerSig') ]
      ) :
      proxyContract.interface.encodeFunctionData(
        'importPositionWithSignature',
        [ poolAddr, userAddr, parsedWeth, parsedDaiDebt, maxDaiPrice, signedSigs.get('controllerSig') ]
      );

    /* send to the proxy for execution */
    await proxyExecute( 
      viaCdpMan ? cdpProxyContract.address: proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Migrating ${utils.cleanValue(daiDebtAmount.toString(), 2)} Debt and ${utils.cleanValue(wethAmount.toString(), 4)} Eth Collateral to ${series.displayNameMobile}`, type:'IMPORT_POSITION', series  }
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
 
    /* calculate expected max safety values */  
    let maxDaiPrice:BigNumber; 
    const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
    if ( !(preview instanceof Error) ) {  
      const one = utils.toRay(1);
      const onePointOne = utils.toRay(1.1);
      const rayPrice = preview.mul(BigNumber.from('1000000000'));
      maxDaiPrice = one.add( utils.mulRay(onePointOne, rayPrice.sub(one) ));
      console.log(maxDaiPrice.toString());
    }  else {
      throw(preview);
    }
    /* for testing only - remove for prod */ 
    maxDaiPrice = utils.toRay(2);

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    if (viaCdpMan === true) {
      requestedSigs.set('controllerSig',
        { id: genTxCode('AUTH_CONTROLLER', null),
          desc: 'Allow your proxy to interact with your collateralized positions',
          conditional: await checkControllerDelegate(cdpProxyContract.address), // skip if any are true
          signFn: () => delegationSignature(controllerContract, cdpProxyContract.address),    
          fallbackFn: () => addControllerDelegate(cdpProxyContract.address),
        });
    }

    if (viaCdpMan === false ) {
      requestedSigs.set('controllerSig',
        { id: genTxCode('AUTH_CONTROLLER', null),
          desc: 'Allow your proxy to interact with your collateralized positions',
          conditional: await checkControllerDelegate(proxyContract.address), // skip if any are true
          conditional: false,
          signFn: () => delegationSignature(controllerContract, proxyContract.address),    
          fallbackFn: () => addControllerDelegate(proxyContract.address),
        });
    }

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('IMPORT_VAULT', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    /*
      contract fn used: 
      importCdpWithSignature(IPool pool, uint256 cdp, uint256 maxDaiPrice, bytes memory controllerSig)
      importVaultWithSignature(IPool pool, address user, uint256 maxDaiPrice, bytes memory controllerSig) 
    */
    console.log(poolAddr, cdpId.toString(), maxDaiPrice, signedSigs.get('controllerSig') );

    const calldata = viaCdpMan ?
      cdpProxyContract.interface.encodeFunctionData( 'importCdpWithSignature', [ poolAddr, cdpId.toString(), maxDaiPrice, signedSigs.get('controllerSig') ] ) :
      proxyContract.interface.encodeFunctionData( 'importVaultWithSignature', [ poolAddr, userAddr, maxDaiPrice, signedSigs.get('controllerSig') ] );

    /* send to the proxy for execution */
    await proxyExecute( 
      viaCdpMan ? cdpProxyContract.address: proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Migrating a MakerVault to Yield series: ${series.displayNameMobile}`, type:'IMPORT_VAULT', series  }
    );
  };

  return {

    /* exported import Proxy fns */
    importPosition,
    importVault,

  } as const;
};
