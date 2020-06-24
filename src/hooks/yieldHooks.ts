import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers';

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

import { NotifyContext } from '../contexts/NotifyContext';

ethers.errors.setLogLevel('error');

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

export function useGetBalance() {
  const { library, account } = useWeb3React();
  // const getEthBalance = async () : Promise<string> => {
  //   if (!!library && !!account) {
  //     const bal = await library.getBalance(account);
  //     return ethers.utils.formatEther(bal);
  //   } return '0';
  // };
  const getWeiBalance = async () => {
    if (!!library && !!account) {
      const balance = await library.getBalance(account);
      // return bal.toString();
      return balance;
    } return ethers.utils.bigNumberify('0');
  };
  const getWethBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Weth'), library);
      const balance = await contract.balanceOf(account);
      // return ethers.utils.formatEther(balance.toString());
      return balance;
    } return ethers.utils.bigNumberify('0');
  };
  const getChaiBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Chai'), library);
      const balance = await contract.balanceOf(account);
      return balance;
      // return ethers.utils.formatEther(balance.toString());
    } return ethers.utils.bigNumberify('0');
  };
  const getDaiBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Dai'), library);
      const balance = await contract.balanceOf(account);
      return balance;
      // return ethers.utils.formatEther(balance.toString());
    } return ethers.utils.bigNumberify('0');
  };
  return { getWeiBalance, getWethBalance, getChaiBalance, getDaiBalance } as const;
}

export const useCallTx = () => {
  const { library } = useWeb3React();
  const [ callTxActive, setCallTxActive ] = React.useState<boolean>();
  const callTx = async (
    contractAddr:string,
    contractName:string,
    fn:string,
    data:any[]
  ) => {
    setCallTxActive(true);
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), library);
    const retVal = await contract[fn](...data);
    setCallTxActive(false);
    return retVal;
  };
  return [ callTx, callTxActive ] as const;
};

export const useEthProxy = () => {
  const { abi: ethProxyAbi } = EthProxy;
  const { library, account } = useWeb3React();
  const  { dispatch: notifyDispatch }  = React.useContext<any>(NotifyContext);
  const [ postEthActive, setPostEthActive ] = React.useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = React.useState<boolean>(false);
  const signer = library?.getSigner();

  const postEth = async (
    ethProxyAddress:string,
    amount:number
  ) => {
    let tx:any;
    // Processing and sanitizing input
    // console.log(ethers.utils.parseEther(amount.toString()));
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);
    // Contract interaction
    setPostEthActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.post(fromAddr, toAddr, parsedAmount, { value: parsedAmount });
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e.message);
      setPostEthActive(false);
      return;
    }
    // Transaction reporting & tracking
    notifyDispatch({ type: 'notify', payload:{ message:`Deposit of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setPostEthActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Deposit of ${amount} complete.`, type:'success' } } );
  };

  const withdrawEth = async (
    ethProxyAddress:string,
    amount:number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const ethProxyAddr = ethers.utils.getAddress(ethProxyAddress);

    setWithdrawEthActive(true);
    const contract = new ethers.Contract( ethProxyAddr, ethProxyAbi, signer );
    try {
      tx = await contract.withdraw(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      setWithdrawEthActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Withdraw of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setWithdrawEthActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Withdrawal of ${amount} complete.`, type:'success' } } );
  };

  return {
    postEth, postEthActive,
    withdrawEth, withdrawEthActive,
  } as const;
};

export const useDealer = () => {
  const { abi: dealerAbi } = Dealer;
  const { library, account } = useWeb3React();
  const  { dispatch: notifyDispatch }  = React.useContext<any>(NotifyContext);
  const [ postActive, setPostActive ] = React.useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  const [ approveActive, setApproveActive ] = React.useState<boolean>(false);
  const signer = library?.getSigner();

  const post = async (
    dealerAddress:string,
    collateral:string,
    amount:number
  ) => {
    let tx:any;
    // Processing and sanitizing input
    // console.log(ethers.utils.parseEther(amount.toString()));
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    // Contract interaction
    setPostActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.post(collateralBytes, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setPostActive(false);
      return;
    }
    // Transaction reporting & tracking
    notifyDispatch({ type: 'notify', payload:{ message:`Deposit of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setPostActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Deposit of ${amount} complete.`, type:'success' } } );
  };

  const withdraw = async (
    dealerAddress:string,
    collateral:string,
    amount:number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    setWithdrawActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.withdraw(collateralBytes, fromAddr, toAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      console.log(e);
      setWithdrawActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Withdraw of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setWithdrawActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Withdrawal of ${amount} complete.`, type:'success' } } );
  };

  const borrow = async (
    dealerAddress:string,
    collateral:string,
    maturity:string,
    // to:string,
    amount:number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const toAddr = account && ethers.utils.getAddress(account);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    setBorrowActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.borrow(collateralBytes, maturity, toAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setBorrowActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setBorrowActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${amount} complete.`, type:'success' } } );
  };

  const repay = async (
    dealerAddress:string,
    collateral:string,
    maturity:string,
    // from:string,
    amount:number,
    type:string,
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const typeCaps = type.toUpperCase();
    const collateralBytes = ethers.utils.formatBytes32String(collateral);

    setRepayActive(true);

    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      if (typeCaps === 'YDAI') {
        tx = await contract.repayYDai(collateralBytes, maturity, fromAddr, parsedAmount);
      } else if (typeCaps === 'DAI') {
        tx = await contract.repayDai(collateralBytes, maturity, fromAddr, parsedAmount);
      }
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setRepayActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${amount} Dai pending...`, type:'info' } } );
    await tx.wait();
    setRepayActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${amount} yDai complete.`, type:'success' } } );
  };

  // Not strictly a Dealer Contract function. But associated enough to keep in here. 
  const approveDealer = async (
    tokenAddress:string,
    dealerAddress:string,
    amount:number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    setApproveActive(true);
    const contract = new ethers.Contract(
      tokenAddr,
      TestERC20.abi,
      signer
    );

    try {
      tx = await contract.approve(dealerAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setApproveActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setApproveActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${amount} complete. ${tokenAddress} and ${dealerAddress}`, type:'success' } } );
  };

  return {
    post, postActive,
    withdraw, withdrawActive,
    borrow, borrowActive,
    repay, repayActive,
    approveDealer, approveActive,
  } as const;
};

// SendTx is a generic function to interact with any contract, primarily used for development/testing.
export const useSendTx = () => {
  const { library } = useWeb3React();
  const [ sendTxActive, setSendTxActive ] = React.useState<boolean>();
  const signer = library?.getSigner();
  const sendTx = async (contractAddr:string, contractName:string, fn:string, data:any[], value:ethers.utils.BigNumber ) => {
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
