import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext';
import { ConnectionContext } from '../contexts/ConnectionContext';

import YDai from '../contracts/YDai.json';
import Dealer from '../contracts/Dealer.json';
import TestERC20 from '../contracts/TestERC20.json';
import WETH9 from '../contracts/WETH9.json';
import GemJoin from '../contracts/GemJoin.json';
import DaiJoin from '../contracts/DaiJoin.json';
import Chai from '../contracts/Chai.json';
import Vat from '../contracts/Vat.json';
import Pot from '../contracts/Pot.json';
import EthProxy from '../contracts/EthProxy.json';

// ethers.errors.setLogLevel('error');

const contractMap = new Map<string, any>([
  ['YDai', YDai.abi],
  ['Dealer', Dealer.abi],
  ['Dai', TestERC20.abi],
  ['Weth', WETH9.abi],
  ['Chai', Chai.abi],
  ['WethJoin', GemJoin.abi],
  ['DaiJoin', DaiJoin.abi],
  ['Vat', Vat.abi],
  ['Pot', Pot.abi],
  ['EthProxy', EthProxy.abi],
]);

// SendTx is a generic function to interact with any contract, primarily used for development/testing.
export const useSendTx = () => {
  const { state: { signer, account } } = React.useContext(ConnectionContext);
  // const { library, account } = useWeb3React();
  // const signer = library.getSigner();
  const [ sendTxActive, setSendTxActive ] = React.useState<boolean>();
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

export const useCallTx = () => {
  const { state: { provider, altProvider } } = React.useContext(ConnectionContext);
  // const { library: provider, account } = useWeb3React();
  const [ callTxActive, setCallTxActive ] = React.useState<boolean>();
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

export function useBalances() {
  const { state: { provider, account } } = React.useContext(ConnectionContext);
  // const { library: txProvider, account } = useWeb3React();
  const getEthBalance = async () => {
    if (!!provider && !!account) {
      const balance = await provider.getBalance(account);
      return balance;
    } return ethers.BigNumber.from('0');
  };
  const getTokenBalance = async (tokenAddr:string, abi:string) => {
    if (!!provider && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get(abi), provider);
      const balance = await contract.balanceOf(account);
      return balance;
    } return ethers.BigNumber.from('0');
  };
  return { getEthBalance, getTokenBalance } as const;
}

