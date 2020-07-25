import React from 'react';

import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI, BAT } from '@makerdao/dai-plugin-mcd';

// import { ConnectionContext } from '../contexts/ConnectionContext';
import { useSignerAccount } from './connectionHooks';

import rinkebyAddresses from '../contracts/makerAddrs/rinkeby.json';
import goerliAddresses from '../contracts/makerAddrs/goerli.json';
import ropstenAddresses from '../contracts/makerAddrs/ropsten.json';
import kovanAddresses from '../contracts/makerAddrs/kovan.json';

const networkOverrides = [
  {
    network: 'rinkeby',
    contracts: rinkebyAddresses
  },
  { network: 'goerli', contracts: goerliAddresses },
  { network: 'ropsten', contracts: ropstenAddresses },
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

  // const { state : { account, chainId, provider } } = React.useContext(ConnectionContext);

  const { signer, provider, account, altProvider, voidSigner } = useSignerAccount();

  // const { account, chainId, library } = useWeb3React();
  const [openVaultActive, setOpenVaultActive] = React.useState<boolean>(false);
  const [convertVaultActive, setConvertVaultActive] = React.useState<boolean>(false);
  const [getVaultActive, setGetVaultActive] = React.useState<boolean>(false);

  // const networkNumber = await chainId;

  const network = defineNetwork( provider.network.chainId || 0 );

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
    web3: {
      // @ts-ignore
      inject: window.ethereum || null
    },
  };

  const openNewVault = async (
  ) => {
    const maker = await Maker.create('browser', config);
    // verify that the private key was read correctly
    console.log(maker.currentAddress());
    await maker.service('proxy').ensureProxy();
    // use the "vault manager" service to work with vaults
    const manager = maker.service('mcd:cdpManager');
    // ETH-A is the name of the collateral type;
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
    console.log('Fetching your vaults vaults...');
    let proxyAddress:string|null=null;
    let vaults:Promise<any[]>|any[]=[];

    const maker = await Maker.create('browser', config );
    const manager = await maker.service('mcd:cdpManager');

    proxyAddress = await maker.service('proxy').getProxyAddress(account);
    if (proxyAddress) {
      const data = await manager.getCdpIds(proxyAddress); // returns list of { id, ilk } objects
      vaults = Promise.all( data.map( async (x:any) => {
        return manager.getCdp(data[0].id);
      }));
      console.log(await vaults);
      return vaults;
    }
    console.log(vaults);
    return vaults;
  };

  const convertVault = async (
  ) => {
    console.log('ConvertVault action required');
  };

  return {
    getVaults, getVaultActive,
    openNewVault, openVaultActive,
    convertVault, convertVaultActive,
  } as const;

};
