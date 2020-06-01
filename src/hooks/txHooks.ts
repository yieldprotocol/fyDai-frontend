import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers';

import YDai from '../contracts/YDai.json';
import Dealer from '../contracts/Dealer.json';

import Vat from '../contracts/Vat.json';
import Pot from '../contracts/Pot.json';
import Treasury from '../contracts/Treasury.json';

import TestERC20 from '../contracts/TestERC20.json';

import GemJoin from '../contracts/GemJoin.json';
import DaiJoin from '../contracts/DaiJoin.json';

ethers.errors.setLogLevel('error');

const contractMap = new Map<string, any>([
  ['YDai', YDai.abi],
  ['Dealer', Dealer.abi],
  ['Vat', Vat.abi],
  ['Pot', Pot.abi],
  ['Treasury', Treasury.abi],
  ['Weth', TestERC20.abi],
  ['WethJoin', GemJoin.abi],
  ['DaiJoin', DaiJoin.abi],
  ['Chai', TestERC20.abi],
]);

export function useGetBalance() {
  const web3React = useWeb3React();
  const { library, account } = web3React;
  const getBalance = async () : Promise<string> => {
    if (!!library && !!account) {
      const bal = await library.getBalance(account);
      return ethers.utils.formatEther(bal);
    } return '';
  };
  const getWeiBalance = async () => {
    if (!!library && !!account) {
      const bal = await library.getBalance(account);
      return bal.toString();
    } return '';
  };
  return [getBalance, getWeiBalance];
}

export const useCallTx = () => {
  const { library } = useWeb3React();
  const [ callTxActive, setCallTxActive ] = React.useState<boolean>();
  const callTx = async (contractAddr:string, contractName:string, fn:string, data:any[] ) => {
    setCallTxActive(true);
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), library);
    const retVal = await contract[fn](...data);
    setCallTxActive(false);
    return retVal;
  };
  return [ callTx, callTxActive ] as const;
};

export const useSendTx = () => {
  const { library, account } = useWeb3React();
  const [ sendTxActive, setSendTxActive ] = React.useState<boolean>();
  const signer = library?.getSigner();
  const sendTx = async (contractAddr:string, contractName:string, fn:string, data:any[] ) => {
    setSendTxActive(true);
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), signer);
    const tx = await contract[fn](...data); 
    console.log(`${tx.hash} pending`);
    await tx.wait();
    setSendTxActive(false);
    console.log(`${tx.hash} send tx complete`);
  };
  return [ sendTx, sendTxActive ] as const;
};

export const usePayTx = () => {
  const { library } = useWeb3React();
  const [ payTxActive, setPayTxActive ] = React.useState<boolean>();
  const signer = library?.getSigner();
  const transaction = {
    nonce: 0,
    gasLimit: 21000,
    gasPrice: ethers.utils.bigNumberify('20000000000'),
    // TODO: for production uncomment ensure the transaction cannot be replayed on different networks
    // chainId: ethers.utils.getNetwork('homestead').chainId
    to: '',
    value: ethers.utils.parseEther('0'),
    // data: '0x',
    // ... or supports ENS names
    // to: "someone.somwhere.eth",
  };
  const payTx = async (to:string, amount:string) => {
    setPayTxActive(true);
    transaction.to = to;
    transaction.value = ethers.utils.parseEther(amount);
    const tx = await signer.sendTransaction(transaction);
    console.log(tx.hash);
    await tx.wait();
    setPayTxActive(true);
    console.log('tx complete');
  };
  return [ payTx, payTxActive ] as const;
};
