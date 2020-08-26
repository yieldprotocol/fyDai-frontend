import React from 'react';
import { ethers, BigNumber }  from 'ethers';
import { signDaiPermit, signERC2612Permit } from 'eth-permit';

import * as utils from '../utils';

import { useSignerAccount } from '.';
import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';

import Controller from '../contracts/Controller.json';
import YDai from '../contracts/YDai.json';

// import Controller from '../contracts/Controller.json';

interface IDelegableMessage {
  user: string;
  delegate: string;
  nonce: number | string;
  deadline: number | string;
}

export const useAuth = () => {

  const { account, provider } = useSignerAccount();
  const { state: { deployedSeries, deployedContracts } } = React.useContext(YieldContext);

  /**
   * 
   *  Once off Yield Controller and Dai authorization
   * 
   */
  const yieldAuth = async ( ) => {

    /* Sanitize and Parse */ 
    const controllerAddr = ethers.utils.getAddress(deployedContracts.Controller);
    const daiAddr = ethers.utils.getAddress(deployedContracts.Dai);
    const proxyAddr = ethers.utils.getAddress(deployedContracts.Dai);
    const fromAddr = account && ethers.utils.getAddress(account);

    const controllerContract = new ethers.Contract( controllerAddr, Controller.abi, provider);

    // @ts-ignore
    const daiSig = await signDaiPermit(provider.provider, daiAddr, fromAddr, proxyAddr);

    console.log(daiSig);

    const controllerNonce = await controllerContract.signatureCount(fromAddr);
    const msg: IDelegableMessage = {
      user: account|| '',
      delegate: proxyAddr,
      nonce: controllerNonce,
      deadline: 'uint(-1)'
    };

    // @ts-ignore
    const controllerDelegate = await signDaiPermit(provider.provider, daiAddr, fromAddr, proxyAddr);


    console.log(daiSig, controllerDelegate );

  };


  /**
   * 
   * 
   * 
   */
  const poolAuth = (
    yDaiAddress:string,
    poolAddress:string
  ) => {

    /* Sanitize and Parse */ 
    const poolAddr = ethers.utils.getAddress(poolAddress);
    const yDaiAddr = ethers.utils.getAddress(yDaiAddress);

    const controllerAddr = ethers.utils.getAddress(deployedContracts.Controller);
    const daiAddr = ethers.utils.getAddress(deployedContracts.Dai);

    const proxyAddr = ethers.utils.getAddress(deployedContracts.Dai);
    const fromAddr = account && ethers.utils.getAddress(account);

    // // @ts-ignore
    // const daiSig = await signDaiPermit(provider.provider, daiAddr, fromAddr, proxyAddr);

    // // @ts-ignore
    // const yDaiSig = await signDaiPermit(provider.provider, yDaiAddr, fromAddr, proxyAddr);

  };

  return {
    yieldAuth,
    poolAuth,
  };

};
