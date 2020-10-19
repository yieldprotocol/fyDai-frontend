import { useEffect, useState } from 'react';
import { ethers }  from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { useSignerAccount } from './connectionHooks';

import Migration from '../contracts/Migrations.json';

const migrationAddrs = new Map([
  [1, process.env.REACT_APP_MIGRATION_1],
  [4, process.env.REACT_APP_MIGRATION_4 ],
  [5, process.env.REACT_APP_MIGRATION_5 ],
  [42, process.env.REACT_APP_MIGRATION_42 ],
  [1337, process.env.REACT_APP_MIGRATION_1337 ],
  [31337, process.env.REACT_APP_MIGRATION_31337 ],
]);

/**
 * Hook for interacting with the yield 'YDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useMigrations = () => {
  const { chainId } = useWeb3React('fallback');
  const { fallbackProvider } = useSignerAccount();
  const { abi: migrationAbi } = Migration;
  const [migrationsAddress, setMigrationsAddress] = useState<string>( process.env.REACT_APP_MIGRATION_DEFAULT || '');
  
  useEffect(()=>{
    if (chainId) {
      const migAddr = migrationAddrs.get(chainId);
      migAddr && setMigrationsAddress(migAddr);
    } 
  }, [chainId]);

  /**
   * Concurrently fetches Yield Addresses registered with the migrations contract.
   * @param {string[]} contractNameList list of contract names registered in the migrations contract.
   * @returns {Promise<Map>} keyed with contract names
   */
  const getAddresses = (
    contractNameList: string[],
  ): { [name: string]: string; } => {
    // eslint-disable-next-line no-console
    console.log('Loading addrs for contracts', contractNameList);
    const addresses = require("./addresses.json")[chainId!]
    const res = Object.keys(addresses).reduce((filtered: any, key) => {
        if (contractNameList.indexOf(key) !== -1) filtered[key] = addresses[key];
        return filtered;
    }, {});
    return res;
  };

  const getFyDaiNames = (): string[] => {
    const addresses = require("./addresses.json")[chainId!]
    return Object.keys(addresses).filter((x) => x.startsWith('fyDai') && x.indexOf('LP') === -1)
  }

  /**
   * Fetches Yield protocol contract version from 
   * @returns {string} yield protocol version
   */
  const getYieldVersion = async (
  ) => {
    const contract = new ethers.Contract(migrationsAddress, migrationAbi, fallbackProvider );
    let res;
    try {
      res = await contract.version();
    }  catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
      res = false;
    }
    return res;
  };

  return {
    getAddresses, getYieldVersion, getFyDaiNames,
  } as const;
};
