import React from 'react';

import { ethers, BigNumber }  from 'ethers';
import * as utils from '../utils';

import { NotifyContext } from '../contexts/NotifyContext';

import EthProxy from '../contracts/EthProxy.json';
import DaiProxy from '../contracts/DaiProxy.json';

// import YieldProxy from '../contracts/YieldProxy.json';
// import LiquidityProxy from '../contracts/LiquidityProxy.json';

import { useSignerAccount } from './connectionHooks';

// ethers.errors.setLogLevel('error');

/**
 * Hook for interacting with the Yield 'LIQUIDITY PROXY' Contract.
 * 
 * @returns { function } addLiquidity
 * @returns { boolean } addLiquidityActive
 * @returns { function } removeLiquidity
 * @returns { boolean } removeLiquidityActive
 */
export const useLiquidityProxy = () => {

  // const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { signer, provider, account } = useSignerAccount();

  const { abi: ethProxyAbi } = EthProxy;

  const  { dispatch }  = React.useContext<any>(NotifyContext);

  const [ removeLiquidityActive, setRemoveLiquidityActive ] = React.useState<boolean>(false);
  const [ addLiquidityActive, setAddLiquidityActive ] = React.useState<boolean>(false);

  /**
   * Posts collateral (ETH) via ethProxy
   * @param {string} ethProxyAddress address of the proxy
   * @param {number | BigNumber} amount amount of ETH to post (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const addLiquidity = async (
    ethProxyAddress:string,
    amount:number | BigNumber,
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);

    /* Contract interaction */
    setAddLiquidityActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.post(toAddr, parsedAmount, { value: parsedAmount });
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed. See console.', type:'error' } } );
      // eslint-disable-next-line no-console
      console.log(e.message);
      setAddLiquidityActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} ETH pending...`, type:'DEPOSIT' } } );
    await tx.wait();
    setAddLiquidityActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Deposit of ${amount} ETH complete` } } );
    // eslint-disable-next-line consistent-return
    return tx;

  };

  /**
   * Withdraws ETH collateral directly (no wrapping of WETH required).
   * (May require authorization once.  )
   * @param {string} ethProxyAddress address of the proxy
   * @param {number|BigNumber} amount amount of ETH to withdraw (in normal human numbers or in Wei as a BigNumber)
   * @note if BigNumber is used make sure it is in WEI
   */
  const removeLiquidity = async (

  // removeLiquidityEarly(address from, uint256 poolTokens, uint256 DaiLimit)
  // removeLiquidityMature(address from, uint256 poolTokens) 

    ethProxyAddress:string,
    amount:number|BigNumber
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = BigNumber.isBigNumber(amount)? amount : ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);

    /* Contract interaction */
    setRemoveLiquidityActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.withdraw(toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      setRemoveLiquidityActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...`, type:'WITHDRAW' } } );
    await tx.wait();
    setRemoveLiquidityActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Withdrawal of ${amount} complete.` } } );
    // eslint-disable-next-line consistent-return
    return tx;
  };

  return {

    addLiquidity, addLiquidityActive,
    removeLiquidity, removeLiquidityActive,

  } as const;
};