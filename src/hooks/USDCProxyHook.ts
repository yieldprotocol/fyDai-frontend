import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { MAX_INT, cleanValue, genTxCode  } from '../utils';
import { calculateSlippage } from '../utils/yieldMath';

import { ISignListItem, IYieldSeries } from '../types';

import USDCProxy from '../contracts/USDCProxy.json';
import Controller from '../contracts/Controller.json';
import DssPsm from '../contracts/DssPsm.json';


import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useToken } from './tokenHook';
import { useSigning } from './signingHook';
import { useDsProxy } from './dsProxyHook';
import { useController } from './controllerHook';

/**
 * Hook for interacting with the Yield Proxy Contract.
 * 
 * @returns { function } postEth
 * @returns { function } withdrawEth
 * @returns { function } borrowDai
 * @returns { function } repayDaiDebt
 * @returns { function } buyDai
 * @returns { function } sellDai
 * 
 */
export const useUSDCProxy = () => {

  /* contexts */
  const { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const { state: userState }  = useContext<any>(UserContext);
  const { preferences: { slippage }, authorization: { dsProxyAddress, hasDelegatedDsProxy } } = userState; 

  /* hooks */ 
  const { signer, fallbackProvider, account } = useSignerAccount();
  const { previewPoolTx, addPoolDelegate, checkPoolDelegate } = usePool();
  const { approveToken, getTokenAllowance } = useToken();
  const { addControllerDelegate } = useController();

  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, ERC2612PermitSignature, handleSignList } = useSigning();
  
  const { abi: USDCProxyAbi } = USDCProxy;
  const { abi: controllerAbi } = Controller;
  const { abi: psmAbi } = DssPsm;

  /* Preset the USDCProxy and controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  const [ psmContract, setPsmContract ] = useState<any>();

  useEffect(()=> {
    deployedContracts?.USDCProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.USDCProxy), 
      USDCProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setPsmContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.DssPsm), 
      psmAbi,
      fallbackProvider
    ));

  }, [ signer, deployedContracts ]);


  /**
   * @dev Borrow fyDai from Controller and sell it immediately for Dai, for a maximum fyDai debt.
   * Must have approved the operator with `controller.addDelegate(controllerDai.address)`.
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} daiToBorrow Exact amount of Dai that should be obtained.
   * 
   * @return Amount of fyDai that will be taken from `from` wallet
   *
   */
  const borrowUSDC = async (
    series:IYieldSeries,
    collateralType: string,
    USDCToBorrow: number,
  ) => {

    /* Parse/clean the inputs */
    const usdc = ethers.utils.parseEther(USDCToBorrow.toString());
    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();
    const collatType = ethers.utils.formatBytes32String(collateralType);

    /* get estimated maxFYDai */
    let maxFYDai:string;
    const preview = await previewPoolTx('buyDai', series, USDCToBorrow); 
    if ( !(preview instanceof Error) ) {
      maxFYDai = calculateSlippage(preview, slippage);
    } else {
      throw(preview);
    }

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('BORROW', series?.maturity.toString()));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    /* if ALL sigs are '0x' set noSigsReqd */
    const noSigsReqd = Array.from(signedSigs.values()).every(item => item === '0x');

    /* construct the calldata from method and reqd. args */
    const calldata = noSigsReqd ? 
      proxyContract.interface.encodeFunctionData( 
        'borrowUSDCForMaximumFYDai', 
        [ poolAddr, collatType, parsedMaturity, toAddr, usdc, maxFYDai ]
      ) :
      proxyContract.interface.encodeFunctionData( 
        'borrowUSDCForMaximumFYDaiWithSignature', 
        [ poolAddr, collatType, parsedMaturity, toAddr, usdc, maxFYDai, signedSigs.get('controllerSig') ]
      );
    
    /* set the gas limits based on whether sigs are required */
    const overrides = noSigsReqd ? { gasLimit: BigNumber.from('500000'), value:0 } :{ gasLimit: BigNumber.from('500000'), value:0 };

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { 
        tx: null, 
        msg: `Borrowing ${USDCToBorrow} USDC from ${series.displayNameMobile}`, 
        type:'BORROW', 
        series, 
        value: usdc.toString() 
      }
    );
  };

  /**
   * @dev Repay an amount of fyDai debt in Controller using a given amount of Dai exchanged for fyDai at pool rates, with a minimum of fyDai debt required to be paid.
   * Post maturity the user is asked for a signature allowing the treasury access to dai
   * 
   * @param {IYieldSeries} series the yield series to interact with.
   * @param {string} collateralType type of collateral eg. 'ETH-A'
   * @param {number} repaymentInDai Exact amount of Dai that should be spent on the repayment.
   * 
   * @return Amount 
   *
   */
  const repayUSDCDebt = async (
    series: IYieldSeries,
    collateralType: string,
    repaymentInUSDC: number,
  ) => {

    const usdc = ethers.utils.parseEther(repaymentInUSDC.toString());   
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });
 
    // USDC User to treasury > no ds proxy 
    requestedSigs.set('USDCSig',
      { id: genTxCode('AUTH_USDC', series?.maturity.toString()),
        desc: 'Allow USDC transfers to the fyDai Treasury',
        conditional: ( await getTokenAllowance(deployedContracts.USDC, 'USDC', deployedContracts.Treasury) ) > 0,
        signFn: () => ERC2612PermitSignature( deployedContracts.USDC, deployedContracts.Treasury),
        fallbackFn: () => approveToken(deployedContracts.USDC, deployedContracts.Treasury, MAX_INT, series),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('REPAY', series?.maturity.toString()));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    /* is ALL sigs are '0x' set noSigsReqd */
    const noSigsReqd = Array.from(signedSigs.values()).every(item => item === '0x');
          
    // repayDaiWithSignature(bytes32 collateral, uint256 maturity, address to, uint256 daiAmount, bytes memory daiSig, bytes memory controllerSig)
    const calldata = proxyContract.interface.encodeFunctionData( 
      'repayUSDCWithSignature', 
      [ collatType, parsedMaturity, toAddr, usdc, signedSigs.get('USDCSig'), signedSigs.get('controllerSig')]
    );

    /* set the gas limits based on whether sigs are required */
    const overrides = noSigsReqd ? { gasLimit: BigNumber.from('350000'), value:0 } :{ gasLimit: BigNumber.from('350000'), value:0 };

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { 
        tx:null, 
        msg: `Repaying ${repaymentInUSDC} USDC to ${series.displayNameMobile}`, 
        type:'REPAY', 
        series,
        value: usdc.toString()
      }
    );

  };

  /**
   * @dev gets the psm rates 
   * @param {string} call 'tout' (default) or 'tin' 
   * @returns { Promise<BigNumber>}  promise > approved or not
   * @note call function
   */
  const checkPsm = async (
    call:string = 'tout'
  ): Promise<BigNumber> => {
    let res;
    try {
      res = call === 'tin' ? await psmContract.tin() : await psmContract.tout();
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  return {

    /* daiProxy eq. fns */
    borrowUSDC,
    repayUSDCDebt,
    checkPsm

  } as const;
};
