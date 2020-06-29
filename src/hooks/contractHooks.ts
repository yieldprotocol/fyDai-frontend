import React from 'react';
import { ethers }  from 'ethers';
// import { useWeb3React } from '@web3-react/core';

import { NotifyContext } from '../contexts/NotifyContext';
import { ConnectionContext } from '../contexts/ConnectionContext';

import YDai from '../contracts/YDai.json';
import Dealer from '../contracts/Dealer.json';
import TestERC20 from '../contracts/TestERC20.json';
import EthProxy from '../contracts/EthProxy.json';

// ethers.errors.setLogLevel('error');

export const useEthProxy = () => {
  const { state: { signer, account } } = React.useContext(ConnectionContext);
  // const { library, account } = useWeb3React();
  // const signer = library.getSigner();

  const { abi: ethProxyAbi } = EthProxy;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ postEthActive, setPostEthActive ] = React.useState<boolean>(false);
  const [ withdrawEthActive, setWithdrawEthActive ] = React.useState<boolean>(false);

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
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed. See console.', type:'error' } } );
      console.log(e.message);
      setPostEthActive(false);
      return;
    }
    // Transaction reporting & tracking
    dispatch({ type: 'txPending', payload:{ tx, message: `Deposit of ${amount} ETH pending...` } } );
    await tx.wait();
    setPostEthActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Deposit of ${amount} ETH complete` } } );
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
      dispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      setWithdrawEthActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...` } } );
    await tx.wait();
    setWithdrawEthActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Withdrawal of ${amount} complete.` } } );
  };

  return {
    postEth, postEthActive,
    withdrawEth, withdrawEthActive,
  } as const;
};

export const useDealer = () => {
  const { abi: dealerAbi } = Dealer;
  
  const { state: { signer, account } } = React.useContext(ConnectionContext);
  // const { library, account } = useWeb3React();
  // const signer = library.getSigner();

  // const { library, account } = useWeb3React();
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ postActive, setPostActive ] = React.useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayActive, setRepayActive ] = React.useState<boolean>(false);
  const [ approveActive, setApproveActive ] = React.useState<boolean>(false);
  // const signer = library?.getSigner();

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
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setPostActive(false);
      return;
    }
    // Transaction reporting & tracking
    dispatch({ type: 'notify', payload:{ message:`Deposit of ${amount} pending...`, type:'info' } } );
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...` } } );
    await tx.wait();
    setPostActive(false);
    dispatch({ type: 'notify', payload:{ message: `Deposit of ${amount} complete.`, type:'success' } } );
    dispatch({ type: 'txComplete', payload:{ tx, message:`Deposit of ${amount} ETH complete` } } );
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
      dispatch({ type: 'notify', payload:{ message:'Error Withdrawing funds', type:'error' } } );
      console.log(e);
      setWithdrawActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Withdraw of ${amount} pending...` } } );
    await tx.wait();
    setWithdrawActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Withdrawal of ${amount} complete.` } } );
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
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setBorrowActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Borrowing of ${amount} pending...` } } );
    await tx.wait();
    setBorrowActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Borrowing of ${amount} complete.` } } );
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
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setRepayActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Repayment of ${amount} pending...` } } );
    await tx.wait();
    setRepayActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Repayment of ${amount} complete.` } } );
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
      dispatch({ type: 'notify', payload:{ message:'Transaction was aborted or it failed.', type:'error' } } );
      console.log(e);
      setApproveActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Token approval of ${amount} pending...` } } );
    await tx.wait();
    setApproveActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Token approval of ${amount} complete. ${tokenAddress} and ${dealerAddress}` } } );
  };

  return {
    post, postActive,
    withdraw, withdrawActive,
    borrow, borrowActive,
    repay, repayActive,
    approveDealer, approveActive,
  } as const;
};

export const useYDai = () => {

  const { state: { signer, account } } = React.useContext(ConnectionContext);
  // const { library, account } = useWeb3React();
  // const signer = library.getSigner();
  
  const { abi: yDaiAbi } = YDai;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ redeemActive, setRedeemActive ] = React.useState<boolean>(false);

  const redeem = async (
    yDaiAddress:string,
    amount: number
  ) => {
    let tx:any;
    const parsedAmount = ethers.utils.parseEther(amount.toString());
    const fromAddr = account && ethers.utils.getAddress(account);
    const toAddr = fromAddr;
    const yDaiAddr = ethers.utils.getAddress(yDaiAddress);

    setRedeemActive(true);
    const contract = new ethers.Contract( yDaiAddr, yDaiAbi, signer );
    try {
      tx = await contract.withdraw(fromAddr, toAddr, parsedAmount);
    } catch (e) {
      dispatch({ type: 'notify', payload:{ message:'Error Redeeming funds.', type:'error' } } );
      setRedeemActive(false);
      return;
    }
    dispatch({ type: 'txPending', payload:{ tx, message: `Redeeming ${amount} pending...` } } );
    await tx.wait();
    setRedeemActive(false);
    dispatch({ type: 'txComplete', payload:{ tx, message:`Redeeming ${amount} complete.` } } );
  };

  return {
    redeem, redeemActive
  } as const;
};
