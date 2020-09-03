import React from 'react';
import { Box, Button, Layer, Text } from 'grommet';

import { 
  FiCheckCircle as Check,
  FiCircle as Circle,
  FiClock as Clock,
  FiUnlock as Unlock,
  FiAlertTriangle as Warning,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';
import { NotifyContext } from '../contexts/NotifyContext';
import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { useAuth, useSignerAccount, useTxActive } from '../hooks';

interface IAuthorizationProps {
  series?: IYieldSeries|null;
  buttonOnly?: boolean;
}

const Authorization = ({ series, buttonOnly }:IAuthorizationProps) => { 
  const { state: { requestedSigs } } = React.useContext(NotifyContext);
  const { state: { authorizations }, actions: userActions } = React.useContext(UserContext);
  const { hasDelegatedProxy } = authorizations;
  const { actions: seriesActions } = React.useContext(SeriesContext);

  const [ authPending, setAuthPending ] = React.useState<boolean>(false);

  const [ allSigned, setAllSigned ] = React.useState<boolean>(false);
  
  const { account } = useSignerAccount();
  const { yieldAuth, poolAuth, authActive } = useAuth();
  const [ txActive ] = useTxActive(['AUTH']);

  const authProcedure = async () => {
    setAuthPending(true);
    !series && await yieldAuth();
    series && await poolAuth(series.yDaiAddress, series.poolAddress);
    await Promise.all([
      userActions.updatePosition(),
      seriesActions.updateActiveSeries()
    ]);
    setAuthPending(false);
  };

  React.useEffect(()=>{
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
          <Button 
            primary={buttonOnly}
            label={buttonOnly?'Authorization is required to get started':'Authorise Yield'}
            onClick={()=>{authProcedure();}}
            icon={<Unlock />}
          />        
        </Box>}

      { account && series?.hasDelegatedPool === false &&
        <Box direction='row' fill='horizontal' gap='small' justify='between' align='center'>
          {!buttonOnly && <Warning />}
          {!buttonOnly && <Text>A once-off authorisation is required to use this series</Text>}
          <Button 
            label='Unlock Series'
            onClick={()=>{authProcedure();}}
            icon={<Unlock />}
          />        
        </Box>}

      { authActive && 
        <Layer> 
          <Box 
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
          </Box>
        </Layer>} 
    </>);
};

Authorization.defaultProps={ series:null, buttonOnly:false };
export default Authorization;
