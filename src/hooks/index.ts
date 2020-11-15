/* Connection hook web3React */
import { useWeb3React } from '@web3-react/core';
import { useSignerAccount, useConnection } from './connectionHooks';

/* General app hooks */
import { useCachedState, useDebounce, useIsLol } from './appHooks';
import { useEvents } from './eventHooks';

/* Utility hooks */
import { useMath } from './mathHooks';
import { useAuth } from './authsHook';

/* Generic blockchain transactional hooks */
import { useCallTx, useSendTx, useTimeTravel } from './chainHooks'; 
import { useToken } from './tokenHook';
import { useTxActive, useTxHelpers } from './txHooks';

/* Contract hooks */
import { useMigrations } from './migrationHook';
import { useController } from './controllerHook';
import { useProxy } from './yieldProxyHook';
import { usePool } from './poolHook';
import { useFYDai } from './fyDaiHook';

import { useDsRegistry } from './dsRegistryHook';
import { useDsProxy } from './dsProxyHook';

import { useBorrowProxy } from './borrowProxyHook';

export {

  useTxActive,
  useTxHelpers,
  useCachedState,
  useDebounce,
  useSendTx,
  useCallTx,
  useIsLol,
  
  useAuth,
  useProxy,
  useController,
  useFYDai,
  useMigrations,
  usePool,

  useEvents,
  useMath,
  useToken,

  useWeb3React,

  useDsRegistry,
  useDsProxy,

  useBorrowProxy,
  
  useSignerAccount, 
  useConnection,

  useTimeTravel, 
};