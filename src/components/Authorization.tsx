import React, { useEffect, useState, useContext } from 'react';
import { Box, Layer, Text, ResponsiveContext } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiClock as Clock,
  FiUnlock as Unlock,
  FiArrowLeft as ArrowLeft, 
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';
import { NotifyContext } from '../contexts/NotifyContext';
import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { useAuth, useSignerAccount, useTxActive } from '../hooks';
import RaisedButton from './RaisedButton';

interface IAuthorizationProps {
  series?: IYieldSeries|null;
  authWrap?: boolean;
  buttonOnly?: boolean;
  children?:any;
}

const Authorization = ({ series, buttonOnly, authWrap, children }:IAuthorizationProps) => { 
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { requestedSigs } } = useContext(NotifyContext);
  const { state: { authorizations }, actions: userActions } = useContext(UserContext);
  const { hasDelegatedProxy } = authorizations;
  const { actions: seriesActions } = useContext(SeriesContext);

  // flags 
  const [ authPending, setAuthPending ] = useState<boolean>(false);
  const [ layerOpen, setLayerOpen ] = useState<boolean>(true);
  const [ allSigned, setAllSigned ] = useState<boolean>(false);
  
  const { account } = useSignerAccount();
  const { yieldAuth, poolAuth, authActive } = useAuth();
  const [ txActive ] = useTxActive(['AUTH']);

  const authProcedure = async () => {
    setAuthPending(true);
    !series && await yieldAuth();
    series && await poolAuth(series.fyDaiAddress, series.poolAddress);
    await Promise.all([
      userActions.updateAuthorizations(),
      seriesActions.updateActiveSeries()
    ]);
    // setAuthPending(false);
  };

  const closeAuth = () => {
    setLayerOpen(false);
  };

  /* manage layer open /closed by watching authActive */
  useEffect(()=>{
    authActive && setLayerOpen(true);
  }, [authActive]);

  useEffect(()=>{
    const _allSigned = requestedSigs.reduce((acc:boolean, nextItem:any)=> {
      return nextItem.signed;
    }, false);
    setAllSigned(_allSigned);
  }, [requestedSigs]);

  return (
    <>
      { account && authWrap && !authActive && 
        <Box fill='horizontal' onClick={()=>{authProcedure();}}> 
          {children} 
        </Box>}

      { !hasDelegatedProxy && account && !authWrap && !series && 
        <Box 
          fill='horizontal'
          pad={mobile?{ horizontal:'medium', top:'medium', bottom:'large' }:'medium'}
          direction='row-responsive'
          gap='medium'
          background='#555555'
          justify='between'
          margin={mobile?{ bottom:'-10px' }:undefined}
        >
          {!buttonOnly &&
            <Box> 
              <Text size={mobile?'xsmall': undefined}>Feel free to look around and play. However, before you make any transactions you will need to sign a few authorizations.</Text>
            </Box>}
          <RaisedButton 
            background='#555555'
            label={<Box pad={{ horizontal:'small', vertical:'xsmall' }} align='center'><Text size='small' color='#DDDDDD'><Unlock /> Authorize Yield</Text></Box>}
            onClick={()=>{authProcedure();}}
          />
        </Box>}

      { hasDelegatedProxy && account && series?.hasDelegatedPool === false && !authWrap &&
        <Box
          direction='row-responsive' 
          gap='small'
          pad='medium'
          justify='around'
          background='#555555'
          align='center'
        >  
          <Box direction='row' gap='small'>
            {!buttonOnly && <Text color='#DDDDDD'> <Warning /> </Text>}
            {!buttonOnly && <Text size='xsmall' color='#DDDDDD'>A once-off authorization is required to use this series </Text>}
          </Box>
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

      { authActive && layerOpen &&
        <Layer 
          // onClickOutside={()=>closeAuth()}
          // modal={mobile?true: undefined}
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
            { !txActive && allSigned && <Text size='xsmall' weight='bold'>Finally, confirm sending the signatures to Yield in a transaction...</Text>}
            { txActive && <Text size='xsmall' weight='bold'> Submitting your signed authorizations ... transaction pending.</Text> }
            
            { authPending && txActive &&
            <Box alignSelf='start'>
              <Box
                round
                onClick={()=>closeAuth()}
                hoverIndicator='brand-transparent'
                pad={{ horizontal:'small', vertical:'small' }}
                justify='center'
              >
                <Box direction='row' gap='small' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Text size='xsmall' color='text-weak'>close, and go back to the app</Text>
                </Box>
              </Box>
            </Box>}

          </Box>
        </Layer>} 
    </>);
};

Authorization.defaultProps={ series:null, buttonOnly:false, authWrap:false, children:null };
export default Authorization;
