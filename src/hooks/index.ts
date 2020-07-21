/* general app hooks */
import { useCachedState, useDebounce, useTxActive } from './appHooks';
import { useEvents } from './eventHooks';

/* Generic blockchain transactional hooks */
import { useCallTx, useSendTx, useBalances } from './transactionHooks';

/* Protocol specific hooks */
import { useMaker } from './makerHooks';
import { useMath } from './mathHooks'; // TODO work out this cyclic reference (not critical)

/* Contract hooks */
import { useYDai} from './yDaiHook';
import { useController } from './controllerHook';
import { useEthProxy } from './ethProxyHook';
import { useMarket } from './marketHooks';

export {
  useMarket,
  useTxActive,
  useCachedState,
  useDebounce,
  useSendTx,
  useCallTx,
  useBalances,
  useEthProxy,
  useController,
  useYDai,
  useMaker,
  useEvents,
  useMath,
};