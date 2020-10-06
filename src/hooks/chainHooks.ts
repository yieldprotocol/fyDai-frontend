import { useEffect, useState } from 'react';
import { ethers }  from 'ethers';

import { useSignerAccount } from './connectionHooks';

import FyDai from '../contracts/FYDai.json';
import Controller from '../contracts/Controller.json';
import Dai from '../contracts/Dai.json';
import YieldProxy from '../contracts/YieldProxy.json';
import Migrations from '../contracts/Migrations.json';
import Pool from '../contracts/Pool.json';
import Vat from '../contracts/Vat.json';

// ethers.errors.setLogLevel('error');

const contractMap = new Map<string, any>([
  ['FyDai', FyDai.abi],
  ['Controller', Controller.abi],
  ['Dai', Dai.abi],
  ['YieldProxy', YieldProxy.abi],
  ['Migrations', Migrations.abi],
  ['Pool', Pool.abi],
  ['Vat', Vat.abi], 
]);

export const useContractAbi = (contractName:string) =>{ 
  const { abi }  = contractMap.get(contractName);
  return { abi } as const;
};

/**
 * SendTx is a generic function to interact with any contract.
 * Primarily used for development/testing, or for once off interactions with a contract.
 * Currently, There are no notifications other than console logs.
 * @returns { function } sendTx
 * @returns { boolean } sendTxActive
 */
export const useSendTx = () => {
  // const { state: { signer, account } } = useContext(ConnectionContext);
  const { signer, account } = useSignerAccount();
  const [ sendTxActive, setSendTxActive ] = useState<boolean>();
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
  const { fallbackProvider } = useSignerAccount();
  const [ callTxActive, setCallTxActive ] = useState<boolean>();
  /**
   * Get data from the blockchain via provider (no signer reqd)
   * @param {string} contractAddress address of the contract to be called
   * @param {string} contractName name of the contract to call (this is used to get the abi from a contract map)
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
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), fallbackProvider);
    const retVal = await contract[fn](...data);
    setCallTxActive(false);
    return retVal;
  };
  return [ callTx, callTxActive ] as const;
};

export const useTimeTravel = () => {
  const { provider } = useSignerAccount();
  const [ snapshotNumber, setSnapshotNumber ] = useState<any>('0x1');
  const [ block, setBlock ] = useState<any>(null);
  const [ timestamp, setTimestamp ] = useState<number|null>(null);

  useEffect(()=>{
    provider && ( async () => {
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
    // eslint-disable-next-line no-console
    console.log( 'Snapshot taken', num.result );
    setSnapshotNumber( num.result );
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.log(await res.json());
    setBlock(provider.blockNumber);
    console.log('new block:', provider.blockNumber);
  };

  const advanceTimeAndBlock = async (time:string) =>{
    await advanceTime(time);
    await advanceBlock();
  };

  return { advanceTimeAndBlock, revertToSnapshot, takeSnapshot, snapshotNumber, revertToT0, block, timestamp } as const;
};
