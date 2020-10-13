import React, { useEffect, useState, useContext } from 'react';
import moment from 'moment';
import { Box, Text, Collapsible } from 'grommet';

import {
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
} from 'react-icons/fi';

import { UserContext } from '../contexts/UserContext';
import EtherscanButton from './EtherscanButton';
import { IYieldSeries } from '../types';
import Loading from './Loading';

interface HistoryProps {
  filterTerms: string[];
  series: IYieldSeries | null;
}

const TxHistory = ( { filterTerms, series }: HistoryProps) => {
  const { state } = useContext(UserContext);
  const [ txHistory, setTxHistory] = useState<any>([]);
  const [ itemOpen, setItemOpen ] = useState<any>(null);

  const HistoryItemName = (props:any) => {
    const { item } = props; 
    if ( item.event) {
      return (
        <Box direction='row' gap='xsmall' align='center'>
          <Text size='xsmall' color={series?.seriesColor || 'text-weak'}>{item.event}</Text>
          <Text size='xxsmall'> 
            { (item.event === 'Deposited' || item.event === 'Withdrew') && `${item.collateral} collateral`}
            { (item.event === 'Added' || item.event === 'Removed') && 'liquidity Tokens '}
            { item.maturity && moment.unix(item.maturity).format('MMMM YYYY') } 
            { item.APR && `@ ${item.APR.toFixed(2)}%` }
          </Text>
        </Box>
      );
    }
    return (
      <Box />
    );
  };

  const HistoryItemInfo = (props:any) => {
    const { item } = props;
    return (
      <Box 
        direction='row' 
        pad='small' 
        fill='horizontal'    
      > 
        { (item.event === 'Borrowed') && 
        <Box fill>
          <Text size='xxsmall'>Amount owed @ maturity</Text>
          <Text size='xsmall'>{Math.abs(item.fyDai_).toFixed(2)} Dai</Text>
        </Box> }
        
        { (item.event === 'Lent' ) && 
        <Box fill>
          <Text size='xxsmall'>Amount redeemable @ maturity</Text>
          <Text size='xsmall'>{Math.abs(item.fyDai_).toFixed(2)} Dai</Text>
        </Box> }

        <Box fill>
          <Box alignSelf='end'>
            <EtherscanButton txHash={item.transactionHash} />
          </Box>
        </Box>
      </Box>   
    );
  };

  useEffect(()=>{

  },);

  useEffect(()=> {
    let seriesFilteredHist;
    const _txHist = state.txHistory.items;
    const filteredHist = _txHist.filter((x:any) => filterTerms.includes(x.event));
    if ( series ) {
      seriesFilteredHist = filteredHist.filter((x:any) => (x.maturity === series.maturity) || (x.maturity === null) );
    } else {
      seriesFilteredHist = filteredHist;
    }
    const sortedList = seriesFilteredHist.sort( (a:any, b:any) => b.date - a.date ); 
    setTxHistory(sortedList);
  }, [ state.txHistory ]);

  return (
    <Loading condition={state.userLoading} size='large'>
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
            <Box align='center' pad='medium'>
              <Loading condition={state.userLoading} size='large'>
                <Box pad='xsmall'> 
                  <Text size='xxsmall'> No history yet.</Text>
                </Box>
              </Loading>
            </Box>}
          </Box>    
        </Box>  
      </Box>
    </Loading>
    
  );
};

export default TxHistory;
