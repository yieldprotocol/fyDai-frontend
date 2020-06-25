import React from 'react';

import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, BAT } from '@makerdao/dai-plugin-mcd';

import { ethers } from 'ethers';

import { Web3Context } from '../contexts/Web3Context';

import rinkebyAddresses from '../contracts/testnetAddrs/rinkeby.json';
import goerliAddresses from '../contracts/testnetAddrs/goerli.json';
import ropstenAddresses from '../contracts/testnetAddrs/ropsten.json';
import kovanAddresses from '../contracts/testnetAddrs/kovan.json';

const networkOverrides = [
  {
    network: 'rinkeby',
    contracts: rinkebyAddresses
  },
  { network: 'goerli', contracts: goerliAddresses },
  { network: 'ropsten', contracts: ropstenAddresses }
].reduce((acc, { network, contracts }) => {
  for (const [contractName, contractAddress] of Object.entries(contracts)) {
    // @ts-ignore
    if (!acc[contractName]) acc[contractName] = {};
    // @ts-ignore
    acc[contractName][network] = contractAddress;
  }
  return acc;
}, {});

const cdpTypes = [
  { currency: ETH, ilk: 'ETH-A' },
  // { currency: BAT, ilk: 'BAT-A' }
];

const defineNetwork = (_networkId:number) => {
  const network = {
    network: ''
  };
  switch (Number(_networkId)) {
    case 3:
      network.network = 'ropsten';
      break;
    case 4:
      network.network = 'rinkeby';
      break;
    case 42:
      network.network = 'kovan';
      break;
    case 5:
      network.network = 'goerli';
      break;
    default:
      return network;
  }
  return network;
};

export const useMaker = () => {

  const { state : { account, chainId, provider } } = React.useContext(Web3Context);
  const [openVaultActive, setOpenVaultActive] = React.useState<boolean>(false);
  const [convertVaultActive, setConvertVaultActive] = React.useState<boolean>(false);
  const [getVaultActive, setGetVaultActive] = React.useState<boolean>(false);

  // const networkNumber = await chainId;
  const network = defineNetwork(chainId);

  const addressOverrides = ['rinkeby', 'ropsten', 'goerli'].some(
    networkName => networkName === network.network
  ) ? networkOverrides
    : {};

  const mcdPluginConfig = {
    cdpTypes,
    addressOverrides
  };

  const config = {
    plugins: [
      [McdPlugin, mcdPluginConfig]
    ],
    smartContract: {
      addressOverrides
    },
  };

  
  const openVault = async (
  ) => {
    const maker = await Maker.create('browser', config);
    // verify that the private key was read correctly
    console.log(maker.currentAddress());
    
    await maker.service('proxy').ensureProxy();

    // use the "vault manager" service to work with vaults
    const manager = maker.service('mcd:cdpManager');

    // ETH-A is the name of the collateral type; in the future,
    // there could be multiple collateral types for a token with
    // different risk parameters
    const vault = await manager.openLockAndDraw(
      'ETH-A',
      ETH(1),
      DAI(50)
    );
    console.log(vault.id);
    console.log(vault.debtValue);

  };

  const getVaults = async (
  ) => {
    const maker = await Maker.create('browser', {
      plugins: [McdPlugin],

    });
    const manager = maker.service('mcd:cdpManager');
    const proxyAddress = await maker.service('proxy').getProxyAddress(account);
    const data = await manager.getCdpIds(proxyAddress); // returns list of { id, ilk } objects
    if (data.length > 0) {
      const vault = await manager.getCdp(data[0].id);
      console.log([
        vault.id,
        vault.collateralAmount, // amount of collateral tokens
        vault.collateralValue,  // value in USD, using current price feed values
        vault.debtValue,        // amount of Dai debt
        vault.collateralizationRatio, // collateralValue / debt
        vault.liquidationPrice  // vault becomes unsafe at this price
      ].map(x => x.toString()));
    } else console.log('No Vaults found');
  };

  const convertVault = async (
  ) => {
    console.log('convertVault');
  };

  const connectVault = async (
  ) => {
    const maker = await Maker.create('browser', config );
    const manager = await maker.service('mcd:cdpManager');
    const proxyAddress = await maker.service('proxy').getProxyAddress(account);

    const data = await manager.getCdpIds(proxyAddress); // returns list of { id, ilk } objects
    if (data.length > 0) {
      const vault = await manager.getCdp(data[0].id);
      console.log([
        vault.id,
        vault.collateralAmount, // amount of collateral tokens
        vault.collateralValue,  // value in USD, using current price feed values
        vault.debtValue,        // amount of Dai debt
        vault.collateralizationRatio, // collateralValue / debt
        vault.liquidationPrice  // vault becomes unsafe at this price
      ].map(x => x.toString()));
      console.log(vault);
    } else console.log('No Vaults found');
  };

  return {
    getVaults, getVaultActive,
    openVault, openVaultActive,
    convertVault, convertVaultActive,
    connectVault
  } as const;

};
