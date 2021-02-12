import { useEffect, useState, useContext } from 'react';
import { ethers }  from 'ethers';

import ProxyRegistry from '../contracts/ProxyRegistry.json';

import { YieldContext } from '../contexts/YieldContext';
import { useSignerAccount } from './connectionHooks';
import { useTxHelpers } from './txHooks';

/**
 * Hook for interacting with the Yield Proxy Contract.
 * 
 * @returns { function } dsBuild
 * 
 */
export const useDsRegistry = () => {

  /* Preset the dsProxyRegistry contract to be used */
  const { abi: ProxyRegistryAbi } = ProxyRegistry;
  const [ proxyRegistryContract, setProxyRegistryContract] = useState<any>();
  const [ fallbackProxyRegistryContract, setFallbackProxyRegistryContract] = useState<any>();

  /* state from contexts */
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);

  /* hooks */ 
  const { fallbackProvider, signer, account} = useSignerAccount();
  const { handleTx, handleTxRejectError } = useTxHelpers();

  useEffect(()=>{
    deployedContracts?.ProxyRegistry && signer &&
      setProxyRegistryContract( new ethers.Contract(
        ethers.utils.getAddress(deployedContracts.ProxyRegistry),
        ProxyRegistryAbi,
        signer
      ));

    deployedContracts?.ProxyRegistry &&
      setFallbackProxyRegistryContract( new ethers.Contract(
        ethers.utils.getAddress(deployedContracts?.ProxyRegistry),
        ProxyRegistryAbi,
        fallbackProvider
      ));

  }, [signer, deployedContracts, ProxyRegistryAbi]);

  /**
   * @dev builds a DsProxy for the caller.
   * @param daiOut Amount of dai being bought
   * */
  const buildDsProxy = async () => {
    let tx:any;
    try {
      tx = await proxyRegistryContract['build()']();
    } catch (e) {
      handleTxRejectError(e);
      return;
    }
    // eslint-disable-next-line no-console
    console.log('Building dsProxy');
    await handleTx({ tx, msg:'Building new dsProxy', type:'CREATE_PROXY', series: null, value: null });
  };

  /**
   * @dev gets the registered dsProxy address if available
   * @returns {Promise<BigNumber>|null} 
   * @note call function
   */
  const getDsProxyAddress = async (
  ): Promise<string> => {

    const userAddr = account && ethers.utils.getAddress(account);
    console.log('user', userAddr);
    console.log(fallbackProxyRegistryContract);

    let res;
    try {
      res = await fallbackProxyRegistryContract.proxies(userAddr);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
    return res;
  };

  return {
    /* dsProxy eq. fns */
    buildDsProxy,
    getDsProxyAddress,
    
  } as const;
};