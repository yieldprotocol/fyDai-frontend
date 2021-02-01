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
import { usePool } from './poolHook';

import { genTxCode } from '../utils';
import { calculateSlippage, floorDecimal, mulDecimal, ONE } from '../utils/yieldMath';

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
  const  { state: { preferences } }  = useContext<any>(UserContext);

  /* hooks */
  const { account, signer } = useSignerAccount();
  const { addControllerDelegate, checkControllerDelegate } = useController();
  const { proxyExecute } = useDsProxy();
  const { delegationSignature, handleSignList } = useSigning();
  const { previewPoolTx } = usePool();

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
    const parsedWeth = BigNumber.isBigNumber(wethAmount)? wethAmount : ethers.utils.parseEther(wethAmount);
    const parsedDaiDebt = BigNumber.isBigNumber(daiDebtAmount)? daiDebtAmount : ethers.utils.parseEther(daiDebtAmount);
    const userAddr = account && ethers.utils.getAddress(account);

    const overrides = {
      gasLimit: BigNumber.from('1000000'),
      value: ethers.utils.parseEther('0')
    };

    /* calculate expected max safety values  */  
    let maxDaiPrice:string;         
    const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
    if ( !(preview instanceof Error) ) {
      
      // 1 + ( 1.1 * ( price - 1 ) )
      const _one = ONE.mul('1e18');
      const diff = preview.sub(_one.toFixed());
      // const adjDiff = mulDecimal( '1.1', diff ); 
      const adjDiff = calculateSlippage(diff, preferences.slippage );
      const daiPriceAsRay = (_one.add(adjDiff)).mul('1000000000'); 
      maxDaiPrice =  floorDecimal( daiPriceAsRay.toFixed() ) ;

    } else {
      throw(preview);
    } 

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
    const signedSigs = await handleSignList(requestedSigs, genTxCode('IMPORT', series?.maturity.toString()));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    
    /* 
      contract fns used:
      importPositionWithSignature(IPool pool, address user, uint256 wethAmount, uint256 debtAmount, uint256 maxDaiPrice, bytes memory controllerSig)
      importCdpPositionWithSignature(IPool pool, uint256 cdp, uint256 wethAmount, uint256 debtAmount, uint256 maxDaiPrice, bytes memory controllerSig) 
    */
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
      { 
        tx:null, 
        msg: `Migrating ${utils.cleanValue(daiDebtAmount.toString(), 2)} Debt and ${utils.cleanValue(wethAmount.toString(), 4)} Eth Collateral to ${series.displayNameMobile}`, 
        type:'IMPORT', 
        series,
        value: parsedDaiDebt.toString()
      }
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
    let maxDaiPrice: string; 
    const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
    if ( !(preview instanceof Error) ) { 

      // 1 + ( 1.1 * ( price - 1 ) )
      const _one = ONE.mul('1e18');
      const diff = preview.sub(_one.toFixed());
      // const adjDiff = mulDecimal( '1.1', diff );
      const adjDiff = calculateSlippage(diff, preferences.slippage );
      const daiPriceAsRay = (_one.add(adjDiff)).mul('1000000000'); 
      maxDaiPrice =  floorDecimal( daiPriceAsRay.toFixed() ) ;

    }  else {
      throw(preview);
    }

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
          signFn: () => delegationSignature(controllerContract, proxyContract.address),    
          fallbackFn: () => addControllerDelegate(proxyContract.address),
        });
    }

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('IMPORT', series?.maturity.toString()));
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
      { 
        tx:null, 
        msg: `Migrating a MakerVault to Yield series: ${series.displayNameMobile}`,
        type:'IMPORT',
        series,
        value: null
      }
    );
  };

  return {

    /* exported import Proxy fns */
    importPosition,
    importVault,

  } as const;
};
