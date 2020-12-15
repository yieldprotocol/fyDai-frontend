import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { ISignListItem, IYieldSeries } from '../types';

import ExportProxy from '../contracts/ExportProxy.json';
import ExportCdpProxy from '../contracts/ExportCdpProxy.json';
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
export const useExportProxy = () => {

  /* contexts */
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { authorization: { hasDelegatedDsProxy } } }  = useContext<any>(UserContext);

  /* hooks */ 
  const { account, signer } = useSignerAccount();
  const { addControllerDelegate, checkControllerDelegate } = useController();
  const { proxyExecute } = useDsProxy();
  const { delegationSignature, handleSignList } = useSigning();

  const { abi: exportProxyAbi } = ExportProxy;
  const { abi: exportCdpProxyAbi } = ExportCdpProxy;
  const { abi: controllerAbi } = Controller;

  /* Preset the importProxy and controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ cdpProxyContract, setCdpProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  
  useEffect(()=>{
    deployedContracts?.ExportProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.ExportProxy), 
      exportProxyAbi,
      signer
    ));
    deployedContracts?.ExportCdpProxy && signer &&
    setCdpProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.ExportCdpProxy), 
      exportCdpProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
  }, [signer, deployedContracts]);

  /**
   * @dev Transfer debt and collateral from Yield to MakerDAO
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {string|BigNumber} wethAmount Weth collateral to import
   * @param {string|BigNumber} fyDaiAmount Normalized debt to move ndai * rate = dai
   * @note if BigNumber is used make sure it is already in WEI
   */
  const exportPosition = async (
    series:IYieldSeries,
    wethAmount:string|BigNumber,
    fyDaiAmount:string|BigNumber,
    cdpId:number,
    viaCdpMan: boolean=true,
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedWeth = BigNumber.isBigNumber(wethAmount)? wethAmount : ethers.utils.parseEther(utils.cleanValue(wethAmount));
    const parsedFyDai = BigNumber.isBigNumber(fyDaiAmount)? fyDaiAmount : ethers.utils.parseEther(utils.cleanValue(fyDaiAmount));
    const userAddr = account && ethers.utils.getAddress(account);

    const overrides = {
      gasLimit: BigNumber.from('1000000'),
      value: ethers.utils.parseEther('0')
    };

    /* Check the signature requirements */
    const checkSigs = await proxyContract.exportPositionCheck();
    console.log(checkSigs);

    const maxFyDaiPrice = BigNumber.from('1');

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    
    if (viaCdpMan === false) {
      requestedSigs.set('controllerSig',
        { id: genTxCode('AUTH_CONTROLLER', null),
          desc: 'Allow your proxy to interact with your collateralized positions',
          conditional:  await checkControllerDelegate(proxyContract.address), 
          signFn: () => delegationSignature(controllerContract, proxyContract.address),    
          fallbackFn: () => addControllerDelegate(proxyContract.address),
        });
    }

    if (viaCdpMan === true) {
      requestedSigs.set('controllerSig',
        { id: genTxCode('AUTH_CONTROLLER', null),
          desc: 'Allow your proxy to interact with your collateralized positions',
          conditional:  await checkControllerDelegate(cdpProxyContract.address), 
          signFn: () => delegationSignature(controllerContract, cdpProxyContract.address),    
          fallbackFn: () => addControllerDelegate(cdpProxyContract.address),
        });
    }

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('EXPORT_POSITION', series));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    
    console.log(poolAddr, cdpId, parsedWeth, parsedFyDai, maxFyDaiPrice, signedSigs.get('controllerSig'));
    /* 
    contract fn used: 
    exportPositionWithSignature(IPool pool, uint256 wethAmount, uint256 fyDaiAmount, uint256 maxFYDaiPrice, bytes memory controllerSig)
    exportCdpPositionWithSignature(IPool pool, uint256 cdp, uint256 wethAmount, uint256 fyDaiAmount, uint256 maxFYDaiPrice, bytes memory controllerSig)
    */
    const calldata = viaCdpMan ? 
      cdpProxyContract.interface.encodeFunctionData(
        'exportCdpPositionWithSignature', 
        [ poolAddr, cdpId.toString(), parsedWeth, parsedFyDai, maxFyDaiPrice, signedSigs.get('controllerSig') ]
      ) :
      proxyContract.interface.encodeFunctionData(
        'exportPositionWithSignature', 
        [ poolAddr, parsedWeth, parsedFyDai, maxFyDaiPrice, signedSigs.get('controllerSig') ]
      );

    /* send to the proxy for execution */
    await proxyExecute( 
      viaCdpMan? cdpProxyContract.address : proxyContract.address, 
      calldata,
      overrides,
      { tx:null, msg: `Exporting Yield Vault of ${parsedFyDai} Debt to MakerDao`, type:'EXPORT_POSITION', series  }
    );
  };

  return {

    /* exported import Proxy fns */
    exportPosition,

  } as const;
};
