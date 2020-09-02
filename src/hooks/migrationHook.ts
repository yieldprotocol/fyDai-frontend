import React from 'react';
import { ethers }  from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { useSignerAccount } from './connectionHooks';

import Migration from '../contracts/Migrations.json';

const migrationAddrs = new Map([
  [1, process.env.REACT_APP_MIGRATION_1],
  [4, process.env.REACT_APP_MIGRATION_4 ],
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
  const [migrationsAddress, setMigrationsAddress] = React.useState<string>( process.env.REACT_APP_MIGRATION_DEFAULT || '');
  
  React.useEffect(()=>{
    if (chainId) {
      const migAddr = migrationAddrs.get(chainId);
      migAddr && setMigrationsAddress(migAddr);
    } 
  }, [chainId]);

  /**
   * Concurrently fetches Yield Addresses registered with the migrations contract.
   * @param {string[]} contractNameList list of contract names registered in the migrations contract.
   * @returns {Map} keyed with contract names
   */
  const getAddresses = async (
    contractNameList:string[],
  ) => {
    const contract = new ethers.Contract(migrationsAddress, migrationAbi, fallbackProvider );
    const res = new Map<string, string>();
    await Promise.all(
      contractNameList.map(async (x: string) => {
        res.set( x, await contract.contracts(ethers.utils.formatBytes32String(x)));
      })
    );
    return res;
  };

  return {
    getAddresses,
  } as const;
};