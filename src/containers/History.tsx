import React, { useEffect, useState, useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, Text, Collapsible, ThemeContext } from 'grommet';
import { format } from 'date-fns';

import {
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
} from 'react-icons/fi';

import { UserContext } from '../contexts/UserContext';
import EtherscanButton from '../components/EtherscanButton';
import { IYieldSeries } from '../types';
import Loading from '../components/Loading';
import HashWrap from '../components/HashWrap';
import { modColor, cleanValue, nameFromMaturity } from '../utils';


interface HistoryProps {
  filterTerms: string[];
  series: IYieldSeries | null;
}

const InsetBox = styled(Box)`
  border-radius: 8px;
    ${(props:any) => props.background && 
      css`
      background: ${props.background}; 
      box-shadow: inset 6px 6px 11px ${modColor(props.background, -20)}, inset -6px -6px 11px ${modColor(props.background, 10)};
  `}`;

const History = ( { filterTerms, series }: HistoryProps) => {
  const { state } = useContext(UserContext);
  const [ txHistory, setTxHistory] = useState<any>([]);
  const [ itemOpen, setItemOpen ] = useState<any>(null);

  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  const HistoryItemName = (props:any) => {
    const { item } = props; 
    if ( item.event) {
      return (
        <Box direction='row' gap='xsmall' align='center'>
          <Text size='xsmall' color={series?.seriesColor || 'text-weak'}>{item.event}</Text>
          <Text size='xxsmall'> 

            { (item.event === 'Deposited' || item.event === 'Withdrew') && `${item.collateral} collateral`}
            { item.event === 'Removed' && 'tokens from '}  
            { item.event === 'Added' && 'liquidity tokens to '}    
            
            { item.event === 'Rolled' && `debt from ${ nameFromMaturity(item.maturityFrom, 'MMM yy') } to ` }
            { item.event === 'Imported' && 'Maker debt to ' }
            { item.event === 'Repaid' && 'debt from ' }

            { item.event === 'Lent' && 'to ' }
            { item.event === 'Closed' && 'from ' }

            { item.event === 'Borrowed' && item.APR && ` @ ${ cleanValue(item.APR, 2) }% ` }
            { item.maturity && nameFromMaturity(item.maturity ) }
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
        {
        (item.event === 'Borrowed') && 
        <Box fill>
          <Text size='xxsmall'>Amount owed @ maturity</Text>
          <Text size='xsmall'>{Math.abs(item.fyDai_).toFixed(2)} Dai</Text>
        </Box> 
        }

        {
        (item.event === 'Rolled') && 
        <Box fill>
          <Text size='xxsmall'>from </Text>
          <Text size='xsmall'> { nameFromMaturity(item.maturityFrom) }</Text>
        </Box> 
        }
        
        { 
        (item.event === 'Lent' ) && 
        <Box fill>
          <Text size='xxsmall'>Amount redeemable @ maturity</Text>
          <Text size='xsmall'>{Math.abs(item.fyDai_).toFixed(2)} Dai</Text>
        </Box>
        }

        { 
        (item.event === 'Imported' ) && 
        <Box fill>
          <Text size='xxsmall'>Collateralized with</Text>
          <Box direction='row'>
            <Text size='xsmall'>{Math.abs(item.collateral_).toFixed(2)} ETH-A </Text>
            <Text size='xxsmall'>(see transaction above)</Text>
          </Box>
        </Box>
        }

        <Box fill>
          <Box alignSelf='end' direction='row' gap='small'>
            <EtherscanButton txHash={item.transactionHash} background={modColor(defaultBackground, -10)} />
            <HashWrap hash={item.transactionHash} /> 
          </Box>
          
        </Box>
      </Box>   
    );
  };

  useEffect(()=> {

    let seriesFilteredHist;
    const _txHist = state.txHistory.items;
    const filteredHist = _txHist.filter((x:any) => filterTerms.includes(x.event));
    
    if ( series ) {
      seriesFilteredHist = filteredHist.filter(
        (x:any) => (x.maturity === series.maturity) || (x.maturity === null)
      );
    } else {
      seriesFilteredHist = filteredHist;
    }

    const sortedList = seriesFilteredHist.sort( (a:any, b:any) => b.date - a.date ); 
    setTxHistory(sortedList);

  }, [ state.txHistory, series, filterTerms ]);

  return (
    <Loading condition={state.userLoading} size='large'>
      <InsetBox
        background={defaultBackground}
        fill='horizontal'
        round='small'
        pad='none'
        border
        height={{ max:'500px' }}
        overflow='auto'
      >
      
        <Box 
          direction='row'
          gap='xsmall'
          justify='between'
          pad='small'
          round={{ size:'small', corner:'top' }}
          background={modColor(defaultBackground, -10)}
        >
          <Box basis='45%'><Text color='text-weak' size='xxsmall'>TRANSACTION</Text></Box>
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
                  hoverIndicator={modColor(defaultBackground, -10)}
                  background={itemOpen === key_ ? modColor(defaultBackground, -10) : undefined}
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
                    <Box basis='25%' align='center'><Text size='xsmall'> { format( new Date(x.date*1000), 'dd MMM yyyy') } </Text></Box>
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
      </InsetBox>
    </Loading>
  );
};

export default History;
