import React from 'react';
import { ethers, BigNumber }  from 'ethers';
import { NotifyContext } from '../contexts/NotifyContext';
// import { ConnectionContext } from '../contexts/ConnectionContext';
import { useSignerAccount } from './connectionHooks';

import Migration from '../contracts/Migrations.json';

// ethers.errors.setLogLevel('error');

const migrationAddrs = new Map([
  [1337, process.env.REACT_APP_MIGRATION ], // '0xAC172aca69D11D28DFaadbdEa57B01f697b34158'
  [1, '0x5632d2e2AEdf760F13d0531B18A39782ce9c814F'],
  [4, '0x08475B228575eFCb2e5d71E1B737deCeEdf21Db8'],
]);

/**
 * Hook for interacting with the yield 'YDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useMigrations = () => {

  // const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { provider, fallbackProvider, signer, account } = useSignerAccount();

  const { abi: migrationAbi } = Migration;
  const  { dispatch }  = React.useContext<any>(NotifyContext);

  const [migrationAddress, setMigrationsAddress] = React.useState<string>(process.env.REACT_APP_MIGRATION || '');
  
  React.useEffect(()=>{
    setMigrationsAddress( process.env.REACT_APP_MIGRATION || '');
  }, []);

  /**
   * Concurrently fetches Yield Addresses registered with the migrations contract.
   * 
   * @param {string[]} contractNameList names address of the yDai series to redeem from.
   * 
   * @returns {Map} keyed with contract names
   */
  const getAddresses = async (
    contractNameList:string[],
  ) => {
    const contract = new ethers.Contract(migrationAddress, migrationAbi, fallbackProvider );
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