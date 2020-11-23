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

/* hook pack */
import { useSignerAccount } from '../hooks/connectionHooks';
import { useTxActive } from '../hooks/txHooks';
import { useDsRegistry } from '../hooks/dsRegistryHook';

import RaisedButton from '../components/RaisedButton';
import FlatButton from '../components/FlatButton';
import EtherscanButton from '../components/EtherscanButton';
import { abbreviateHash, genTxCode } from '../utils';
import TxStatus from '../components/TxStatus';
import Loading from '../components/Loading';

const TxLayer = () => {
  // contexts
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { requestedSigs, pendingTxs, txProcessActive, fallbackActive }, dispatch } = useContext(TxContext);
  const { state: { authorization, preferences }, actions: userActions } = useContext(UserContext);
  const { actions: seriesActions } = useContext(SeriesContext);

  // hooks
  const { account } = useSignerAccount();
  const { buildDsProxy } = useDsRegistry();

  const [ authActive ] = useTxActive([ 'AUTH_TOKEN', 'AUTH_CONTROLLER', 'AUTH_POOL', 'CREATE_PROXY' ]);
  const [ txActive ] = useTxActive(['POST', 'WITHDRAW', 'BORROW', 'REPAY', 'SELL_DAI', 'BUY_DAI', 'REDEEM', 'ADD_LIQUIDITY', 'REMOVE_LIQUIDITY' ]);

  // flags
  const [ allSigned, setAllSigned ] = useState<boolean>(false); // tracking signatures
  const [ allComplete, setAllComplete ] = useState<boolean>(false); // tracking if all required authorizations are complete
  const [ layerOpen, setLayerOpen ] = useState<boolean>(false);

  const buildProxyProcedure = async () => {
    await buildDsProxy();
    await Promise.all([
      userActions.updateAuthorizations(),
      seriesActions.updateActiveSeries()
    ]);
  };

  /* close modal option (even if tx is in progress) */
  const closeAuth = () => {
    /* clear the requested signatures and tx activity flag */
    dispatch({ type: 'setTxProcessActive', payload:{ txCode:null, sigs:[] }  });
    setLayerOpen(false);
  };

  /* set layer open if a txs is in process - but bypassable with closeAuth() */
  useEffect(()=>{
    !!txProcessActive && setLayerOpen(true);
  }, [txProcessActive]);

  /* set Sigs status ( All previously complete or all been signed ) */
  useEffect(()=>{
    if (Array.from(requestedSigs.values()).length ) {

      const _allSigned = Array.from(requestedSigs.values()).every((x:any) => x.signed === true );
      setAllSigned(_allSigned);

      const _allComplete = Array.from(requestedSigs.values()).every((x:any) => x.complete === true );
      setAllComplete(_allComplete);

    } else {
      setAllComplete(true);
    }
  }, [requestedSigs]);

  return (
    <>
      {/* This following section is the 'non-layer' notification section. 
It is only shown on main view if the user doesn't have a dsProxy */}
      {     
      account && !authorization.hasDsProxy &&
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
          { 
          !pendingTxs.some((x:any) => (x.type === 'CREATE_PROXY') && (x.series === null) )?
            <RaisedButton 
              background='#555555'
              label={<Box pad={{ horizontal:'small', vertical:'xsmall' }} align='center'><Text size='small' color='#DDDDDD'><Unlock /> Create Vault</Text></Box>}
              onClick={()=>buildProxyProcedure()}
            />
            :
            <Box pad={{ horizontal:'small', vertical:'xsmall' }} align='center'><Text size='small' color='#DDDDDD'><Unlock />Pending...</Text></Box>
          }
        </Box>
      }

      {/* This following section is the 'layer' section. 
It is only shown when there is a transaction in progress or signature required */}    
      { txProcessActive && layerOpen &&
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

            { 
            requestedSigs.length>0 &&
            !allComplete && 
            !(txActive?.txCode === txProcessActive) &&
            !fallbackActive &&
            <>
              <Box gap='medium'>
                { allSigned ? 
                  <Text weight='bold'> The required authorisations have been granted: </Text> :
                  <Text weight='bold'> The following {requestedSigs.length===1? 'signature is' : 'signatures are'} required: </Text>}
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
                { allSigned &&
                  <Text> 
                    Finally, please check your wallet or provider to approve the transaction.
                  </Text>}
              </Box>
            </>
            }


            { requestedSigs.length>0 && 
            !allComplete && 
            fallbackActive &&
            <Box gap='medium'> 

              {preferences?.useTxApproval ? 
                <Text weight='bold'>Please approve the following authorization transactions: </Text>
                :
                <Box gap='medium'>
                  <Box>
                    <Text weight='bold'>It seems there was a problem signing the authorization.</Text>
                    {!mobile && <Text size='xsmall'>( Its not your fault, some wallets don't provide signing functionality just yet :| )</Text>}
                  </Box>
                  <Box>
                    <Text size='small'>You can continue by approving the set of authorization transactions individually with your wallet or provider:</Text>
                  </Box>
                </Box>}

              <Box gap='medium'>

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
                        { pendingTxs.some((tx:any) => tx.txCode  === x.id) ?
                          <Box gap='small' direction='row'>
                            <Text size='xxsmall'> Pending</Text>
                            <Loading condition={true} size='xxsmall'>.</Loading>
                            {/* <EtherscanButton txHash={pendingTxs.find((tx:any)=> tx.txCode === x.id)?.tx?.hash} /> */}
                          </Box>
                          :
                          <>
                            { 
                              x.signed ?
                                <Box animation='zoomIn'>
                                  <Check color='green' />
                                </Box>:
                                <Clock />
                            }
                          </> }                  
                      </Box>
                    </Box>
                  );
                })}

                {/* <Box gap='small' fill='horizontal'>
                  { pendingTxs.map((x:any, i:number)=> (
                    <Box key={x.tx.hash} direction='row' fill='horizontal' justify='between'>
                      <Box> { abbreviateHash(x.tx.hash) }</Box>
                      <EtherscanButton txHash={x.tx.hash} />
                    </Box>)
                  )}
                </Box> */}
              </Box>

              {!preferences?.useTxApproval &&
              <Box>
                <CheckBox 
                  checked={preferences?.useTxApproval}
                  label={<Text size='xsmall'>In future, always use individual transactions for authorization</Text>}
                  onChange={(e:any) => userActions.updatePreferences({ useTxApproval: true })}
                />
                <Box margin={{ left:'large' }}>
                  <Text size='xxsmall'>(You can always change back to using permit-style authorization in the settings)</Text>
                </Box>
              </Box>}
            </Box>}

            { ( allComplete ) &&
              !(txActive?.txCode === txProcessActive) &&
              <Box gap='medium'>
                <Text weight='bold'>Confirmation required</Text>
                <Text> 
                  Please check your wallet or provider to approve the transaction.
                </Text>
              </Box>}

            { (txActive?.txCode === txProcessActive) && <TxStatus tx={txActive || authActive} /> }

            { (txActive?.txCode === txProcessActive) && 
            <Box alignSelf='start'>
              <FlatButton
                onClick={()=>closeAuth()}
                label={
                  <Box direction='row' gap='medium' align='center'>
                    <ArrowLeft color='text-weak' />
                    <Text size='small' color='text-weak'>go back</Text>
                  </Box>
                  }
              />
            </Box>}

          </Box>
        </Layer>}

    </>);
};

TxLayer.defaultProps={ series:null, authWrap:false, children:null };
export default TxLayer;
