import React from 'react';
import { ethers, BigNumber }  from 'ethers';
import { NotifyContext } from '../contexts/NotifyContext';
// import { ConnectionContext } from '../contexts/ConnectionContext';
import { useSignerAccount } from './connectionHooks';

import Migration from '../contracts/Migrations.json';

// ethers.errors.setLogLevel('error');

const migrationAddr = new Map([
  [1337, process.env.REACT_APP_MIGRATION ],
  [1, '0x5632d2e2AEdf760F13d0531B18A39782ce9c814F'],
  [3, '0x5632d2e2AEdf760F13d0531B18A39782ce9c814F'],
  [4, '0x5632d2e2AEdf760F13d0531B18A39782ce9c814F'],
  [5, '0x5632d2e2AEdf760F13d0531B18A39782ce9c814F'],
  [42, '0x5632d2e2AEdf760F13d0531B18A39782ce9c814F'],
]);

/**
 * Hook for interacting with the yield 'YDAI' Contract
 * @returns { function } redeem
 * @returns { boolean } redeemActive
 */
export const useMigrations = () => {

  // const { state: { signer, account } } = React.useContext(ConnectionContext);
  const { provider, signer, account } = useSignerAccount();

  const { abi: migrationAbi } = Migration;
  const  { dispatch }  = React.useContext<any>(NotifyContext);
  const [ fetchAddressesActive, setFetchAddressesActive ] = React.useState<boolean>(false);

  const [migrationAddress, setMigrationsAddress] = React.useState<string>(migrationAddr.get(1337) || '');
  React.useEffect(()=>{
    setMigrationsAddress( migrationAddr.get(1337) || '');
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
    const contract = new ethers.Contract(migrationAddress, migrationAbi, provider );
    let res = new Map<string, string>();
    try {
      const contractAddrs = await Promise.all(
        contractNameList.map(async (x: string) => {
          res.set( x, await contract.contracts(ethers.utils.formatBytes32String(x)))
        })
      );
    } catch (e) {
      console.log(e);
      res = new Map();
    }
    return res;
  };

  return {
    getAddresses,
  } as const;
};