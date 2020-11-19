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
 * @returns { boolean } buildActive
 * 
 */
export const useDsRegistry = () => {

  /* contexts */
  const  { state: { deployedContracts } }  = useContext<any>(YieldContext);

  /* hooks */ 
  const { signer, account } = useSignerAccount();
  const { handleTx, handleTxRejectError } = useTxHelpers();
  
  /* Activity flags */
  const [ buildActive, setBuildActive ] = useState<boolean>(false);

  /* Preset the dsProxyRegistry contract to be used */
  const { abi: ProxyRegistryAbi } = ProxyRegistry;
  const [ proxyRegistryContract, setProxyRegistryContract] = useState<any>();
  
  useEffect(()=>{
    deployedContracts.ProxyRegistry && signer &&
      setProxyRegistryContract( new ethers.Contract(
        ethers.utils.getAddress(deployedContracts.ProxyRegistry),
        ProxyRegistryAbi,
        signer
      ));
  }, [signer, deployedContracts.ProxyRegistry, ProxyRegistryAbi]);

  /**
   * @dev builds a DsProxy for the caller.
   * @param daiOut Amount of dai being bought
   * */
  const buildDsProxy = async () => {
    let tx:any;
    setBuildActive(true);
    try {
      tx = await proxyRegistryContract['build()']();
    } catch (e) {
      handleTxRejectError(e);
      setBuildActive(false);
      return;
    }
    console.log('building dsProxy');
    await handleTx({ tx, msg:'Building new dsProxy', type:'CREATE_PROXY', series:null });
    setBuildActive(false);
  };

  /**
   * @dev gets the registered dsProxy address if available
   * @returns {Promise<BigNumber>|null} 
   * @note call function
   */
  const getDsProxyAddress = async (
  ): Promise<string> => {
    const userAddr = account && ethers.utils.getAddress(account);
    let res;
    try {
      res = await proxyRegistryContract.proxies(userAddr);
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
    return res;
  };

  return {
    /* dsProxy eq. fns */
    buildDsProxy, buildActive,
    getDsProxyAddress,
  } as const;
};