import React, { useEffect, useState, useContext } from 'react';
import { Box, Button, Layer, Text, ResponsiveContext } from 'grommet';

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
import { modColor } from '../utils';

interface IAuthorizationProps {
  series?: IYieldSeries|null;
  buttonOnly?: boolean;
}

const Authorization = ({ series, buttonOnly }:IAuthorizationProps) => { 
  const screenSize = useContext(ResponsiveContext);
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
    series && await poolAuth(series.eDaiAddress, series.poolAddress);
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
      { !series && !hasDelegatedProxy && account && 
        <Box direction='row' fill='horizontal' gap='small' justify='between'>
          {!buttonOnly && <Text>Before we start, Yield requires some permissions. </Text> }
          <RaisedButton 
            // primary={buttonOnly}
            label={buttonOnly?'Authorization is required to get started':'Authorise Yield'}
            onClick={()=>{authProcedure();}}
            icon={<Unlock />}
          />        
        </Box>}

      { account && series?.hasDelegatedPool === false &&
        <Box direction='row' fill='horizontal' gap='small' justify='between'>
          {!buttonOnly && <Warning />}
          {!buttonOnly && <Text>A once-off authorisation is required to use this series</Text>}
          <RaisedButton 
            background={modColor( series.seriesColor, 40)}
            label={ <Text size='small'><Unlock /> Unlock Series </Text>}
            onClick={()=>{authProcedure();}}           
          />        
        </Box>}

      { authActive && layerOpen &&
        <Layer 
          onClickOutside={()=>closeAuth()}
        >
          <Box 
            width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
            round
            background='background'
            pad='large'
            gap='medium'
          >
            <Text size='medium' weight='bold'> The following signatures are required: </Text>
            { requestedSigs.map((x:any, i:number)=> {
              const iKey = i;
              return ( 
                <Box key={iKey} gap='small' direction='row' justify='between' fill>
                  <Box basis='10'> 
                    <Text 
                      size='xsmall'
                      color={x.signed?'green':undefined}
                    >
                      {i+1}.
                    </Text>
                  </Box>
                
                  <Box basis='60'> 
                    <Text 
                      size='xsmall'
                      color={x.signed?'green':undefined}
                    >
                      {x.desc}
                    </Text>
                  </Box>

                  <Box basis='30'> { !x.signed ? 
                    <Clock /> :
                    <Box animation='zoomIn'>
                      <Check color='green' />
                    </Box>}
                  </Box>
                </Box>
              );
            })}
            { !txActive && allSigned && <Text size='xsmall' weight='bold'> Finally, confirm sending the signatures to Yield in a transaction.</Text>}
            { txActive && <Text size='xsmall' weight='bold'> Submitting your signed authorisations ... transaction pending.</Text> }
            
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

Authorization.defaultProps={ series:null, buttonOnly:false };
export default Authorization;
