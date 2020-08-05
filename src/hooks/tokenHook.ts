import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers, BigNumber}  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext';
// import { ConnectionContext } from '../contexts/ConnectionContext';

import { useSignerAccount } from './connectionHooks';

import YDai from '../contracts/YDai.json';
import Controller from '../contracts/Controller.json';
import TestERC20 from '../contracts/TestERC20.json';
import WETH9 from '../contracts/WETH9.json';
import GemJoin from '../contracts/GemJoin.json';
import DaiJoin from '../contracts/DaiJoin.json';
import Chai from '../contracts/Chai.json';
import Vat from '../contracts/Vat.json';
import Pot from '../contracts/Pot.json';
import EthProxy from '../contracts/EthProxy.json';
import DaiProxy from '../contracts/DaiProxy.json';
import Migrations from '../contracts/Migrations.json';
import Pool from '../contracts/Pool.json';

// ethers.errors.setLogLevel('error');

const contractMap = new Map<string, any>([
  ['YDai', YDai.abi],
  ['Controller', Controller.abi],
  ['Dai', TestERC20.abi],
  ['Weth', WETH9.abi],
  ['Chai', Chai.abi],
  ['WethJoin', GemJoin.abi],
  ['DaiJoin', DaiJoin.abi],
  ['Vat', Vat.abi],
  ['Pot', Pot.abi],
  ['EthProxy', EthProxy.abi],
  ['DaiProxy', DaiProxy.abi],
  ['Migrations', Migrations.abi],
  ['Pool', Pool.abi],
]);

/**
 * Hook for getting native balances and token balances
 * @returns { function } getEthBalance
 * @returns { boolean } getTokenBalance
 */
export function useToken() {
  // const { state: { provider, account } } = React.useContext(ConnectionContext);
  const { signer, provider, account, altProvider, voidSigner } = useSignerAccount();

  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ approveActive, setApproveActive ] = React.useState<boolean>(false);

  /**
   * Native user account balance (WEI)
   * @returns balance in Wei! 
   */
  const getEthBalance = async () => {
    if (!!provider && !!account) {
      const balance = await provider.getBalance(account);
      return balance;
    } return ethers.BigNumber.from('0');
  };

  /**
   * Get the user account balance of an ERC20token
   * @param {string} tokenAddr address of the Token
   * @param {string} abi abi of the token (probably ERC20 in most cases)
   * @returns whatever token value
   */
  const getTokenBalance = async (tokenAddr:string, contractName:string) => {
    if (!!provider && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get(contractName), provider);
      const balance = await contract.balanceOf(account);
      return balance;
    } return ethers.BigNumber.from('0');
  };

  /**
   * Get the transaction allowance of a user for an ERC20token
   * @param {string} tokenAddr address of the Token
   * @param {string} operatorAddr address of the operator whose allowance you are checking
   * @param {string} tokenName name of the token (probably ERC20 in most cases)
   * @prarm 
   * @returns whatever token value
   */
  const getTokenAllowance = async (
    tokenAddress:string,
    operatorAddress:string,
    tokenName: string
  ) => {
    const fromAddr = account && ethers.utils.getAddress(account);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    const operatorAddr = ethers.utils.getAddress(operatorAddress);
    const contract = new ethers.Contract( tokenAddr, contractMap.get(tokenName), provider );
    let res;
    try {
      res = await contract.allowance(fromAddr, operatorAddr);
    }  catch (e) {
      console.log(e);
      res = ethers.BigNumber.from('0');
    }
    return parseFloat(ethers.utils.formatEther(res));
  };

  /**
   * Approve an allowance for a token.
   * 
   * @param {string} tokenAddress address of the token to approve.
   * @param {string} poolAddress address of the market.
   * @param {number} amount to approve (in human understandable numbers)
   */
  const approveToken = async (
    tokenAddress:string,
    poolAddress:string,
    amount:number
  ) => {
    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const marketAddr = ethers.utils.getAddress(poolAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);

    /* Contract interaction */
    setApproveActive(true);
    const contract = new ethers.Contract(
      tokenAddr,
      YDai.abi,
      signer
    );
    try {
      tx = await contract.approve(marketAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      dispatch({ type: 'txComplete', payload:{ tx } } );
      setApproveActive(false);
      return;
    }
    /* Transaction reporting & tracking */
    dispatch({ type: 'txPending', payload:{ tx, message: `Token approval of ${amount} pending...` } } );
    await tx.wait();
    setApproveActive(false);
    dispatch({ type: 'txComplete', payload:{ tx } } );
  };

  return { approveToken, approveActive, getTokenAllowance, getEthBalance, getTokenBalance } as const;
}