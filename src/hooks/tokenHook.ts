import { ethers }  from 'ethers';
import { useSignerAccount } from './connectionHooks';

import FYDai from '../contracts/FYDai.json';
import Dai from '../contracts/Dai.json';
import Pool from '../contracts/Pool.json';
import { useTxHelpers } from './txHooks';
import { IYieldSeries } from '../types';

const contractMap = new Map<string, any>([
  ['FYDai', FYDai.abi],
  ['Dai', Dai.abi],
  ['Pool', Pool.abi],
]);

/**
 * Hook for getting native balances and token balances
 * @returns { function } getBalance
 * @returns { boolean } getBalance
 */
export function useToken() {
  // const { state: { provider, account } } = useContext(ConnectionContext);
  const { signer, provider, account, fallbackProvider } = useSignerAccount();
  const { handleTx, handleTxRejectError } = useTxHelpers();

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
   * Get the transaction allowance of a user for an ERC20token
   * @param {string} tokenAddr address of the Token
   * @param {string} operatorAddr address of the operator whose allowance you are checking
   * @param {string} tokenName name of the token (probably ERC20 in most cases)
   * @returns whatever token value
   */
  const getTokenAllowance = async (
    tokenAddress:string,
    operatorAddress:string,
    tokenName: string,
  ) => {
    const fromAddr = account && ethers.utils.getAddress(account);
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
    try {
      tx = await contract.approve(delegateAddr, parsedAmount);
    } catch (e) {
      return handleTxRejectError(e);
    }
    /* Transaction reporting & tracking */
    await handleTx({ tx, msg: 'Token authorization', type: 'AUTH_TOKEN', series: series||null });
  };

  return { approveToken, getTokenAllowance, getBalance } as const;
}
