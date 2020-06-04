import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers }  from 'ethers';

import { NotifyContext } from '../contexts/NotifyContext'; 

import YDai from '../contracts/YDai.json';
import Dealer from '../contracts/Dealer.json';
import Mint from '../contracts/Mint.json';

import TestERC20 from '../contracts/TestERC20.json';

// import Vat from '../contracts/Vat.json';
// import Pot from '../contracts/Pot.json';
// import Treasury from '../contracts/Treasury.json';
// import GemJoin from '../contracts/GemJoin.json';
// import DaiJoin from '../contracts/DaiJoin.json';

ethers.errors.setLogLevel('error');

const contractMap = new Map<string, any>([
  
  ['YDai', YDai.abi],
  ['Dealer', Dealer.abi],
  ['Mint', Mint.abi],
  ['Weth', TestERC20.abi],
  ['Chai', TestERC20.abi],
  // ['Vat', Vat.abi],
  // ['Pot', Pot.abi],
  // ['Treasury', Treasury.abi],
  // ['WethJoin', GemJoin.abi],
  // ['DaiJoin', DaiJoin.abi],
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
  const getWethBalance = async (tokenAddr:string) => {
    if (!!library && !!account) {
      const contract = new ethers.Contract(tokenAddr, contractMap.get('Weth'), library);
      const balance = await contract.balanceOf(account);
      return balance.toString();
    } return '';
  };
  return [getBalance, getWeiBalance, getWethBalance] as const;
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
  const [ postActive, setPostActive ] = React.useState<boolean>(false);
  const [ withdrawActive, setWithdrawActive ] = React.useState<boolean>(false);
  const [ borrowActive, setBorrowActive ] = React.useState<boolean>(false);
  const [ repayDaiActive, setRepayDaiActive ] = React.useState<boolean>(false);
  const [ repayYDaiActive, setRepayYDaiActive ] = React.useState<boolean>(false);
  const [ approveDealerActive, setApproveDealerActive ] = React.useState<boolean>(false);
  const signer = library?.getSigner();

  const post = async (dealerAddress:string, collateral:string, from:string, amount:number) => {
    // processing and sanitizing
    const amnt = formatNumber(amount);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);

    // contract interaction
    setPostActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    const tx = await contract.post(collateralBytes, fromAddr, amnt);

    // Transaction reporting
    console.log(`${tx.hash}: Deposit of ${amount} ${collateral} pending...`);
    await tx.wait();
    setPostActive(false);
    console.log(`Deposit of ${amount} ${collateral} complete. (tx: ${tx.hash})`);
  };

  const withdraw = async (dealerAddress:string, collateral:string, to:string, amount:number) => {
    const amnt = formatNumber(amount);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setWithdrawActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    const tx = await contract.withdraw(collateralBytes, toAddr, amnt);
    console.log(`Withdraw of ${amount} ${collateral} pending...${tx.hash}`);
    await tx.wait();
    setWithdrawActive(false);
    console.log(`Withdrawal of ${amount} ${collateral} complete (${tx.hash})`);
  };

  const borrow = async (dealerAddress:string, collateral:string, to:string, yDai:number) => {
    const amnt = formatNumber(yDai);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const toAddr = ethers.utils.getAddress(to);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setBorrowActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    const tx = await contract.borrow(collateralBytes, toAddr, amnt);
    console.log(`${tx.hash}: Borrowing of ${yDai} from ${collateral} pending...`);
    await tx.wait();
    setBorrowActive(false);
    console.log(`Borrowing of ${yDai} from ${collateral} complete. (${tx.hash})`);
  };

  const repayDai = async (dealerAddress:string, collateral:string, from:string, dai:number) => {
    const amnt = formatNumber(dai);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setRepayDaiActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    const tx = await contract.repayDai(collateralBytes, fromAddr, amnt);
    console.log(`${tx.hash}: Repayment of ${dai} Dai with ${collateral} pending...`);
    await tx.wait();
    setRepayDaiActive(false);
    console.log(`Repayment of ${dai} yDai with ${collateral} complete. (${tx.hash})`);
  };

  const repayYDai = async (dealerAddress:string, collateral:string, from:string, yDai:number) => {
    const amnt = formatNumber(yDai);
    const collateralBytes = ethers.utils.formatBytes32String(collateral);
    const fromAddr = ethers.utils.getAddress(from);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    setRepayYDaiActive(true);
    const contract = new ethers.Contract(
      dealerAddr,
      dealerAbi,
      signer
    );
    const tx = await contract.repayYDai(collateralBytes, fromAddr, amnt);
    console.log(`${tx.hash}: Repayment of ${yDai} yDai with ${collateral} pending...`);
    await tx.wait();
    setRepayYDaiActive(false);
    console.log(`Repayment of ${yDai} yDai complete. (${tx.hash})`);
  };

  const approveDealer = async (tokenAddress:string, dealerAddress:string, amount:number) => {
    const amnt = formatNumber(amount);
    const dealerAddr = ethers.utils.getAddress(dealerAddress);
    const tokenAddr = ethers.utils.getAddress(tokenAddress);
    setApproveDealerActive(true);
    const contract = new ethers.Contract(
      ethers.utils.getAddress(tokenAddr),
      TestERC20.abi,
      signer
    );
    const tx = await contract.approve(ethers.utils.getAddress(dealerAddr), amnt);
    console.log(`${tx.hash}: Token approval of ${amount} pending...`);
    await tx.wait();
    setApproveDealerActive(false);
    console.log(`Token approval of ${amount} complete. (${tx.hash})`);
  };

  return {
    post, postActive,
    withdraw, withdrawActive,
    borrow, borrowActive,
    repayDai, repayDaiActive,
    repayYDai, repayYDaiActive,
    approveDealer, approveDealerActive,
  } as const;
};

export const useMint = () => {
  const { library } = useWeb3React();
  const { abi: mintAbi } = Mint;
  const [ mintActive, setMintActive ] = React.useState<boolean>(false);
  const [ redeemActive, setRedeemActive ] = React.useState<boolean>(false);
  const signer = library?.getSigner();

  const mint = async (mintAddress:string, user:string, dai:number ) => {
    // Processing and sanitizing
    const amnt = formatNumber(dai);
    const userAddr = ethers.utils.getAddress(user);
    const mintAddr = ethers.utils.getAddress(mintAddress);

    // Contract interaction
    setMintActive(true);
    const contract = new ethers.Contract(
      mintAddr,
      mintAbi, 
      signer
    );

    // Transaction reporting
    const tx = await contract.mint(userAddr, amnt);
    console.log(`${tx.hash}: Minting ${dai} DAI worth of yDai. Tx pending...`);
    await tx.wait();
    setMintActive(false);
    console.log(`${dai} Dai worth of yDai minted. (${tx.hash})`);
  };

  const redeem = async (mintAddress:string, user:string, yDai:number )=> {
    const amnt = formatNumber(yDai);
    const userAddr = ethers.utils.getAddress(user);
    const mintAddr = ethers.utils.getAddress(mintAddress);

    setRedeemActive(true);
    const contract = new ethers.Contract(
      mintAddr,
      mintAbi,
      signer
    );
    const tx = await contract.reddem(userAddr, amnt);
    console.log(`${tx.hash}: Redeeming ${yDai} yDai. Tx pending...`);
    await tx.wait();
    setRedeemActive(false);
    console.log(`${yDai} yDai redeemed. (${tx.hash})`);
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
