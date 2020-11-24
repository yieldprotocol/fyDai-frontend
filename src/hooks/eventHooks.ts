import { ethers }  from 'ethers';

import { useSignerAccount } from './connectionHooks';

import FYDai from '../contracts/FYDai.json';
import Controller from '../contracts/Controller.json';
import Dai from '../contracts/Dai.json';
import Pool from '../contracts/Pool.json';
import Vat from '../contracts/Vat.json';

// TODO abstract this out to a higher level
const contractMap = new Map<string, any>([
  ['FYDai', FYDai.abi],
  ['Controller', Controller.abi],
  ['Dai', Dai.abi],
  ['Pool', Pool.abi],
  ['Vat', Vat.abi], 
]);

/**
 * Hooks for subscribing to and getting events from any of the protocol contracts.
 * 
 * @returns { function } addEventListner
 * @returns { function } removeEventListener
 * @returns { function } getEvents
 */
export const useEvents = () => {
  const { provider } = useSignerAccount();

  /**
   * Setup an event listener.
   * @param {string} contractAddress address of the contract to send to.
   * @param {string} contractName name of the contract to call (uses this to get the abi from a contract map)
   * @param {string} event of the function to call 
   */
  const addEventListener = async (
    contractAddr:string,
    contractName:string,
    filterEvent:string,
    filterArgs:any[],
    callback:any
  ) => {
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), provider);
    const filter = contract.filters[filterEvent](...filterArgs);
    contract.on(filter, (x:any) => callback(x));
  };

  /**
   * Get a history of events, checking chached values first.
   * @param {string} contractAddress address of the contract to send to.
   * @param {string} contractName name of the contract to call (uses this to get the abi from a contract map)
   * @param {string} event of the function to call
   * @param {number} block the block to start looking from (searches from this block to latest).
   * 
   */
  const getEventHistory = async (
    contractAddr:string,
    contractName:string,
    filterEvent:string,
    filterArgs:any[],
    block:number
  ) => {
    const contract = new ethers.Contract(contractAddr, contractMap.get(contractName), provider);
    const filter = contract.filters[filterEvent](...filterArgs);
    const logs = await contract.queryFilter( filter, block, 'latest');
    return logs;
  };

  const parseEventList = async (eventList:any) => {
    const parsedList = Promise.all( eventList.map(async (x:any)=>{
      const { timestamp } = await provider.getBlock(x.blockNumber);
      return {
        ...x,
        date: timestamp,
        date_: new Date(timestamp*1000),
        args_: x.args.map((y:any)=>{
          if (ethers.BigNumber.isBigNumber(y)) {
            return y.toString();
          } if (ethers.utils.isAddress(y)) {
            return ethers.utils.getAddress(y);
          // eslint-disable-next-line no-constant-condition
          } if (typeof y) {
            return y;
          }
          return ethers.utils.parseBytes32String(y) || y;
          // TODO: deal with Hexstrings/bytes
        })
      };
    })
    );
    return parsedList;
  };

  return { getEventHistory, addEventListener, parseEventList } as const;

};
