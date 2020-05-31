import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers';

import YDai from '../contracts/YDai.json';
import Chai from '../contracts/Chai.json';
import UniLPOracle from '../contracts/UniLPOracle.json';
import ChaiOracle from '../contracts/ChaiOracle.json';
import WethOracle from '../contracts/WethOracle.json';
import Vat from '../contracts/Vat.json';
import Pot from '../contracts/Pot.json';
import Treasury from '../contracts/Treasury.json';
import IUniswap from '../contracts/IUniswap.json';

ethers.errors.setLogLevel("error");

const contractMap = new Map<string,any>([
  ['YDai', YDai.abi],
  ['Chai', Chai.abi],
  ['UniLPOracle', UniLPOracle.abi],
  ['ChaiOracle', ChaiOracle.abi],
  ['WethOracle', WethOracle.abi],
  ['Vat', Vat.abi],
  ['Pot', Pot.abi],
  ['Treasury', Treasury.abi],
  ['IUniswap', IUniswap.abi], 
]);

export async function useGetWeiBalance() {
  const web3React = useWeb3React();
  const { library, account } = web3React;
  if (!!library && !!account) {
    const bal = await library.getBalance(account);
    return bal.toString();
  }
  return '-';
}

export const useCallTx = () => {
    const { library } = useWeb3React();
    const [txActive, setTxActive] = React.useState<boolean>();
    const callTx = async (addr:string, contract:string, fn:string, data:any[] ) => {
        setTxActive(true);
        let c = new ethers.Contract(addr, contractMap.get(contract), library);
        return await c[fn](...data);
    };
    return [ callTx, txActive ] as const;
}

export const useNumberFns = () => {
  const RAD = ethers.utils.bigNumberify('49');
  const bnRAY  = ethers.utils.bigNumberify("1000000000000000000000000000");
  const fromRay = (bn:any) => {
    bn.div()
  }
  const toRay = () => {
  }
  return [fromRay, toRay]
}

export const useSendTx = () => {
  const { library } = useWeb3React();
  const signer = library && library.getSigner();
  const transaction = {
    nonce: 0,
    gasLimit: 21000,
    gasPrice: ethers.utils.bigNumberify('20000000000'),
    to: '0xcd16CA1398DA7b8f072eCF0028A3f4677B19fcd0',
    // ... or supports ENS names
    // to: "ricmoo.firefly.eth",
    value: ethers.utils.parseEther('1.0'),
    data: '0x',
    // This ensures the transaction cannot be replayed on different networks
    chainId: ethers.utils.getNetwork('homestead').chainId
  };
  const sendTx = () => {
    signer && signer.sendTransaction(transaction);
  };
  return [ sendTx ];
};
