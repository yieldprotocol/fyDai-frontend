import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import { genTxCode, cleanValue } from '../utils';
import { calculateSlippage } from '../utils/yieldMath';

import { ISignListItem, IYieldSeries } from '../types';

import Controller from '../contracts/Controller.json';
import RollProxy from '../contracts/RollProxy.json';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useTxHelpers } from './txHooks';
import { useSigning } from './signingHook';

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
export const useRollProxy = () => {

  /* contexts */
  const { state: { deployedContracts } }  = useContext<any>(YieldContext);
  const { state: userState }  = useContext<any>(UserContext);
  const { preferences: { slippage } } = userState; 

  /* hooks */ 
  const { signer, account } = useSignerAccount();
  const { previewPoolTx } = usePool();
  const { addControllerDelegate } = useController();

  const { handleTx, handleTxRejectError } = useTxHelpers();
  
  const { delegationSignature, handleSignList } = useSigning();
  
  const { abi: controllerAbi } = Controller;
  const { abi: rollProxyAbi } = RollProxy;

  /* Preset the yieldProxy and controller contracts to be used with all fns */
  const [ proxyContract, setProxyContract] = useState<any>();
  const [ controllerContract, setControllerContract ] = useState<any>();
  useEffect(()=> {
    deployedContracts?.RollProxy && signer &&
    setProxyContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.RollProxy), 
      rollProxyAbi,
      signer
    ));
    deployedContracts?.Controller && signer && setControllerContract( new ethers.Contract( 
      ethers.utils.getAddress(deployedContracts?.Controller), 
      controllerAbi,
      signer
    ));
  }, [ signer, deployedContracts ]);


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
  const rollDebt = async (

    seriesFrom: IYieldSeries,
    seriesTo: IYieldSeries,
    rollAmount: BigNumber | string,
    collateralType: string,

  ) => {

    const parsedAmount = BigNumber.isBigNumber(rollAmount)? rollAmount : ethers.utils.parseEther(cleanValue(rollAmount));
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const poolFrom = ethers.utils.getAddress(seriesFrom.poolAddress);
    const poolTo = ethers.utils.getAddress(seriesTo.poolAddress);
    const acc = account && ethers.utils.getAddress(account);

    /* build and use signature if required , else '0x' */
    const requestedSigs:Map<string, ISignListItem> = new Map([]);

    requestedSigs.set('controllerSig',
      { id: genTxCode('AUTH_CONTROLLER', null),
        desc: 'Allow your proxy to interact with your collateralized positions',
        conditional: await controllerContract.delegated(account, deployedContracts.RollProxy),
        signFn: () => delegationSignature(controllerContract, deployedContracts.RollProxy),    
        fallbackFn: () => addControllerDelegate(deployedContracts.RollProxy),
      });
 
    /* Send the required signatures out for signing, or approval tx if fallback is required */
    const signedSigs = await handleSignList(requestedSigs, genTxCode('ROLL_DEBT', seriesFrom?.maturity.toString()));
    
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }
    /* is ALL sigs are '0x' set noSigsReqd */
    const noSigsReqd = Array.from(signedSigs.values()).every(item => item === '0x');

    const daiToBuy = await proxyContract.daiCostToRepay(collatType, poolFrom, parsedAmount);
    const isRequestMoreThanDebt = seriesFrom.ethDebtDai && parsedAmount.gt(seriesFrom.ethDebtDai); 

    /* calculate expected trade values and factor in slippage */
    let maxFYDaiCost:string;
    const preview = await previewPoolTx('buyDai', seriesTo, daiToBuy);
    if ( !(preview instanceof Error) ) {
      maxFYDaiCost = calculateSlippage(preview, slippage);
    } else {
      throw(preview);
    }

    let tx:any;

    /* fn select options: signature required?  > fyDaiDebt more than requested? > series is mature? */
    try {

      if ( noSigsReqd && isRequestMoreThanDebt)  {
        tx = seriesFrom.isMature() ?
          await proxyContract.rollAllMature(collatType, poolFrom, poolTo, acc, maxFYDaiCost, { gasLimit: BigNumber.from('600000'), value:0 } ) :
          await proxyContract.rollAllEarly(collatType, poolFrom, poolTo, acc, maxFYDaiCost, { gasLimit: BigNumber.from('500000'), value:0 } );
      
      } else if ( noSigsReqd && !isRequestMoreThanDebt) {  
        tx = seriesFrom.isMature() ?
          await proxyContract.rollDebtMature(collatType, poolFrom, poolTo, acc, daiToBuy, maxFYDaiCost, { gasLimit: BigNumber.from('600000'), value:0 } ) :  
          await proxyContract.rollDebtEarly(collatType, poolFrom, poolTo, acc, daiToBuy, maxFYDaiCost, { gasLimit: BigNumber.from('500000'), value:0 } );
      
      } else if ( !noSigsReqd && isRequestMoreThanDebt) {
        tx = seriesFrom.isMature() ?
          await proxyContract.rollAllMatureWithSignature(collatType, poolFrom, poolTo, acc, maxFYDaiCost, signedSigs.get('controllerSig'), { gasLimit: BigNumber.from('600000'), value:0 } ) :
          await proxyContract.rollAllEarlyWithSignature(collatType, poolFrom, poolTo, acc, maxFYDaiCost, signedSigs.get('controllerSig'), { gasLimit: BigNumber.from('500000'), value:0 } );
      
      } else  {
        tx = seriesFrom.isMature() ?
          await proxyContract.rollDebtMatureWithSignature(collatType, poolFrom, poolTo, acc, daiToBuy, maxFYDaiCost, signedSigs.get('controllerSig'), { gasLimit: BigNumber.from('600000'), value:0 } ) :  
          await proxyContract.rollDebtEarlyWithSignature(collatType, poolFrom, poolTo, acc, daiToBuy, maxFYDaiCost, signedSigs.get('controllerSig'), { gasLimit: BigNumber.from('500000'), value:0 } );
      } 

    } catch (e) {
      handleTxRejectError(e);
      return;
    }

    await handleTx(
      { 
        tx, 
        msg: `Rolling ${rollAmount} Debt from ${seriesFrom.displayNameMobile} to ${seriesTo.displayNameMobile}`, 
        type:'ROLL_DEBT', 
        series: seriesFrom,
        value: parsedAmount.toString()
      }
    );
  };

  /**
   * @dev Dai cost to repay
   * @param {string} collateralType collateral type to check (eg. ETH-A)
   * @returns {Promise<BigNumber>} amount Dai (in Wei)
   * @note call function
   */
  const estNewSeriesDebt = async (
    collateralType:string,
    seriesFrom: IYieldSeries,
    amount: BigNumber | string,
    
  ): Promise<BigNumber> => {

    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(cleanValue(amount));
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const poolFrom = ethers.utils.getAddress(seriesFrom.poolAddress);
    
    let res; 
    try {
      res = await await proxyContract.daiCostToRepay(collatType, poolFrom, parsedAmount);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  return {

    rollDebt,
    estNewSeriesDebt,

  } as const;
};
