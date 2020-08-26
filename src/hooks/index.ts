/* Connection hook web3React */
import { useWeb3React } from '@web3-react/core';
import { useEagerConnect, useInactiveListener, useConnectorImage, useSignerAccount, useConnection } from './connectionHooks';

/* General app hooks */
import { useCachedState, useDebounce, useTxActive } from './appHooks';
import { useEvents } from './eventHooks';

/* Utility hooks */
import { useMath } from './mathHooks';  // TODO work out this cyclic reference (not critical)
// import { useMaker } from './makerHooks';

/* Generic blockchain transactional hooks */
import { useCallTx, useSendTx, useBalances, useTimeTravel } from './chainHooks'; 
import { useToken } from './tokenHook';

/* Contract hooks */
import { useYDai } from './yDaiHook';
import { useController } from './controllerHook';
import { useProxy } from './proxyHook';
import { usePool } from './poolHook';
import { useMigrations } from './migrationHook';

import { useLiquidityProxy } from './liquidityProxyHook';

import { useAuth } from './authHook';

export {
  usePool,
  useTxActive,
  useCachedState,
  useDebounce,
  useSendTx,
  useCallTx,
  useBalances,

  useAuth,

  useLiquidityProxy,

  useProxy,
  useController,
  useYDai,
  useMigrations,

  useEvents,
  useMath,
  useToken,

  useWeb3React,
  useEagerConnect,
  useInactiveListener,
  useConnectorImage,
  useSignerAccount, 
  useConnection,

  useTimeTravel, 
};