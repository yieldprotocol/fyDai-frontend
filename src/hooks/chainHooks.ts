import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers, BigNumber }  from 'ethers';

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

// TODO: Sanitize all inputs NB!!
/**
 * SendTx is a generic function to interact with any contract.
 * Primarily used for development/testing, or for once off interactions with a contract.
 * Currently, There are no notifications other than console logs.
 * @returns { function } sendTx
 * @returns { boolean } sendTxActive
 */
export const useSendTx = () => {
  // const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { signer, account } = useSignerAccount();
  const [ sendTxActive, setSendTxActive ] = React.useState<boolean>();

  /**
   * Send a transaction ()
   * @param {string} contractAddress address of the contract to send to.
   * @param {string} contractName name of the contract to call (uses this to get the abi from a contract map)
   * @param {string} fn name of the function to call 
   * @param {any[]} data array of any arguments required by the contract function 
   * @param {BigNumber} value if the tx is to a payable contract, use a bigNumber value here. 
   */
  const sendTx = async (contractAddr:string, contractName:string, fn:string, data:any[], value:ethers.BigNumber ) => {
    let tx;
    console.log(contractAddr, contractMap.get(contractName), signer); 
    setSendTxActive(true);
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), signer);
    if (!value.isZero()) {
      console.log(`Tx sends ETH: ${value.toString()} `);
      tx = await contract[fn](...data, { value });
    } else {
      console.log('Tx has no ETH associated with it (except gas, obs)');
      tx = await contract[fn](...data);
    }
    console.log(`${tx.hash} pending`);
    await tx.wait();
    setSendTxActive(false);
    console.log(`${tx.hash} send tx complete`);
  };
  return [ sendTx, sendTxActive ] as const;
};

/**
 * Hook for making blockchain calls
 * Does not incur gas charges
 * But only applicable if contract function has a view modifier
 * Fails ( mostly silently ) on functions that require gas.
 * @returns { function } callTx
 * @returns { boolean } callTxActive
 */
export const useCallTx = () => {

  // const { state: { provider, altProvider } } = React.useContext(ConnectionContext);
  const { signer, provider, account, altProvider, voidSigner } = useSignerAccount();

  const [ callTxActive, setCallTxActive ] = React.useState<boolean>();
  /**
   * Get data from the blockchain via provider (no signer reqd)
   * @param {string} contractAddress address of the contract to be called
   * @param {string} contractName name of the contract to call (uses this to get the abi from a contract map)
   * @param {string} fn name of the function to call 
   * @param {any[]} data array of any arguments required by the contract function 
   */
  const callTx = async (
    contractAddr:string,
    contractName:string,
    fn:string,
    data:any[]
  ) => {
    setCallTxActive(true);
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), provider || altProvider);
    const retVal = await contract[fn](...data);
    setCallTxActive(false);
    return retVal;
  };
  return [ callTx, callTxActive ] as const;
};

/**
 * Hook for getting native balances and token balances
 * @returns { function } getBalance
 * @returns { boolean } getBalance
 */
export function useBalances() {
  // const { state: { provider, account } } = React.useContext(ConnectionContext);
  const { signer, provider, account, altProvider, voidSigner } = useSignerAccount();

  /**
   * Get the user account balance of ETH  (omit args) or an ERC20token (provide args)
   * 
   * @param {string} tokenAddr address of the Token, *optional, omit for ETH
   * @param {string} abi abi of the token (probably ERC20 in most cases) *optional, omit for ETH
   * 
   * @returns {BigNumber} ETH in Wei or token balance.
   */
  const getBalance = async (tokenAddr:string|null=null, contractName:string|null=null) => {
    if (!!provider && !!account ) {
      if (tokenAddr && contractName) {
        const contract = new ethers.Contract(tokenAddr, contractMap.get(contractName), provider);
        const balance = await contract.balanceOf(account);
        return balance;
      }
      return provider.getBalance(account);
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

  return { getTokenAllowance, getBalance } as const;
}


export const useTimeTravel = () => {

  const { provider } = useSignerAccount();
  const [ snapshot, setSnapshot ] = React.useState<any>('0x1');
  const [ block, setBlock ] = React.useState<any>(null);
  const [ timestamp, setTimestamp ] = React.useState<number|null>(null);

  React.useEffect(()=>{
    ( async () => {
      const { timestamp: ts } = await provider.getBlock(await provider.blockNumber);
      setTimestamp(ts);
    })();
  }, [block]);

  const takeSnapshot = async () => {
    const res = await fetch('http://localhost:8545', {
      method:'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"id":1337,"jsonrpc":"2.0","method":"evm_snapshot","params":[]}'
    });
    const num = await res.json();
    console.log( 'Snapshot taken', num.result );
    setSnapshot( num.result );

    window.localStorage.setItem('snapshot', num.result);
    setBlock(provider.blockNumber);
  };

  const revertToSnapshot = async () => {
    const res = await fetch('http://localhost:8545', {
      method:'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: `{"id":1337,"jsonrpc":"2.0","method":"evm_revert","params":["${window.localStorage.getItem('snapshot')}"]}`
    });
    console.log('Reverted to Snapshot', (await res.json()).result );
    takeSnapshot();
    setBlock(provider.blockNumber);
    window.localStorage.clear();
    window.location.reload();
  };

  const revertToT0 = async () => {
    const res = await fetch('http://localhost:8545', {
      method:'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"id":1337,"jsonrpc":"2.0","method":"evm_revert","params":["0x1"]}'
    });
    console.log('Reverted to first snapshot', (await res.json()).result );
    takeSnapshot();
    setBlock(provider.blockNumber);
    window.localStorage.clear();
    window.location.reload();
  };

  const advanceTime = async (time:string) => {
    const res = await fetch('http://localhost:8545', {
      method:'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: `{"id":1337,"jsonrpc":"2.0","method":"evm_increaseTime","params":[${time}]}`
    });
    console.log(await res.json()); 
    setBlock(provider.blockNumber);
    window.location.reload();
  };

  const advanceBlock = async () => {
    const res = await fetch('http://localhost:8545', {
      method:'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"id":1337,"jsonrpc":"2.0","method":"evm_mine","params":[]}'
    });
    console.log(await res.json());
    setBlock(provider.blockNumber);
    console.log('new block:', provider.blockNumber);
  };

  const advanceTimeAndBlock = async (time:string) =>{
    await advanceTime(time);
    await advanceBlock();
  };

  return { advanceTimeAndBlock, revertToSnapshot, takeSnapshot, revertToT0, block, timestamp } as const;
};
