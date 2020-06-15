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
]);

export function useGetBalance() {
  const { library, account } = useWeb3React();
  const getBalance = async () : Promise<string> => {
    if (!!library && !!account) {
      const bal = await library.getBalance(account);
      return ethers.utils.formatEther(bal);
    } return '0';
  };
  const getWeiBalance = async () => {
    if (!!library && !!account) {
      const bal = await library.getBalance(account);
      return bal.toString();
    } return '0';
  };
  const getWethBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Weth'), library);
      const balance = await contract.balanceOf(account);
      return balance.toString();
    } return '0';
  };
  const getChaiBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Chai'), library);
      const balance = await contract.balanceOf(account);
      return balance.toString();
    } return '0';
  };
  const getDaiBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Dai'), library);
      const balance = await contract.balanceOf(account);
      return balance.toString();
    } return '0';
  };
  return { getBalance, getWeiBalance, getWethBalance, getChaiBalance, getDaiBalance } as const;
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

export const useDealer = () => {
  const { abi: dealerAbi } = Dealer;
  const { library } = useWeb3React();
  const  { dispatch: notifyDispatch }  = React.useContext<any>(NotifyContext);
  const [ postActive, setPostActive ] = React.useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  const [ approveActive, setApproveActive ] = React.useState<boolean>(false);
  const signer = library?.getSigner();

  const post = async (
    dealerAddress:string,
    from:string,
    amount:ethers.utils.BigNumber
  ) => {
    let tx:any;
    // Processing and sanitizing input
    const parsedAmount = amount;
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    // Contract interaction
    setPostActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.post(fromAddr, amount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setPostActive(false);
      return;
    }
    // Transaction reporting & tracking
    notifyDispatch({ type: 'notify', payload:{ message:`Deposit of ${parsedAmount} pending...`, type:'info' } } );
    await tx.wait();
    setPostActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Deposit of ${parsedAmount} complete.`, type:'success' } } );
  };

  const withdraw = async (
    dealerAddress:string,
    to:string,
    amount:ethers.utils.BigNumber
  ) => {
    let tx:any;
    const parsedAmount = amount;
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setWithdrawActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.withdraw(toAddr, amount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      setWithdrawActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Withdraw of ${parsedAmount} pending...`, type:'info' } } );
    await tx.wait();
    setWithdrawActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Withdrawal of ${parsedAmount} complete.`, type:'success' } } );
  };

  const borrow = async (
    dealerAddress:string,
    maturity:string,
    to:string,
    amount:ethers.utils.BigNumber
  ) => {
    let tx:any;
    const parsedAmount = amount;
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setBorrowActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.borrow(maturity, toAddr, amount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setBorrowActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${parsedAmount} pending...`, type:'info' } } );
    await tx.wait();
    setBorrowActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${parsedAmount} complete.`, type:'success' } } );
  };

  const repay = async (
    dealerAddress:string,
    maturity:string,
    from:string,
    amount:ethers.utils.BigNumber,
    type:string
  ) => {
    let tx:any;
    const parsedAmount = amount;
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setRepayActive(true);

    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      if (type === 'YDAI') {
        tx = await contract.repayYDai(maturity, fromAddr, amount);
      } else if (type === 'DAI') {
        tx = await contract.repayDai(maturity, fromAddr, amount);
      }
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setRepayActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${parsedAmount} Dai pending...`, type:'info' } } );
    await tx.wait();
    setRepayActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${parsedAmount} yDai complete.`, type:'success' } } );
  };

  // Not strictly a Dealer Contract function. But associated enough to keep in here. 
  const approveDealer = async (
    tokenAddress:string,
    dealerAddress:string,
    amount:ethers.utils.BigNumber
  ) => {
    let tx:any;
    const parsedAmount = amount;
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    setApproveActive(true);

    const contract = new ethers.Contract(
      tokenAddr,
      TestERC20.abi,
      signer
    );

    try {
      tx = await contract.approve(dealerAddr, amount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setApproveActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${parsedAmount} pending...`, type:'info' } } );
    await tx.wait();
    setApproveActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${parsedAmount} complete. ${tokenAddress} and ${dealerAddress}`, type:'success' } } );
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
