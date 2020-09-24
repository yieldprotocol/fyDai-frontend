import React, { useEffect, useState, useContext } from 'react';
import moment from 'moment';
import { Box, Text, Collapsible, Button } from 'grommet';

import {
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
} from 'react-icons/fi';

import { UserContext } from '../contexts/UserContext';

interface HistoryProps {
  filterTerms: string[];
  view: string; // borrow, lend, pool
}

const EtherscanButton = (props:any) => {
  const { txHash } = props;
  return (
    <Box
      border
      round
      hoverIndicator='brand'
      onClick={()=>{ window.open( `https://etherscan.io/tx/${txHash}`, '_blank');}} 
      pad={{ horizontal:'small' }}
    >
      <Text 
        size='xxsmall'
      >
        View on Etherscan
      </Text>
    </Box>
  );
};

const TxHistory = ( { filterTerms, view }:HistoryProps) => {

  const { state, actions } = useContext(UserContext);

  const [ txHistory, setTxHistory] = useState<any>([]);
  const [ itemOpen, setItemOpen ] = useState<any>(null);

  // TODO NBNBNBNB improve preciseness of logic. may require a component split

  /* Cpmponent renaming pool events depending on the different views */
  const HistoryItemName = (props:any) => {
    const { item } = props;
    
    if (item.event === 'Bought') {
      return (
        <Box direction='row' gap='xsmall' align='center'>
          <Text size='xsmall' color='secondary'>
            { view === 'borrow' ? 'Borrowed' : 'Withdrew Dai' }           
          </Text>
          <Text size='xxsmall'> 
            { moment.unix(item.maturity).format('MMMM YYYY') } 
            { view === 'borrow' &&  `@ ${item.APR.toFixed(2)}%` }
          </Text>
        </Box>
      );
    } 
    
    if (item.event === 'Sold') {
      return (
        <>
          { view === 'lend' &&
          <Box direction='row' gap='xsmall' align='center'>
            <Text size='xsmall' color='secondary'>
              Lent               
            </Text>
            <Text size='xxsmall'> 
              { `${moment.unix(item.maturity).format('MMMM YYYY') } @ ${item.APR.toFixed(2)}%` }
            </Text>  
          </Box>}
        </>
      );
    } 

    /* cases covered: DEPOSIT, WITHDRAW, and REPAID */
    return (
      <Box direction='row' gap='xsmall' align='center'>
        <Text size='xsmall' color='secondary'>
          { item.event === 'Repaid'? 'Repaid Debt' : item.event }
        </Text>
        <Text size='xxsmall'> 
          { (item.event === 'Withdrew' || item.event === 'Deposited') ? 
            `${item.collateral} collateral` 
            : `${moment.unix(item.maturity).format('MMMM YYYY') }`}  
        </Text>
      </Box>
    );  
  };

  const HistoryItemInfo = (props:any) => {
    const { item } = props;
    return (
      <Box 
        direction='row' 
        justify='between'
        pad='small'     
      > 
        { (item.event === 'Bought' && view === 'borrow') && 
        <Box>
          <Text size='xxsmall'>Amount owed @ maturity</Text>
          <Text size='xsmall'>{Math.abs(item.eDai_).toFixed(2)} Dai</Text>
        </Box> }
        { (item.event === 'Sold' && view === 'lend') && 
        <Box>
          <Text size='xxsmall'>Amount redeemable @ maturity</Text>
          <Text size='xsmall'>{Math.abs(item.eDai_).toFixed(2)} Dai</Text>
        </Box> }
        <Box alignSelf='end'>
          <EtherscanButton txHash={item.transactionHash} />
        </Box>
      </Box>   
    );
  };

  useEffect(()=> {
    const _txHist = state.txHistory.items;
    const filteredHist = _txHist.filter((x:any) => filterTerms.includes(x.event) );  
    const sortedList = filteredHist.sort( (a:any, b:any) => a.date - b.date ); 
    setTxHistory(sortedList);
  }, [ state.txHistory ]);

  useEffect(()=> {
  }, [ txHistory ]);

  return (
    <Box
      background='background-front'
      fill='horizontal'
      round='small'
      pad='none'
      border
      height={{ max:'350px' }}
      overflow='auto'
    >
      <Box 
        direction='row'
        gap='xsmall'
        justify='between'
        background='background-mid'
        pad='small'
        round={{ size:'small', corner:'top' }}
      >
        <Box basis='50%'><Text color='text-weak' size='xxsmall'>TRANSACTION</Text></Box>
        <Box basis='25%' align='center'><Text color='text-weak' size='xxsmall'>AMOUNT</Text></Box>
        <Box basis='25%' align='center'><Text color='text-weak' size='xxsmall'>DATE</Text></Box>
        <Box><Text color='text-weak' size='xxsmall'>{' '}</Text></Box>
      </Box>

      <Box 
        height={{ min: '100px', max:'350px' }}
        overflow='auto'
        gap='xsmall'
      >
        <Box flex={false}>

          { txHistory.length > 0 ? txHistory.map((x:any, i:number)=>{
            const key_ = i;
            return (            
              <Box
                key={key_}
                pad='small'          
                gap='xsmall'             
                hoverIndicator='background-mid'
                background={itemOpen === key_ ? 'background-mid' : undefined}
                onClick={itemOpen === key_ ? ()=>setItemOpen(null):()=>setItemOpen(key_)}
              >         
                <Box
                  direction='row'
                  align='center'
                  justify='between'
                >
                  <Box basis='50%'>
                    <Text size='xsmall'>
                      <HistoryItemName item={x} />                           
                    </Text>
                  </Box>
                  <Box basis='25%' align='center'><Text size='xsmall'> {x.amount.toFixed(2)} </Text></Box>
                  <Box basis='25%' align='center'><Text size='xsmall'> {moment(x.date_).format('DD MMMM YYYY')} </Text></Box>
                  <Box>
                    <Text size='xsmall'> 
                      {itemOpen !== key_ ? <ChevronDown /> : <ChevronUp /> }
                    </Text>
                  </Box>
                </Box>
                <Collapsible open={itemOpen === key_}>
                  <HistoryItemInfo item={x} />
                </Collapsible>           
              </Box> 
            );
          }):
          <Box align='center'>
            { state.userLoading ? 
              <Box pad='xsmall'> 
                <Text size='xxsmall'>Loading...</Text> 
              </Box>
              : 
              <Box pad='xsmall'> 
                <Text size='xxsmall'> No history yet.</Text>
              </Box>} 
          </Box>}
        </Box>
      </Box>
    </Box>
  );
};

export default TxHistory;
