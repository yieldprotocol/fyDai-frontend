import React, { useContext } from 'react';
import { Box, Text, ResponsiveContext, ThemeContext } from 'grommet';
import { ScaleLoader } from 'react-spinners';

import { abbreviateHash } from '../utils';

import { ITx } from '../types';

import { TxContext } from '../contexts/TxContext';
import EtherscanButton from './EtherscanButton';
import HashWrap from './HashWrap';

interface TxStatusProps {
  tx: ITx;
}

const TxStatus= ({ tx }:TxStatusProps) => {

  const {
    state: { pendingTxs, lastCompletedTx },
  } = useContext(TxContext);

  const theme:any = useContext(ThemeContext);
  const defaultColor = theme.dark? theme.global.colors.text.dark: theme.global.colors.text.light;
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' ); 
  const txRef = React.useRef<any>(null);

  return (
    <>
      {
      pendingTxs?.length > 0 &&
        <Box
          alignSelf="center"
          fill
          round='small'
          pad="large"
          align='center'
          gap='medium'
          width={!mobile?{ min:'600px', max:'600px' }: undefined}
        >
          <Text size='xlarge' weight='bold'>Transaction pending...</Text>
          <Text>{tx.msg}</Text>
          <ScaleLoader color={defaultColor} height='25px' />
          <Box direction='row' gap='xsmall'>
            <HashWrap hash={tx.tx.hash}> <Text size='xsmall' ref={txRef}> { abbreviateHash(tx.tx.hash) } </Text></HashWrap>  
          </Box>
          <EtherscanButton txHash={tx.tx.hash} />
        </Box>
      }

      { 
      pendingTxs.length === 0 && 
      lastCompletedTx &&
      <Box
        alignSelf="center"
        fill
        round='small'
        pad="large"
        align='center'
        gap='medium'
        width={!mobile?{ min:'600px', max:'600px' }: undefined}
      >
        <Text size='xlarge' weight='bold'>Transaction complete. </Text>
        <Text>{(lastCompletedTx.status === 1)? 'Transaction succeeded': 'Transaction failed'}</Text>
        <Box direction='row' gap='xsmall'>
          <Text size='xsmall' ref={txRef}> <HashWrap hash={lastCompletedTx?.transactionHash}>{ abbreviateHash(lastCompletedTx?.transactionHash) }</HashWrap> </Text>
        </Box>
        <EtherscanButton txHash={lastCompletedTx.transactionHash} />
      </Box>
      }
    </>
  );
};

export default TxStatus;