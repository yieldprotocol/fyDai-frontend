import React, { useEffect, useState, useContext } from 'react';
import { Box, Layer, Text, ResponsiveContext, CheckBox } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiClock as Clock,
  FiUnlock as Unlock,
  FiArrowLeft as ArrowLeft, 
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';
import { TxContext } from '../contexts/TxContext';
import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';

import { useAuth, useSignerAccount, useTxActive } from '../hooks';
import RaisedButton from './RaisedButton';
import FlatButton from './FlatButton';
import EtherscanButton from './EtherscanButton';
import { abbreviateHash } from '../utils';

interface IAuthorizationProps {
  series?: IYieldSeries | null;
  authWrap?: boolean;
  children?:any;
}

const Authorization = ({ series, authWrap, children }:IAuthorizationProps) => { 
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { requestedSigs, pendingTxs } } = useContext(TxContext);
  const { state: { authorizations, preferences }, actions: userActions } = useContext(UserContext);
  const { hasDelegatedProxy, hasAuthorisedProxy } = authorizations;
  const { actions: seriesActions } = useContext(SeriesContext);

  // flags 
  const [ authPending, setAuthPending ] = useState<boolean>(false);
  const [ allSigned, setAllSigned ] = useState<boolean>(false);

  const [ layerOpen, setLayerOpen ] = useState<boolean>(true);
  const [ fallbackLayerOpen, setFallbackLayerOpen ] = useState<boolean>(true);

  const { account } = useSignerAccount();
  const { yieldAuth, poolAuth, authActive, fallbackAuthActive } = useAuth();
  const [ txActive ] = useTxActive(['AUTH']);

  const authProcedure = async () => {
    setAuthPending(true);
    !series && await yieldAuth();
    series && await poolAuth(series);
    await Promise.all([
      userActions.updateAuthorizations(),
      seriesActions.updateActiveSeries()
    ]);
    // setAuthPending(false);
  };

  const closeAuth = () => {
    setLayerOpen(false);
    setFallbackLayerOpen(false);
  };

  /* manage layer visibility by watching authActive & fallbackActive */
  useEffect(()=>{
    authActive && setLayerOpen(true);
    fallbackAuthActive && setFallbackLayerOpen(true);
  }, [authActive, fallbackAuthActive]);

  useEffect(()=>{
    const _allSigned = requestedSigs.reduce((acc:boolean, nextItem:any)=> {
      return nextItem.signed;
    }, false);
    setAllSigned(_allSigned);
  }, [requestedSigs]);

  return (
    <>
      { authWrap && 
        !authActive &&
        account &&
        <Box fill='horizontal' onClick={()=>{authProcedure();}}> 
          {children} 
        </Box>}

      { ( !hasDelegatedProxy || !hasAuthorisedProxy) &&
        !series && 
        account && 
        !authWrap &&
        <Box 
          fill='horizontal'
          pad={mobile?{ horizontal:'medium', top:'medium', bottom:'large' }:{ horizontal:'xlarge', vertical:'medium' }}
          direction='row-responsive'
          gap='medium'
          background='#555555'
          justify='between'
          margin={mobile?{ bottom:'-10px' }:undefined}
        >
          { (!hasDelegatedProxy && !hasAuthorisedProxy) &&
          <Box> 
            <Text size={mobile?'xsmall': undefined}>Feel free to look around and play. However, before you make any transactions you will need to sign a few authorizations.</Text>
          </Box>}
          { !(!hasDelegatedProxy && !hasAuthorisedProxy) &&
          <Box>
            <Text size={mobile?'xsmall': undefined}>There may have been a problem with the previous authorization attempt.</Text>
            <Text size={mobile?'xsmall': undefined}>An authorisation is still required.</Text>
          </Box>}
          <RaisedButton 
            background='#555555'
            label={<Box pad={{ horizontal:'small', vertical:'xsmall' }} align='center'><Text size='small' color='#DDDDDD'><Unlock /> Authorize Yield</Text></Box>}
            onClick={()=>{authProcedure();}}
          />
        </Box>}

      { hasDelegatedProxy &&
        account &&
        !authWrap &&
        series &&
        <Box
          direction='row-responsive' 
          gap='small'
          pad='medium'
          justify='around'
          background='#555555'
          align='center'
        >

          { (!series.hasDaiAuth && !series.hasFyDaiAuth && !series.hasDelegatedPool) && 
          <Box direction='row' gap='small'>
            <Text color='#DDDDDD'> <Warning /> </Text>
            <Text size='xsmall' color='#DDDDDD'>A once-off authorization is required to use this series </Text>
          </Box> }

          { !(!series.hasDaiAuth && !series.hasFyDaiAuth && !series.hasDelegatedPool) && 
          <Box direction='row' gap='small'>
            <Text color='#DDDDDD'> <Warning /> </Text>
            <Box>
              <Text size='xsmall' color='#DDDDDD'>There was a problem with the previous unlock attempt.</Text>
              <Text size='xsmall' color='#DDDDDD'>A few authorisations are still outstanding.</Text>
            </Box>
          </Box> }

          <Box>
            <RaisedButton 
              background='#555555'
              label={
                <Box pad={{ horizontal:'small', vertical:'xsmall' }} align='center'>
                  <Text size='xsmall' color='#DDDDDD'><Unlock /> Unlock Series </Text>
                </Box>
              }
              onClick={()=>{authProcedure();}}
            />   
          </Box>           
        </Box>}

      { authActive && 
        !preferences?.useTxApproval &&
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
            <Text size='large' weight='bold'> The following signatures are required: </Text>
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

            { !txActive && 
              allSigned && 
              <Text size='xsmall' weight='bold'>
                Finally, confirm sending the signatures to Yield in a transaction...
              </Text>}
            { txActive && <Text size='xsmall' weight='bold'> Submitting your signed authorizations ... transaction pending.</Text> }
            
            { authPending && 
              txActive &&
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
          </Box>
        </Layer>}

      { fallbackAuthActive && 
        fallbackLayerOpen &&
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
              <Text weight='bold' size='large'>It seems there was a problem signing the authorizations.</Text>
              {!mobile && <Text size='xsmall'>( Its not your fault, some wallets dont provide signing functionality just yet :| )</Text>}
            </Box>

            <Box>
              {/* <Text size='small' weight='bold'> Option 1:</Text> */}
              <Text size='small'>You can continue by approving the set of authorization transactions individually with your wallet or provider.</Text>
            </Box>

            <Box>
              <CheckBox 
                checked={preferences?.useTxApproval}
                label={<Text size='xsmall'>In future, always use individual transactions for authorizations</Text>}
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
            { txActive && <Text size='xsmall' weight='bold'> Submitting your Authorizations ... Transaction pending.</Text> }
            
            { authPending && 
              txActive &&
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

Authorization.defaultProps={ series:null, authWrap:false, children:null };
export default Authorization;
