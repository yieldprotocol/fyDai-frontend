import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { MAX_INT, cleanValue, genTxCode, ONE  } from '../utils';
import { calculateSlippage, psmDaiOut } from '../utils/yieldMath';

import { IDomain, ISignListItem, IYieldSeries } from '../types';

import USDCProxy from '../contracts/USDCProxy.json';
import Controller from '../contracts/Controller.json';
import DssPsm from '../contracts/DssPsm.json';
import USDC from '../contracts/USDC.json';

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
  const { signer, fallbackProvider, account, chainId } = useSignerAccount();
  const { previewPoolTx, addPoolDelegate, checkPoolDelegate } = usePool();
  const { approveToken, getTokenAllowance } = useToken();
  const { addControllerDelegate } = useController();

  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, ERC2612PermitSignature, handleSignList } = useSigning();
  
  const { abi: USDCProxyAbi } = USDCProxy;
  const { abi: controllerAbi } = Controller;
  const { abi: psmAbi } = DssPsm;
  const { abi: usdcAbi } = USDC;

  /* Preset the USDCProxy and controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  const [ psmContract, setPsmContract ] = useState<any>();
  const [ USDCContract, setUSDCContract ] = useState<any>();

  useEffect(()=> {
    deployedContracts?.USDCProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.USDCProxy), 
      USDCProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && 
    setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
    deployedContracts?.Controller && 
    setPsmContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.DssPsm), 
      psmAbi,
      fallbackProvider
    ));

    deployedContracts?.Controller && 
    setUSDCContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.USDC), 
      usdcAbi,
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
    USDCToBorrow: number | BigNumber, // NB if BigNumber - it must be in MWEI  (6decimals)
  ) => {

    /* Parse/clean the inputs */
    const usdc = BigNumber.isBigNumber(USDCToBorrow) ? 
      USDCToBorrow : 
      ethers.utils.parseUnits( USDCToBorrow.toString(), 'mwei' ); 

    const poolAddr = ethers.utils.getAddress(series.poolAddress);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();
    const collatType = ethers.utils.formatBytes32String(collateralType);

    /* calc amount of dai from the input */
    const tout = await checkPsm(); // in WAD
    const inputAsWad_ = ethers.utils.parseEther(USDCToBorrow.toString());
    const valueInDai = (inputAsWad_.mul(tout).div(ONE)).add(inputAsWad_);

    /* get estimated maxFYDai */
    let maxFYDai:string;
    const preview = await previewPoolTx('buyDai', series, valueInDai); 
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
    
    // requestedSigs.set('daiSig',
    //   { id: genTxCode('AUTH_DAI', series?.maturity.toString()),
    //     desc: 'Allow Dai transfers to the maker PSM',
    //     conditional: await getTokenAllowance(deployedContracts.Dai, 'Dai', deployedContracts?.DssPsm) > 0,
    //     signFn: () => daiPermitSignature(deployedContracts.Dai, deployedContracts?.DssPsm),
    //     fallbackFn: () => approveToken(deployedContracts.Dai, deployedContracts?.DssPsm, MAX_INT, series), 
    //   });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('BORROW_USDC', series?.maturity.toString()));
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
    const overrides = noSigsReqd ? { gasLimit: BigNumber.from('1000000'), value:0 } :{ gasLimit: BigNumber.from('1000000'), value:0 };

    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { 
        tx: null, 
        msg: `Borrowing ${USDCToBorrow} USDC from ${series.displayNameMobile}`, 
        type:'BORROW_USDC', 
        series, 
        value: usdc.toString() 
      }
    );
  };

  /**
   * @dev Repay an amount of fyDai debt in Controller using a given amount of USDC exchanged for fyDai at pool rates, with a minimum of fyDai debt required to be paid.
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

    const usdc = ethers.utils.parseUnits(repaymentInUSDC.toString(), 'mwei'); 
    const usdcWad = ethers.utils.parseEther(repaymentInUSDC.toString());  
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const toAddr = account && ethers.utils.getAddress(account);
    const parsedMaturity = series.maturity.toString();
    const poolAddr = ethers.utils.getAddress(series.poolAddress);

    /* get the dai value of the usdc to be repayed */
    const daiValueOfUsdc = BigNumber.from( psmDaiOut( usdcWad, await checkPsm('tin') ) ) ;

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: hasDelegatedDsProxy,
        signFn: () => delegationSignature(controllerContract, dsProxyAddress),    
        fallbackFn: () => addControllerDelegate(dsProxyAddress),
      });

    /* we have to build a USDC custom daomin - because of USDC Versioning '2' */
    const buildUSDCDomain = async () : Promise<IDomain> => {
      // TODO use:  await USDCContract.DOMAIN_SEPARATOR();
      return {
        name: await USDCContract.name(),
        version: '2',
        chainId: chainId || 1,
        verifyingContract: deployedContracts.USDC,
      };
    };

    // USDC User to treasury 
    requestedSigs.set('USDCSig',
      { id: genTxCode('AUTH_USDC', series?.maturity.toString()),
        desc: 'Allow USDC transfers',
        conditional: ( await getTokenAllowance(deployedContracts.USDC, 'USDC', deployedContracts.USDCProxy) ) > 0,
        signFn: async () => ERC2612PermitSignature(deployedContracts.USDC, deployedContracts.USDCProxy, await buildUSDCDomain()),
        // signFn: async () => ERC2612PermitSignature(deployedContracts.USDC, deployedContracts.USDCProxy, await USDCContract.DOMAIN_SEPARATOR() ),
        fallbackFn: () => approveToken(deployedContracts.USDC, deployedContracts.USDCProxy, MAX_INT, series),
      });

    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('REPAY_USDC', series?.maturity.toString()));
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    /* is ALL sigs are '0x' set noSigsReqd */
    const noSigsReqd = Array.from(signedSigs.values()).every(item => item === '0x');
          
    let calldata:any;

    /* get estimated minimumFYDai */
    // let minFyDaiRepay :string;
    const getMinFyDaiRepay = async () : Promise<string> => {
      const buyDaiPreview = await previewPoolTx( 'buyDai', series, daiValueOfUsdc );  // gets the amount of fydai for daiAmnt
      if ( !(buyDaiPreview instanceof Error) ) {
        return calculateSlippage(buyDaiPreview, slippage, true );
      } 
      throw(buyDaiPreview);
    };

    /* get estimated maxUSDC */
    const getMaxUSDC = async () : Promise<string> => {
      return MAX_INT;
    };

    /* fn select Function options: series mature  > fyDaiDebt more than requested? > sigs reqd? */

    /* Repay SOME early */
    !series.isMature() &&  
    daiValueOfUsdc.lt(series.ethDebtDai!) && 

    ( calldata = noSigsReqd ? 
      proxyContract.interface.encodeFunctionData(
        'repayDebtEarly', 
        [ poolAddr, collatType, parsedMaturity, toAddr, usdc, await getMinFyDaiRepay() ] 
      ) :
      proxyContract.interface.encodeFunctionData(
        'repayDebtEarlyWithSignature', 
        [ poolAddr, collatType, parsedMaturity, toAddr, usdc, await getMinFyDaiRepay(), signedSigs.get('USDCSig'), signedSigs.get('controllerSig')] 
      )  
    );

    /* Repay ALL early */
    !series.isMature() && 
    daiValueOfUsdc.gte(series.ethDebtDai!) && 

    ( calldata = noSigsReqd ? 
      proxyContract.interface.encodeFunctionData(
        'repayAllEarly', 
        [ poolAddr, collatType, parsedMaturity, toAddr, await getMaxUSDC() ] 
      ) :
      proxyContract.interface.encodeFunctionData(
        'repayAllEarlyWithSignature', 
        [ poolAddr, collatType, parsedMaturity, toAddr, await getMaxUSDC(), signedSigs.get('USDCSig'), signedSigs.get('controllerSig')] 
      )  
    );

    /* Repay SOME if series is mature */
    series.isMature() && 
    daiValueOfUsdc.lt(series.ethDebtDai!) &&

    ( calldata = noSigsReqd ? 
      proxyContract.interface.encodeFunctionData(
        'repayDebtMature', 
        [ collatType, parsedMaturity, toAddr, usdc ] 
      ) :
      proxyContract.interface.encodeFunctionData(
        'repayDebtMatureWithSignature', 
        [ collatType, parsedMaturity, toAddr, usdc, signedSigs.get('USDCSig'), signedSigs.get('controllerSig')] 
      )
    );

    /* Repay ALL if series is mature */
    series.isMature() && 
    daiValueOfUsdc.gte(series.ethDebtDai!) && 

    ( calldata = noSigsReqd ? 
      proxyContract.interface.encodeFunctionData(
        'repayAllMature', 
        [ collatType, parsedMaturity, toAddr ] 
      ) :
      proxyContract.interface.encodeFunctionData(
        'repayAllMatureSignature', 
        [ collatType, parsedMaturity, toAddr, signedSigs.get('USDCSig'), signedSigs.get('controllerSig')] 
      )  
    );

    /* Set the gas limits based on whether sigs are required */
    const overrides = noSigsReqd ? { gasLimit: BigNumber.from('350000'), value:0 } :{ gasLimit: BigNumber.from('350000'), value:0 };

    /* Send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { 
        tx:null, 
        msg: `Repaying ${repaymentInUSDC} USDC to ${series.displayNameMobile}`, 
        type:'REPAY_USDC', 
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
