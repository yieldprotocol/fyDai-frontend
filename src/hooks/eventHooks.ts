import React from 'react';
import { ethers }  from 'ethers';
// import { ConnectionContext } from '../contexts/ConnectionContext';

import { useSignerAccount } from './connectionHooks';

import EDai from '../contracts/EDai.json';
import Controller from '../contracts/Controller.json';
import TestDai from '../contracts/TestDai.json';
import WETH9 from '../contracts/WETH9.json';
import GemJoin from '../contracts/GemJoin.json';
import DaiJoin from '../contracts/DaiJoin.json';
import Chai from '../contracts/Chai.json';
import Vat from '../contracts/Vat.json';
import Pot from '../contracts/Pot.json';
import YieldProxy from '../contracts/YieldProxy.json';
import Pool from '../contracts/Pool.json';

// TODO abstract this out to a higher level
const contractMap = new Map<string, any>([
  ['EDai', EDai.abi],
  ['Controller', Controller.abi],
  ['Dai', TestDai.abi],
  ['Weth', WETH9.abi],
  ['Chai', Chai.abi],
  ['WethJoin', GemJoin.abi],
  ['DaiJoin', DaiJoin.abi],
  ['Vat', Vat.abi],
  ['Pot', Pot.abi],
  ['YieldProxy', YieldProxy.abi],
  ['Pool', Pool.abi],
]);

/**
 * Hooks for subscribing to and getting events from any of the protocol contracts.
 * 
 * @returns { function } addEventListner
 * @returns { function } removeEventListener
 * @returns { function } getEvents
 */
export const useEvents = () => {
  // const { state: { provider } } = React.useContext(ConnectionContext);
  const { provider } = useSignerAccount();
  const [ eventListenerList, setEventListenerList ] = React.useState<boolean>();
  const [ isLoading, setIsLoading ] = React.useState<boolean>();

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

  return { getEventHistory, addEventListener, parseEventList, isLoading, eventListenerList } as const;

};
