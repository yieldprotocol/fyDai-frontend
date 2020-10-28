import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber, Contract }  from 'ethers';
import * as utils from '../utils';

import { IDelegableMessage, IDomain, IYieldSeries } from '../types';

import PoolProxy from '../contracts/PoolProxy.json';
import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';

import { TxContext } from '../contexts/TxContext';
import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useTxHelpers } from './txHooks';
import { useController } from './controllerHook';

const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];
const createTypedDelegableData = (message: IDelegableMessage, domain: IDomain) => {
  const typedData = {
    types: {
      EIP712Domain,
      Signature: [
        { name: 'user', type: 'address' },
        { name: 'delegate', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Signature',
    domain,
    message,
  };
  return JSON.stringify(typedData);
};

/**
 * Hook for interacting with the Temporary/ Alternate Yield Proxy Contract.
 * 
 * @returns { function } removeLiquidity
 * @returns { boolean } removeLiquidityActive
 * 
 */

export const useTempProxy = () => {

  /* hooks */ 
  const { signer, provider, account, chainId } = useSignerAccount();
  const fromAddr = account && ethers.utils.getAddress(account);

  const { previewPoolTx, addPoolDelegate } = usePool();
  const { addControllerDelegate } = useController();
  const { handleTx, handleTxRejectError } = useTxHelpers();

  /* contexts */
  const  { dispatch }  = useContext<any>(TxContext);
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: { authorizations, preferences: { useTxApproval } } }  = useContext<any>(UserContext);

  const { abi: tempProxyAbi } = PoolProxy;

  /* Temporary signing messages */
  const auths = new Map([
    [1, { id: 1, desc:'Authorize Yield proxy to use interact with Dai' }],
    [2, { id: 2, desc:'Authorize Yield Series to move your fyDai tokens to repay Dai debt.' }],
  ]);

  const handleSignError = (e:any) =>{
    // eslint-disable-next-line no-console
    console.log(e);
    dispatch({ type: 'requestSigs', payload:[] });
  };

  const sendForSig = (_provider: any, method: string, params?: any[]) => new Promise<any>((resolve, reject) => {
    const payload = {
      method,
      params, 
      from: fromAddr,   
    };
    const callback = (err: any, result: any) => {
      if (err) {
        reject(err);
      } else if (result.error) {
        reject(result.error);
      } else {
        resolve(result.result);
      }
    };
    _provider.sendAsync( payload, callback );
  });

  const delegationSignature = async (delegationContract:any, delegateAddr:string ) => {
    const _nonce = await delegationContract.signatureCount(fromAddr) ;
    const msg: IDelegableMessage = {
      // @ts-ignore
      user: fromAddr,
      delegate: delegateAddr,
      nonce: _nonce.toHexString(),
      deadline: MAX_INT,
    };
    const domain: IDomain = {
      name: 'Yield',
      version: '1',
      chainId: chainId || 1,
      verifyingContract: delegationContract.address,
    };
    return sendForSig(
      provider.provider, 
      'eth_signTypedData_v4', 
      [fromAddr, createTypedDelegableData(msg, domain)],
    );
  };

  /* Preset the poolProxy contract to be used with all fns */
  const [ tempProxyContract, setTempProxyContract] = useState<any>();
  useEffect(()=>{
    deployedContracts?.PoolProxy && signer &&
    setTempProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.PoolProxy), 
      tempProxyAbi,
      signer
    ));
  }, [signer, deployedContracts, tempProxyAbi ]);


  /**
   * LIQUIDITY REMOVAL
   */

  /**
   * @dev removes liquidity from a pool
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} tokens amount of tokens to remove. 
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidityWithSignature = async (
    // removeLiquidityEarly(address from, uint256 poolTokens, uint256 DaiLimit)
    // removeLiquidityMature(address from, uint256 poolTokens)
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {
    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());
    const overrides = { 
      gasLimit: BigNumber.from('600000')
    };
  
    const fallback = useTxApproval;
    
    if (!fallback ) {

      let controllerSig: any = '0x'; 
      let poolSig: any = '0x';

      dispatch({ type: 'requestSigs', payload:[ auths.get(1), auths.get(2) ] });

      /* Deal wth the signtures */ 
      try {

        console.log(authorizations.hasDelegatedAltProxy, series.hasPoolDelegatedAltProxy );

        /* AltProxy | Controller delegation if required */ 
        const controllerContract = new ethers.Contract( deployedContracts.Controller, Controller.abi, provider);
        controllerSig = !authorizations.hasDelegatedAltProxy? await delegationSignature( controllerContract, deployedContracts.PoolProxy) : '0x';
        dispatch({ type: 'signed', payload: auths.get(1) });

        /* altProxy | pool delegation */
        const poolContract = new ethers.Contract( poolAddr, Pool.abi, provider);
        poolSig = !series.hasPoolDelegatedAltProxy? await delegationSignature( poolContract, deployedContracts.PoolProxy): '0x';
        dispatch({ type: 'signed', payload: auths.get(2) });

      } catch (e) {
      /* If there is a problem with the signing, use the approve txs as a fallback, but ignore if error code 4001 (user reject) */
        if ( e.code !== 4001 ) {
          handleSignError(e);
          // eslint-disable-next-line no-console
          console.log('Fallback to approval transactions');
          await fallbackRemoveLiquididty(series, tokens);
          return;
        }
        handleSignError(e);
        return;
      }

      /* Contract interaction */
      let tx:any;
      // let minDai:BigNumber;
      let minFYDai:BigNumber;

      try {
        if ( !series.isMature() ) {

          // eslint-disable-next-line no-console
          console.log('Removing liquidity BEFORE maturity with signature');

          /* calculate expected trade values  */      
          const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
          if ( !(preview instanceof Error) ) {
            minFYDai = utils.divRay( preview.mul(BigNumber.from('1000000000')), utils.toRay(1.1));
          } else {
            throw(preview);
          }
          tx = await tempProxyContract.removeLiquidityEarlyDaiFixedWithSignature(
            poolAddr, 
            parsedTokens, 
            minFYDai,
            controllerSig,
            poolSig,
            overrides );

        } else {
          // eslint-disable-next-line no-console
          console.log('Removing liquidity AFTER maturity with signature ');
          tx = await tempProxyContract.removeLiquidityMatureWithSignature(
            poolAddr, 
            parsedTokens,
            controllerSig,
            poolSig,
            { gasLimit: BigNumber.from('500000') } );
        }
      } catch (e) {
        handleTxRejectError(e);
        return;
      }
      await handleTx({ tx, msg: `Removing ${tokens} DAI liquidity from ${series.displayNameMobile}`, type:'REMOVE_LIQUIDITY', series });
    } else {
      handleSignError('Fallback to approval transactions');
      await fallbackRemoveLiquididty(series, tokens);
    }
  };


  /* or, if the user is using the fallback approval transactions  */ 

  const fallbackRemoveLiquididty = async (
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {

    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());

    const overrides = { 
      gasLimit: BigNumber.from('600000')
    };

    try {

      await Promise.all([
        !authorizations.delegatedAltProxy ? addControllerDelegate(deployedContracts.PoolProxy): null,
        !series.hasPoolDelegatedAltProxy ? addPoolDelegate(series, deployedContracts.PoolProxy): null, 
      ]).then((s)=>console.log(s));

      let tx:any;
      // let minDai:BigNumber;
      let minFYDai:BigNumber;

      if ( !series.isMature() ) {

        // eslint-disable-next-line no-console
        console.log('Removing liquidity BEFORE maturity "with signature" FALLBACK to approval txs');

        /* calculate expected trade values  */      
        const preview = await previewPoolTx('buydai', series, ethers.utils.parseEther('1'));   
        if ( !(preview instanceof Error) ) {
          minFYDai = utils.divRay( preview.mul(BigNumber.from('1000000000')), utils.toRay(1.1));
        } else {
          throw(preview);
        }     
        tx = await tempProxyContract.removeLiquidityEarlyDaiFixedWithSignature(
          poolAddr, 
          parsedTokens, 
          minFYDai,
          '0x',
          '0x',
          overrides );
      } else {

        // eslint-disable-next-line no-console
        console.log('Removing liquidity AFTER maturity "with signature" FALLBACK to approval txs');
        
        tx = await tempProxyContract.removeLiquidityMatureWithSignature(
          poolAddr, 
          parsedTokens, 
          '0x',
          '0x',
          { gasLimit: BigNumber.from('500000') } );
      }

      await handleTx({ tx, msg: `Removing ${tokens} DAI liquidity from ${series.displayNameMobile}`, type:'REMOVE_LIQUIDITY', series });

    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
           
    }
  };

  return {   
    /* liquidityProxy eq. fns */
    removeLiquidityWithSignature

  } as const;
};