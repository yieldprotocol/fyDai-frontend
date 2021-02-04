import { useEffect, useState, useContext } from 'react';
import { ethers, BigNumber }  from 'ethers';

import * as utils from '../utils';
import { MAX_INT } from '../utils/constants';
import { calculateSlippage } from '../utils/yieldMath';

import { ISignListItem, IYieldSeries } from '../types';

import Controller from '../contracts/Controller.json';
import RollProxy from '../contracts/RollProxy.json';

import { YieldContext } from '../contexts/YieldContext';
import { UserContext } from '../contexts/UserContext';

import { useSignerAccount } from './connectionHooks';
import { usePool } from './poolHook';
import { useToken } from './tokenHook';

import { useSigning } from './signingHook';

import { useDsProxy } from './dsProxyHook';

import { useController } from './controllerHook';
import { genTxCode } from '../utils';

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
  const { preferences: { slippage }, authorization: { dsProxyAddress, hasDelegatedDsProxy } } = userState; 

  /* hooks */ 
  const { signer, provider, account } = useSignerAccount();
  const { previewPoolTx, addPoolDelegate, checkPoolDelegate } = usePool();
  const { approveToken, getTokenAllowance } = useToken();
  const { addControllerDelegate } = useController();

  const { proxyExecute } = useDsProxy();
  const { delegationSignature, daiPermitSignature, ERC2612PermitSignature, handleSignList } = useSigning();
  
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
    collateralType: string = ethers.utils.formatBytes32String('ETH-A'),

  ) => {

    const parsedAmount = BigNumber.isBigNumber(rollAmount)? rollAmount : ethers.utils.parseEther(utils.cleanValue(rollAmount));
    const collatType = ethers.utils.formatBytes32String(collateralType);
    const poolFrom = account && ethers.utils.getAddress(seriesFrom.poolAddress);
    const poolTo = account && ethers.utils.getAddress(seriesTo.poolAddress);

    const overrides = {
      gasLimit: BigNumber.from('350000'),
      value: 0,
    };

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
    const signedSigs = await handleSignList(requestedSigs, genTxCode('ROLL', seriesFrom?.maturity.toString()));
    
    /* if ANY of the sigs are 'undefined' cancel/breakout the transaction operation */
    if ( Array.from(signedSigs.values()).some(item => item === undefined) ) { return; }

    const daiToBuy = await proxyContract.daiCostToRepay('ETH-A', poolFrom, parsedAmount);

    /* calculate expected trade values and factor in slippage */
    let maxFYDaiCost:string;
    const preview = await previewPoolTx('buyDai', seriesTo, daiToBuy.toString());
    if ( !(preview instanceof Error) ) {
      maxFYDaiCost = calculateSlippage(preview, slippage);
    } else {
      throw(preview);
    }
          
    // function rollDebtWithSignature(
    //   bytes32 collateral,
    //   IPool pool1,
    //   IPool pool2,
    //   address user,
    //   uint256 daiToBuy,      // Calculate off-chain using daiCostToRepay(collateral, pool1, daiDebtToRepay) or similar
    //   uint256 maxFYDaiCost,  // Calculate off-chain using pool2.buyDaiPreview(daiDebtToRepay.toUint128()), plus accepted slippage
    //   bytes memory controllerSig
    // )
    const calldata = proxyContract.interface.encodeFunctionData( 
      'rollDebtWithSignature', 
      [ collatType, poolFrom, poolTo, account, daiToBuy, maxFYDaiCost, signedSigs.get('controllerSig')]
    );
    
    /* send to the proxy for execution */
    await proxyExecute( 
      proxyContract.address, 
      calldata,
      overrides,
      { 
        tx:null, 
        msg: `Rolling ${parsedAmount} Debt from ${poolFrom} to ${poolTo}`, 
        type:'REPAY', 
        series: seriesTo,
        value: parsedAmount.toString()
      }
    );

  };


  return {

    rollDebt

  } as const;
};
