import { ethers }  from 'ethers';
import { useSignerAccount } from './connectionHooks';

import { IDomain, IYieldSeries } from '../types';

import FYDai from '../contracts/FYDai.json';
import Dai from '../contracts/Dai.json';
import USDC from '../contracts/USDC.json';
import Pool from '../contracts/Pool.json';

import { useTxHelpers } from './txHooks';
import { useDsProxy } from './dsProxyHook';

/* Map of the tokens that will potentially be used */
const contractMap = new Map<string, any>([
  ['FYDai', FYDai.abi],
  ['Dai', Dai.abi],
  ['USDC', USDC.abi],
  ['Pool', Pool.abi],
]);

/**
 * Hook for getting native balances and token balances
 * @returns { function } getBalance
 * @returns { boolean } getBalance
 */
export function useToken() {

  const { signer, provider, account, fallbackProvider } = useSignerAccount();
  const { handleTx, handleTxRejectError } = useTxHelpers();
  const { proxyExecute } = useDsProxy();

  /**
   * Get the user account balance of ETH  (omit args) or an ERC20token (provide args)
   * 
   * @param {string} tokenAddr address of the Token, *optional, omit for ETH
   * @param {string} contractName abi of the token (probably ERC20 in most cases) *optional, omit for ETH
   *  @param {string} queryAddress what address to query *optional, omit for ETH DEFAULTS to current user
   * 
   * @returns {BigNumber} ETH in Wei or token balance.
   */
  const getBalance = async (
    tokenAddr:string|null=null, 
    contractName:string|null=null, 
    queryAddress:string|null=null
  ) => {  
    if (fallbackProvider) {
      const addrToCheck = queryAddress || account;
      if (tokenAddr && contractName) {
        const contract = new ethers.Contract(tokenAddr, contractMap.get(contractName), fallbackProvider );
        const balance = await contract.balanceOf(addrToCheck);
        return balance;
      }
      return fallbackProvider.getBalance(addrToCheck);
    } 
    return ethers.BigNumber.from('0');
  };

  /**
   * Gets Domain separator of a permitable toeken
   * 
   * @param {string} tokenAddr address of the Token, *optional, omit for ETH
   * @param {string} contractName abi of the token (probably ERC20 in most cases) *optional, omit for ETH
   * 
   * @returns {IDomain} domain separator
   */
  const getDomain = async (
    tokenAddr:string, 
    contractName:string, 
  ) => {  
    const contract = new ethers.Contract(tokenAddr, contractMap.get(contractName), fallbackProvider );
    const domain = await contract.DOMAIN_SEPARATOR();
    console.log(domain);
    return domain;
  };

  /**
   * Get the transaction allowance of a user for an ERC20token
   * @param {string} tokenAddr address of the Token
   * @param {string} tokenName name of the token (probably ERC20 in most cases)
   * @param {string} operatorAddr address of the operator whose allowance you are checking
   * @returns whatever token value
   */
  const getTokenAllowance = async (
    tokenAddress:string,
    tokenName: string,
    operatorAddress:string,
    fromAddress: string|null = null,
  ) => {

    const fromAddr = fromAddress ? 
      ethers.utils.getAddress(fromAddress) : 
      ( account && ethers.utils.getAddress(account) ); 

    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    const operatorAddr = ethers.utils.getAddress(operatorAddress);
    const contract = new ethers.Contract( tokenAddr, contractMap.get(tokenName), provider );
    let res;
    try {
      res = await contract.allowance(fromAddr, operatorAddr);
    }  catch (e) {
      res = ethers.BigNumber.from('0');
    }
    return parseFloat(ethers.utils.formatEther(res));
  };

  /**
   * Approve an allowance for a token.
   * 
   * @param {string} tokenAddress address of the token to approve.
   * @param {string} poolAddress address of the market.
   * @param {string} amount to approve (in human understandable numbers)
   * 
   * @param {string} series IYieldSereis in question or null
   */
  const approveToken = async (
    tokenAddress:string,
    delegateAddress:string,
    amount:string,
    series:IYieldSeries|null,
    asProxy: boolean = false,  // address of the proxy used
  ) => {

    let tx:any;
    /* Processing and sanitizing input */
    const parsedAmount = amount;
    const delegateAddr = ethers.utils.getAddress(delegateAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);

    /* Contract interaction */
    const contract = new ethers.Contract(
      tokenAddr,
      Dai.abi,
      signer
    );

    if (asProxy) {
      const calldata = contract.interface.encodeFunctionData('approve', [delegateAddr, parsedAmount]);   
      tx = await proxyExecute( 
        tokenAddr,
        calldata,
        { },
        { tx:null, msg: 'Token authorization', type: 'AUTH_TOKEN', series: series || null, value : null  }
      );

    } else { 

      try {
        tx = await contract.approve(delegateAddr, parsedAmount);
      } catch (e) {
        return handleTxRejectError(e);
      }
      /* handle transaction reporting & tracking */
      await handleTx({ tx, msg: 'Token authorization', type: 'AUTH_TOKEN', series: series||null, value: null });
    }

  };

  return { approveToken, getTokenAllowance, getBalance, getDomain } as const;
}
