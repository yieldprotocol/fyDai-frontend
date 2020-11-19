import React, { useEffect, useState, useContext } from 'react';
import { Box, Layer, Text, ResponsiveContext, CheckBox } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiClock as Clock,
  FiUnlock as Unlock,
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';

import { useDsRegistry, useSignerAccount, useTxActive } from '../hooks';
import RaisedButton from '../components/RaisedButton';
import FlatButton from '../components/FlatButton';
import EtherscanButton from '../components/EtherscanButton';
import { abbreviateHash } from '../utils';
import TxStatus from '../components/TxStatus';

const SignConfirmLayer = () => {
  // contexts
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { requestedSigs, pendingTxs, txProcessActive }, dispatch } = useContext(TxContext);
  const { state: { authorization, preferences }, actions: userActions } = useContext(UserContext);
  const { actions: seriesActions } = useContext(SeriesContext);

  // hooks
  const { account } = useSignerAccount();
  const { buildDsProxy } = useDsRegistry();

  const [ authActive ] = useTxActive(['AUTH']);
  const [ txActive ] = useTxActive(['POST', 'WITHDRAW', 'BORROW', 'REPAY', 'SELL_DAI', 'BUY_DAI', 'REDEEM', 'ADD_LIQUIDITY', 'REMOVE_LIQUIDITY' ]);

  // flags 
  const [ allSigned, setAllSigned ] = useState<boolean>(false);
  const [ layerOpen, setLayerOpen ] = useState<boolean>(false);

  const buildProxyProcedure = async () => {
    await buildDsProxy();
    await Promise.all([
      userActions.updateAuthorizations(),
      seriesActions.updateActiveSeries()
    ]);
  };

  /* check for duplication in pending Txs */
  const [ txMatch, setTxMatch] = useState<boolean>(false);
  useEffect(()=>{
    txActive && setTxMatch( pendingTxs.includes((x:any)=> x.txCode === txProcessActive) );
  }, [ txActive, txProcessActive ]);

  /* close modal option (even if tx is in progress) */
  const closeAuth = () => {
    /* clear the requested signatures and tx activity flag */
    dispatch({ type: 'setTxProcessActive', payload:{ txCode:null, sigs:[] }  });
    setLayerOpen(false);
  };
  /* set layer open if a txs is in process - but bypassable with closeAuth() */
  useEffect(()=>{
    txProcessActive && setLayerOpen(true);
  }, [txProcessActive]);

  
  /* set allSigned when all sigs are signed */
  useEffect(()=>{
    const _allSigned = requestedSigs.reduce((acc:boolean, nextItem:any)=> {
      return nextItem.signed;
    }, false);
    setAllSigned(_allSigned);
  }, [requestedSigs]);

  return (
    <>
      {/* This following section is the 'non-layer' notification section. 
It is only shown on main view if the user doesn't have a dsProxy */}
      { account && 
        authorization?.dsProxyAddress === '0x0000000000000000000000000000000000000000' &&
        <Box
          fill='horizontal'
          pad={mobile?{ horizontal:'medium', top:'medium', bottom:'large' }:{ horizontal:'xlarge', vertical:'medium' }}
          direction='row-responsive'
          gap='medium'
          background='#555555'
          justify='between'
          margin={mobile?{ bottom:'-10px' }:undefined}
        >
          <Box>
            <Text size={mobile?'xsmall': undefined}>Feel free to look around and play. However, before you make any transactions you will need connect a proxy account </Text>
          </Box>  
          { !pendingTxs.some((x:any) => (x.type === 'CREATE_PROXY') && (x.series === null) )?
            <RaisedButton 
              background='#555555'
              label={<Box pad={{ horizontal:'small', vertical:'xsmall' }} align='center'><Text size='small' color='#DDDDDD'><Unlock /> Create Vault</Text></Box>}
              onClick={()=>buildProxyProcedure()}
            />
            :
            <Box pad={{ horizontal:'small', vertical:'xsmall' }} align='center'><Text size='small' color='#DDDDDD'><Unlock />Pending...</Text></Box>}
        </Box>}


      {/* This following section is the 'layer' section. 
It is only shown when there is a transaction in progress or signature required */}    
      { txProcessActive &&
        layerOpen &&
        <Layer
          modal={true}
          responsive={mobile?false: undefined}
          full={mobile?true: undefined}
        >
          <Box 
            width={!mobile?{ min:'620px', max:'620px' }: undefined}
            round={mobile?undefined:'small'}
            background='background'
            pad='large'
            gap='medium'
          >

            { ( requestedSigs.length===0  || allSigned )  &&
              <Text> Please confirm the transaction with your Wallet or Provider. </Text>}

            { ( requestedSigs.length>0  && !allSigned ) &&
            <>
              <Text size='large' weight='bold'> The following {requestedSigs.length===1? 'signature is' : 'signatures are'} required: </Text>
              { requestedSigs.map((x:any, i:number)=> {
                const iKey = i;
                return ( 
                  <Box key={iKey} gap='small' direction='row' justify='between' fill>
                    <Box basis='70' direction='row' gap='small'> 
                      <Text 
                        size='xsmall'
                        color={x.signed?'green':undefined}
                      >
                        {i+1}.
                      </Text>

                      <Text 
                        size='xsmall'
                        color={x.signed?'green':undefined}
                      >
                        {x.desc}
                      </Text>
                    </Box>

                    <Box basis='30' alignSelf='end'> 
                      { !x.signed ? 
                        <Clock /> :
                        <Box animation='zoomIn'>
                          <Check color='green' />
                        </Box>}
                    </Box>
                  </Box>
                );
              })}
            </>}

            {/* { allSigned && !txActive && 
            <Text size='xsmall' weight='bold'>
              Finally, confirm sending the signatures to Yield in a transaction...
            </Text>} */}

            { (txActive?.txCode === txProcessActive) && <TxStatus tx={txActive || authActive} /> }

            { (txActive || authActive) && 
            <Box alignSelf='start'>
              <FlatButton 
                onClick={()=>closeAuth()}
                label={
                  <Box direction='row' gap='medium' align='center'>
                    <ArrowLeft color='text-weak' />
                    <Text size='small' color='text-weak'>go back to the app</Text>
                  </Box>
                  }
              />
            </Box>}
          </Box>
        </Layer>}


      { false &&
        <Layer
          modal={true}
          responsive={mobile?false: undefined}
          full={mobile?true: undefined}
        >
          {!preferences?.useTxApproval && !txActive &&
          <Box 
            width={!mobile?{ min:'620px', max:'620px' }: undefined}
            round={mobile?undefined:'small'}
            background='background'
            pad='large'
            gap='medium'
          >
            <Box>
              <Text weight='bold' size='large'>It seems there was a problem signing the authorization.</Text>
              {!mobile && <Text size='xsmall'>( Its not your fault, some wallets dont provide signing functionality just yet :| )</Text>}
            </Box>
            <Box>
              <Text size='small'>You can continue by approving the set of authorization transactions individually with your wallet or provider.</Text>
            </Box>
            <Box>
              <CheckBox 
                checked={preferences?.useTxApproval}
                label={<Text size='xsmall'>In future, always use individual transactions for authorization</Text>}
                onChange={(e:any) => userActions.updatePreferences({ useTxApproval: true })}
              />
              <Box margin={{ left:'large' }}>
                <Text size='xxsmall'>(You can always change back to using permit-style authorization in the settings)</Text>
              </Box>
            </Box>
          </Box>}

          {!preferences?.useTxApproval && txActive &&
          <Box 
            width={!mobile?{ min:'620px', max:'620px' }: undefined}
            round={mobile?undefined:'small'}
            background='background'
            pad='large'
            gap='medium'
          >
            { txActive && <TxStatus tx={txActive} /> }
            { authActive || txActive && 
              <Box alignSelf='start'>
                <FlatButton 
                  onClick={()=>closeAuth()}
                  label={
                    <Box direction='row' gap='medium' align='center'>
                      <ArrowLeft color='text-weak' />
                      <Text size='small' color='text-weak'>close, and go back to the app</Text>
                    </Box>
                  }
                />
              </Box>}
          </Box>}

          {preferences?.useTxApproval &&
          <Box 
            width={!mobile?{ min:'620px', max:'620px' }: undefined}
            round={mobile?undefined:'small'}
            background='background'
            pad='large'
            gap='medium'
          >
            <Text weight='bold'> Please approve the following set of authorization transactions with your wallet or provider </Text>
            { txActive &&  
            <Box gap='medium'>
              <Box gap='medium'>
                <Text size='xsmall' weight='bold'> 
                  Authorization transactions pending: 
                </Text>
                <Box gap='small' fill='horizontal'>
                  { pendingTxs.map((x:any, i:number)=> (
                    <Box key={x.tx.hash} direction='row' fill='horizontal' justify='between'>
                      <Box> { abbreviateHash(x.tx.hash) }</Box>
                      <EtherscanButton txHash={x.tx.hash} />
                    </Box>)
                  )}
                </Box>
              </Box>
              <Box alignSelf='start'>
                <FlatButton 
                  onClick={()=>closeAuth()}
                  label={
                    <Box direction='row' gap='medium' align='center'>
                      <ArrowLeft color='text-weak' />
                      <Text size='small' color='text-weak'>close, and go back to the app</Text>
                    </Box>
                  }
                />
              </Box>
            </Box>}
          </Box>}
        </Layer>}

    </>);
};

SignConfirmLayer.defaultProps={ series:null, authWrap:false, children:null };
export default SignConfirmLayer;
