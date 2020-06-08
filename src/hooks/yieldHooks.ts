import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext'; 

import YDai from '../contracts/YDai.json';
import Dealer from '../contracts/Dealer.json';
import Mint from '../contracts/Mint.json';
import TestERC20 from '../contracts/TestERC20.json';

ethers.errors.setLogLevel('error');

const contractMap = new Map<string, any>([
  
  ['YDai', YDai.abi],
  ['Dealer', Dealer.abi],
  ['Mint', Mint.abi],
  ['Weth', TestERC20.abi],
  ['Chai', TestERC20.abi],

]);

export function useGetBalance() {
  const { library, account } = useWeb3React();
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
  const getWethBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Weth'), library);
      const balance = await contract.balanceOf(account);
      return balance.toString();
    } return '';
  };
  return { getBalance, getWeiBalance, getWethBalance } as const;
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

const formatNumber = (number:number):string => {
  return ethers.utils.parseEther(number.toString()).toString();
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

  const post = async (dealerAddress:string, collateral:string, from:string, amount:number) => {
    let tx:any;
    // Processing and sanitizing input
    const parsedAmount = formatNumber(amount);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    
    // Contract interaction
    setPostActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    try {
      tx = await contract.post(collateralBytes, fromAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setPostActive(false);
      return;
    }

    // Transaction reporting & tracking
    notifyDispatch({ type: 'notify', payload:{ message:`Deposit of ${amount} ${collateral} pending...`, type:'info' } } );
    await tx.wait();
    setPostActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Deposit of ${amount} ${collateral} complete.`, type:'success' } } );
  };

  const withdraw = async (dealerAddress:string, collateral:string, to:string, amount:number) => {
    let tx:any;
    const parsedAmount = formatNumber(amount);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setWithdrawActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    try {
      tx = await contract.withdraw(collateralBytes, toAddr, parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setWithdrawActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Withdraw of ${amount} ${collateral} pending...`, type:'info' } } );
    await tx.wait();
    setWithdrawActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Withdrawal of ${amount} ${collateral} complete.`, type:'success' } } );
  };

  const borrow = async (dealerAddress:string, collateral:string, to:string, yDai:number) => {
    let tx:any;
    const parsedYDai = formatNumber(yDai);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setBorrowActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    try {
      tx = await contract.borrow(collateralBytes, toAddr, parsedYDai);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setBorrowActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${yDai} from ${collateral} pending...`, type:'info' } } );
    await tx.wait();
    setBorrowActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Borrowing of ${yDai} from ${collateral} complete.`, type:'success' } } );
  };

  const repayDai = async (dealerAddress:string, collateral:string, from:string, dai:number) => {
    let tx:any;
    const parsedDai = formatNumber(dai);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setRepayActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    try {
      tx = await contract.repayDai(collateralBytes, fromAddr, parsedDai);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setRepayActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${dai} Dai with ${collateral} pending...`, type:'info' } } );
    await tx.wait();
    setRepayActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${dai} yDai with ${collateral} complete.`, type:'success' } } );
  };

  const repayYDai = async (dealerAddress:string, collateral:string, from:string, yDai:number) => {
    let tx:any;
    const parsedYDai = formatNumber(yDai);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setRepayActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    try {
      tx = await contract.repayYDai(collateralBytes, fromAddr, parsedYDai);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setRepayActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${yDai} yDai with ${collateral} pending...`, type:'info' } } );
    await tx.wait();
    setRepayActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Repayment of ${yDai} yDai complete.`, type:'success' } } );
  };

  // Not strictly a Dealer Contract function. But associated enough to keep in here. 
  const approveDealer = async (tokenAddress:string, dealerAddress:string, amount:number) => {
    let tx:any;
    const parsedAmount = formatNumber(amount);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    setApproveDealerActive(true);
    const contract = new ethers.Contract(
      ethers.utils.getAddress(tokenAddr),
      TestERC20.abi,
      signer
    );
    try {
      tx = await contract.approve(ethers.utils.getAddress(dealerAddr), parsedAmount);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setApproveDealerActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${amount} pending...`, type:'info' } } );
    await tx.wait();
    setApproveDealerActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `Token approval of ${amount} complete.`, type:'success' } } );
  };

  return {
    post, postActive,
    withdraw, withdrawActive,
    borrow, borrowActive,
    repayDai, repayActive,
    repayYDai, // repayYDaiActive,
    approveDealer, approveDealerActive,
  } as const;
};

export const useMint = () => {
  const { library } = useWeb3React();
  const signer = library?.getSigner();
  const { abi: mintAbi } = Mint;
  const  { dispatch: notifyDispatch }  = React.useContext<any>(NotifyContext);
  const [ mintActive, setMintActive ] = React.useState<boolean>(false);
  const [ redeemActive, setRedeemActive ] = React.useState<boolean>(false);

  const mint = async (mintAddress:string, user:string, dai:number ) => {
    let tx:any;
    // Processing and sanitizing
    const parsedDai = formatNumber(dai);
    const userAddr = ethers.utils.getAddress(user);
    const mintAddr = ethers.utils.getAddress(mintAddress);

    // Contract interaction
    setMintActive(true);
    const contract = new ethers.Contract(
      mintAddr,
      mintAbi, 
      signer
    );
    try {
      tx = await contract.mint(userAddr, parsedDai);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setMintActive(false);
      return;
    }

    // Transaction reporting/tracking
    notifyDispatch({ type: 'notify', payload:{ message: `Minting ${dai} DAI worth of yDai. Tx pending...`, type:'info' } });
    await tx.wait();
    setMintActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `${dai} Dai worth of yDai minted.`, type:'success' } });
  };

  const redeem = async (mintAddress:string, user:string, yDai:number )=> {
    let tx:any;
    const parsedYDai = formatNumber(yDai);
    const userAddr = ethers.utils.getAddress(user);
    const mintAddr = ethers.utils.getAddress(mintAddress);

    setRedeemActive(true);
    const contract = new ethers.Contract(
      mintAddr,
      mintAbi,
      signer
    );
    try {
      tx = await contract.redeem(userAddr, parsedYDai);
    } catch (e) {
      notifyDispatch({ type: 'notify', payload:{ message:`${e.data.message}`, type:'error' } } );
      setRedeemActive(false);
      return;
    }
    notifyDispatch({ type: 'notify', payload:{ message: `Redeeming ${yDai} yDai. Tx pending...`, type:'info' } } );
    await tx.wait();
    setRedeemActive(false);
    notifyDispatch({ type: 'notify', payload:{ message: `${yDai} yDai redeemed.`, type:'success' } } );
  };

  return [ 
    mint, mintActive,
    redeem, redeemActive,
  ] as const;
};

// SendTx is a generic function to interact with any contract
export const useSendTx = () => {
  const { library } = useWeb3React();
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
