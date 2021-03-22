import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { ISignListItem, IYieldSeries } from '../types';

import { genTxCode, MAX_INT } from '../utils';

import { 
  floorDecimal, 
  splitLiquidity, 
  fyDaiForMint, 
  secondsToFrom, 
  calculateSlippage 
} from '../utils/yieldMath';

import PoolProxy from '../contracts/PoolProxy.json';
import Controller from '../contracts/Controller.json';
import Pool from '../contracts/Pool.json';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useToken } from './tokenHook';
import { useSigning } from './signingHook';
import { useDsProxy } from './dsProxyHook';
import { useController } from './controllerHook';

/**
 * Hook for interacting with the Yield Pool Proxy Contract.
 * 
 * @returns { function } addLiquidity
 * @returns { function } removeLiquidity
 * 
 */
export const usePoolProxy = () => {

  /* contexts */
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const  { state: userState }  = useContext<any>(UserContext);
  const  { authorization: { dsProxyAddress, hasDelegatedDsProxy }, preferences } = userState;

  /* hooks */ 
  const { signer, provider } = useSignerAccount();
  const { previewPoolTx, checkPoolDelegate, addPoolDelegate, getFyDaiReserves } = usePool();
  const { getBalance, approveToken, getTokenAllowance } = useToken();
  const { addControllerDelegate } = useController();
  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, ERC2612PermitSignature, handleSignList } = useSigning();

  const { abi: poolProxyAbi } = PoolProxy;
  const { abi: controllerAbi } = Controller;

  /* Preset the yieldProxy controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  
  useEffect(()=>{
    deployedContracts?.PoolProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.PoolProxy), 
      poolProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
  }, [signer, deployedContracts]);

  /**
   * @dev Add liquidity to a pool 
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} daiUsed amount of Dai to use to mint liquidity.
   * @param {boolean} forceBorrow OPTIONAL: add liquidity strategy ('BUY' or 'BORROW')
   *  
   * @note if BigNumber is used make sure it is in WEI
   */
  const addLiquidity = async (
    series:IYieldSeries,
    daiUsed:number|BigNumber,
    forceBorrow: boolean = true
  ) => {
    
    let addLiquidityStrategy: string = 'BUY'; // BUY (default) or BORROW

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);
    const parsedDaiUsed = BigNumber.isBigNumber(daiUsed)? daiUsed : ethers.utils.parseEther(daiUsed.toString());
    const timeToMaturity = secondsToFrom(series.maturity.toString());

    /* calculate max expected fyDai value and factor in slippage */
    const daiReserves = await getBalance(deployedContracts.Dai, 'Dai', poolAddr);
    const fyDaiRealReserves = await getBalance(series.fyDaiAddress, 'FYDai', poolAddr);
    const fyDaiVirtualReserves = await getFyDaiReserves(poolAddr);
  
    /* calc amount of fydai to mint when using BUY strategy */
    const fyDaiIn = fyDaiForMint(
      daiReserves, 
      fyDaiRealReserves, 
      fyDaiVirtualReserves, 
      calculateSlippage(parsedDaiUsed, '0.03', true), 
      timeToMaturity 
    );

    const [, fyDai_] = splitLiquidity(daiReserves, fyDaiRealReserves, parsedDaiUsed );     

    /* calc maxyFYDai when using BORROW strategy */
    const maxFYDai = floorDecimal( calculateSlippage(fyDai_, preferences.slippage) ); 

    /* check which addLiquidity function to use based on PREFERENCES or POOL LIQUIDITY . defaults to BUY */ 
    if ( !preferences.useBuyToAddLiquidity || forceBorrow ) { 
      addLiquidityStrategy = 'BORROW';
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);
    
    /* Signatures to request if using the BORROW method */
    if (addLiquidityStrategy === 'BORROW') {

      requestedSigs.set('controllerSig',
        { id: genTxCode('AUTH_CONTROLLER', null),
          desc: 'Allow your proxy to interact with your collateralized positions',
          conditional: hasDelegatedDsProxy,
          signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
          fallbackFn: () => addControllerDelegate(dsProxyAddress),
        });
      // dsProxy must be spender of Dai
      requestedSigs.set('daiSig',
        { id: genTxCode('AUTH_DAI', series?.maturity.toString()),
          desc: 'Allow transfers of Dai to your Proxy',
          conditional: (await getTokenAllowance(deployedContracts.Dai, 'Dai', dsProxyAddress)) > 0,
          signFn: () => daiPermitSignature(deployedContracts.Dai, dsProxyAddress), 
          fallbackFn: () => approveToken(deployedContracts.Dai, dsProxyAddress, MAX_INT, series), // executed as user!
        });
    }

    /* Signatures to request if using the BUY method */
    if (addLiquidityStrategy === 'BUY') {

      // pool must be spender of Dai 
      requestedSigs.set('daiSig',
        { id: genTxCode('AUTH_DAI', series?.maturity.toString()),
          desc: 'Allow transfers of Dai to your Proxy',
          conditional: (await getTokenAllowance(deployedContracts.Dai, 'Dai', poolAddr)) > 0,
          signFn: () => daiPermitSignature(deployedContracts.Dai, poolAddr), 
          fallbackFn: () => approveToken(deployedContracts.Dai, poolAddr, MAX_INT, series), // executed as user!
        });

      // pool must be spender of fyDai 
      requestedSigs.set('fyDaiSig',
        { id: genTxCode('AUTH_FYDAI', series?.maturity.toString()),
          desc: `Allow fyDai transfers to the ${series.displayName} pool`,
          conditional: ( await getTokenAllowance(series?.fyDaiAddress, 'FYDai', poolAddr) ) > 0,
          signFn: () => ERC2612PermitSignature(series?.fyDaiAddress, poolAddr),    
          fallbackFn: () => approveToken(series?.fyDaiAddress, poolAddr, MAX_INT, series ), 
        });

      // dsProxy must be spender of Pool (ONLY IF USING BUY METHOD)
      requestedSigs.set('poolSig',
        { id: genTxCode('AUTH_POOL', series?.maturity.toString()),
          desc: `Allow your proxy to interact with the ${series.displayName} pool`,
          conditional: await checkPoolDelegate(poolAddr, dsProxyAddress),
          signFn: () => delegationSignature(poolContract, dsProxyAddress),    
          fallbackFn: () => addPoolDelegate(series, dsProxyAddress), 
        });
    }
  
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('ADD_LIQUIDITY', series?.maturity.toString()));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    /* if ALL sigs are '0x' then set noSigsReqd === true */
    const noSigsReqd = Array.from(signedSigs.values()).every(item => item === '0x');

    let calldata;
    let overrides;

    /* Determine which addLiquidity function to use based on AVAILABLE LIQUIDITY, build the call data from that one */ 
    if ( addLiquidityStrategy === 'BUY') { 
      /* BUY strategy with sigs or no sigs */
      calldata = proxyContract.interface.encodeFunctionData( 
        'buyAddLiquidityWithSignature', 
        [ poolAddr, fyDaiIn, parsedDaiUsed, signedSigs.get('daiSig'), signedSigs.get('fyDaiSig'), signedSigs.get('poolSig') ]
      );
      /* set override gas estiamtes based on strategy */
      overrides = noSigsReqd ? { gasLimit: BigNumber.from('400000'), value: 0 } : { gasLimit: BigNumber.from('450000'), value: 0 };

    } else {
      /* BORROW strategy with sigs or no sigs */
      calldata = proxyContract.interface.encodeFunctionData( 
        'addLiquidityWithSignature', 
        [ poolAddr, parsedDaiUsed, maxFYDai, signedSigs.get('daiSig'), signedSigs.get('controllerSig') ]
      );
      /* set override gas estiamtes based on strategy */
      overrides = { gasLimit: BigNumber.from('650000'), value: 0 };
    }

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { 
        tx:null, 
        msg: `Adding ${daiUsed} DAI liquidity to ${series.displayNameMobile}`, 
        type:'ADD_LIQUIDITY', 
        series, 
        value: parsedDaiUsed.toString()  
      }
    );

  };

  /**
   * @dev removes liquidity from a pool - redirects to removal with/without signature
   * 
   * @param {IYieldSeries} series series to act on.
   * @param {number|BigNumber} tokens amount of tokens to remove. 
   * 
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidity = async (
    series: IYieldSeries,  
    tokens: number|BigNumber,
  ) => {

    /* Processing and sanitizing input */
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const poolContract = new ethers.Contract( poolAddr, Pool.abi as any, provider);
    const parsedTokens = BigNumber.isBigNumber(tokens)? tokens : ethers.utils.parseEther(tokens.toString());

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });
        
    requestedSigs.set('poolSig',
      { id: genTxCode('AUTH_POOL', series?.maturity.toString()),
        desc: `Allow your proxy to interact with the ${series.displayName} pool`,
        conditional: await checkPoolDelegate(poolAddr, dsProxyAddress),
        signFn: () => delegationSignature(poolContract, dsProxyAddress),    
        fallbackFn: () => addPoolDelegate(series, dsProxyAddress), 
      });
    
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('REMOVE_LIQUIDITY', series?.maturity.toString()));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    /* is ALL sigs are '0x' set noSigsReqd */
    const noSigsReqd = Array.from(signedSigs.values()).every(item => item === '0x');
 
    let calldata:any;
    let overrides:any;

    /* Build the call data based, removeLiquidity function is dependant on SERIES MATURITY */
    if (!series.isMature()) {

      /* calculate expected trade values  */ 
      let minFYDaiPrice:string | BigNumber;
      const preview = await previewPoolTx('sellFYDai', series, ethers.utils.parseEther('1'));
      if ( !(preview instanceof Error) ) {
        minFYDaiPrice = calculateSlippage( preview.toString(), preferences.slippage, true);
      } else {
        throw(preview);
      }

      /* construct the calldata. Fn selection Based on current authorization status */
      calldata = proxyContract.interface.encodeFunctionData( 
        'removeLiquidityEarlyDaiFixedWithSignature', 
        [ poolAddr, parsedTokens, minFYDaiPrice, signedSigs.get('controllerSig'), signedSigs.get('poolSig') ]
      );

      /* set the gas limits based on whether sigs are required */
      overrides = noSigsReqd ? { gasLimit: BigNumber.from('650000'), value:0 } :{ gasLimit: BigNumber.from('800000'), value:0 };
    
    } else {

      /* construct the calldata. Fn selection Based on current authorization status */
      calldata = proxyContract.interface.encodeFunctionData( 
        'removeLiquidityMatureWithSignature', 
        [ poolAddr, parsedTokens, signedSigs.get('controllerSig'), signedSigs.get('poolSig') ]
      );

      /* set the gas limits based on whether sigs are required */
      overrides = { gasLimit: BigNumber.from('750000'), value:0 };

    }

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { 
        tx:null, 
        msg: `Removing ${tokens} liquidity tokens from ${series.displayNameMobile}`, 
        type:'REMOVE_LIQUIDITY', 
        series, 
        value: parsedTokens.toString()  
      }
    );

  };
  
  return {
    /* exported liquidity pool fns */
    addLiquidity,
    removeLiquidity,

  } as const;
};
