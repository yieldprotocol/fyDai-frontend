import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext'; 

import YDai from '../contracts/YDai.json';
import Dealer from '../contracts/Dealer.json';

import TestERC20 from '../contracts/TestERC20.json';
import WETH9 from '../contracts/WETH9.json';

import GemJoin from '../contracts/GemJoin.json';
import DaiJoin from '../contracts/DaiJoin.json';
import Chai from '../contracts/Chai.json';
import Vat from '../contracts/Vat.json';
import Pot from '../contracts/Pot.json';


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
  const callTx = async (contractAddr:string, contractName:string, fn:string, data:any[] ) => {
    setCallTxActive(true);
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), library);
    const retVal = await contract[fn](...data);
    setCallTxActive(false);
    return retVal;
  };
  return [ callTx, callTxActive ] as const;
};

const formatNumber = (input:any):string => {
  // let parsedAmount;
  // if ( type === 'WETH') {
  //   ethers.utils.parseEther(number.toString()).toString();
  // } else if ( type === 'CHAI') { parsedAmount = number; }
  // return ethers.utils.parseEther(input.toString()).toString();
  // return parsedAmount;
  return input;
  // return input.toString();
};

export const useDealer = () => {
  const { abi: dealerAbi } = Dealer;
  const { library, account } = useWeb3React();
  const  { dispatch: notifyDispatch }  = React.useContext<any>(NotifyContext);
  const [ postActive, setPostActive ] = React.useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  // const [ repayYDaiActive, setRepayYDaiActive ] = React.useState<boolean>(false);
  const [ approveDealerActive, setApproveDealerActive ] = React.useState<boolean>(false);
  const signer = library?.getSigner();

  const post = async (dealerAddress:string, from:string, amount:ethers.utils.BigNumber ) => {
    let tx:any;
    // Processing and sanitizing input
    const parsedAmount = formatNumber(amount);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    // Contract interaction
    setPostActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.post(fromAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setPostActive(false);
      return;
    }
    // Transaction reporting & tracking
    notifyDispatch({ type: 'notify', payload:{ message:`Deposit of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setPostActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Deposit of ${amount} complete.`, type:'success' } } );
  };

  const withdraw = async (dealerAddress:string, to:string, amount:ethers.utils.BigNumber) => {
    let tx:any;
    const parsedAmount = formatNumber(amount);
    // const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setWithdrawActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.withdraw(toAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setWithdrawActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Withdraw of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setWithdrawActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Withdrawal of ${amount} complete.`, type:'success' } } );
  };

  const borrow = async (dealerAddress:string, maturity:string, to:string, yDai:ethers.utils.BigNumber) => {
    let tx:any;
    const parsedYDai = formatNumber(yDai);
    // const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setBorrowActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      tx = await contract.borrow(maturity, toAddr, parsedYDai);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setBorrowActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${yDai} pending...`, type:'info' } } );
    await tx.wait();
    setBorrowActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${yDai} complete.`, type:'success' } } );
  };

  const repay = async (dealerAddress:string, maturity:string, from:string, dai:ethers.utils.BigNumber, type:string) => {
    let tx:any;
    const parsedDai = formatNumber(dai);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);

    setRepayActive(true);
    const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
    try {
      if (type === 'YDAI') {
        tx = await contract.repayYDai(maturity, fromAddr, parsedDai);
      } else if (type === 'DAI') {
        tx = await contract.repayDai(maturity, fromAddr, parsedDai);
      }
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setRepayActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${dai} Dai pending...`, type:'info' } } );
    await tx.wait();
    setRepayActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${dai} yDai complete.`, type:'success' } } );
  };

  // const repayYDai = async (dealerAddress:string, maturity:string, from:string, yDai:ethers.utils.BigNumber) => {
  //   let tx:any;
  //   const parsedYDai = formatNumber(yDai);
  //   const fromAddr = ethers.utils.getAddress(from);
  //   const dealerAddr = ethers.utils.getAddress(dealerAddress);
  //   setRepayActive(true);
  //   const contract = new ethers.Contract( dealerAddr, dealerAbi, signer );
  //   try {
  //     tx = await contract.repayYDai(maturity, fromAddr, parsedYDai);
  //   } catch (e) {
  //     notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
  //     setRepayActive(false);
  //     return;
  //   }
  //   notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${yDai} yDai pending...`, type:'info' } } );
  //   await tx.wait();
  //   setRepayActive(false);
  //   notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${yDai} yDai complete.`, type:'success' } } );
  // };

  // Not strictly a Dealer Contract function. But associated enough to keep in here. 
  const approveDealer = async (tokenAddress:string, dealerAddress:string, amount:ethers.utils.BigNumber) => {
    let tx:any;
    const parsedAmount = formatNumber(amount);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    setApproveDealerActive(true);

    const contract = new ethers.Contract(
      tokenAddr,
      TestERC20.abi,
      signer
    );

    try {
      tx = await contract.approve(dealerAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setApproveDealerActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setApproveDealerActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${amount} complete. ${tokenAddress} and ${dealerAddress}`, type:'success' } } );
  };

  return {
    post, postActive,
    withdraw, withdrawActive,
    borrow, borrowActive,
    repay, repayActive,
    approveDealer, approveDealerActive,
  } as const;
};

// SendTx is a generic function to interact with any contract, primarily used for development/testing.
export const useSendTx = () => {
  const { library, account } = useWeb3React();
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
