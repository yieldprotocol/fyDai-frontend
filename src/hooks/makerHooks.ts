import React from 'react';

import Maker from '@makerdao/dai';
import { McdPlugin, ETH, DAI } from '@makerdao/dai-plugin-mcd';


export const useMaker = () => {

  const [openVaultActive, setOpenVaultActive] = React.useState<boolean>(false);
  const [convertVaultActive, setConvertVaultActive] = React.useState<boolean>(false);
  const [getVaultActive, setGetVaultActive] = React.useState<boolean>(false);
  
  const openVault = async (
  ) => {
    console.log('openVault');
  };

  const getVault = async (
  ) => {
    // const maker = await Maker.create('browser');
    // const mgr = maker.service('mcd:cdpManager');
    // console.log(maker);
  };

  const convertVault = async (
  ) => {
    console.log('convertVault');

  };

  return {
    getVault, getVaultActive,
    openVault, openVaultActive,
    convertVault, convertVaultActive, 
  } as const;

};
