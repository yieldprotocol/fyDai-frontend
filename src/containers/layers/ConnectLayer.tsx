import React, { useEffect, useState, useContext } from 'react';
import {
  Anchor,
  Layer,
  Image,
  Footer,
  Box,
  Text,
  ResponsiveContext,
} from 'grommet';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';
import { useConnection, useSignerAccount } from '../../hooks';
import { injected, walletconnect } from '../../connectors';
import metamaskImage from '../../assets/images/providers/metamask.png';
import walletConnectImage from '../../assets/images/providers/walletconnect.png';
import { UserContext } from '../../contexts/UserContext';
import RaisedButton from '../../components/RaisedButton';
import FlatButton from '../../components/FlatButton';
import TxHistory from '../../components/TxHistory';
import YieldSettings from '../../components/YieldSettings';
import ExperimentWrap from '../../components/ExperimentWrap';
import TxRecent from '../../components/TxRecent';

const ConnectLayer = ({ view, target, closeLayer }: any) => {

  const { state: { position } } = useContext(UserContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  
  const { handleSelectConnector } = useConnection();

  const { account, provider } = useSignerAccount();
  const [ layerView, setLayerView] = useState<string>(view);
  const [ histOpen, setHistOpen] = useState<string>('BORROW');

  const connectorList = [
    { name: 'Metamask', image: metamaskImage, connection: injected, trial: false },
    { name: 'Wallet Connect', image: walletConnectImage, connection: walletconnect, trial: true },
  ];

  useEffect(()=>{
    setLayerView(view);
  }, [view]);

  return (
    <>
      {layerView && (
        <Layer
          onClickOutside={() => closeLayer(true)}
          animation='slide'
          onEsc={() => closeLayer(true)}
          target={target || undefined}
        >
          <Box
            width={!mobile?{ min:'620px', max:'620px' }: undefined}
            background="background-front"
            direction="column"
            fill="vertical"
            style={{
              borderRadius: '0.5rem',
              padding: '2rem',
            }}
          >
            { account && layerView === 'ACCOUNT' &&
              <Box gap='medium'>
                <Box pad="small" gap="small">
                  <Box direction='row' justify='between'>
                    <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Connected Wallet</Text>   
                    <Box round>
                      <FlatButton
                        onClick={()=>setLayerView('CONNECT')}
                        label={<Text size='xsmall'>Change Wallet Provider</Text>}
                      /> 
                    </Box>
                  </Box>

                  <Box
                    pad={{ vertical:'small' }}
                    justify="center"
                    gap='small'
                  >
                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>Account:</Text> 
                      <Text size='xsmall'> {account} </Text>                   
                    </Box>               

                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>ETH balance:</Text>
                      <Text size='xsmall'>{ position?.ethBalance_ || '' }</Text>
                    </Box>

                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>DAI balance:</Text>
                      <Text size='xsmall'>{ position?.daiBalance_ || '' }</Text>
                    </Box>
                  </Box>
                </Box>

                <TxRecent setView={()=>setLayerView('HISTORY')} />
                <YieldSettings />

                <Box pad="small" gap="small" border='all' round='xsmall'>
                  <Box direction='row' justify='between'>
                    <Text alignSelf='start' size='small' weight='bold'>Diagnostics Info</Text> 
                  </Box>
                  <Text size='xxsmall'>App Version:  alpha 0.1 </Text>
                  <Text size='xxsmall'>Connected Network: { provider.network.name }</Text>
                  <Text size='xxsmall'>Yield protocol ref contract: {process.env.REACT_APP_MIGRATION_42} </Text>
                </Box>

              </Box> }

            { layerView === 'CONNECT' &&      
              <Box pad="medium" gap="small">
                <Box align="center" pad="medium" gap="small">
                  <Text size='xxlarge' color='brand' weight='bold'>Connect a wallet</Text>
                  <Text>Try connecting with:</Text>
                  {connectorList.map((x:any, i:number) => {          
                    const ConnectButton = ()=> (
                      <RaisedButton
                        onClick={() => { handleSelectConnector(x.connection); closeLayer();}}
                        label={x.name}
                        fill="horizontal"
                        icon={
                          <Box
                            height="1rem"
                            width="1rem"
                            style={{
                              position: 'absolute',
                              left: '1rem',
                            }}
                          >
                            <Image src={x.image} fit="contain" />
                          </Box>
                        }
                        style={{
                          marginBottom: '1rem',
                          fontWeight: 500,
                          position: 'relative',
                          padding: '0.5rem',
                        }}
                        key={x.name}
                      />);                 
                    if (x.trial) {
                      return <ExperimentWrap><ConnectButton /></ExperimentWrap>;
                    // eslint-disable-next-line react/jsx-key
                    } return <ConnectButton />;
                  }
                  )}
                  <Box gap="xsmall" direction="row">
                    <Anchor href='https://ethereum.org/en/learn/' label="Help!" size="xsmall" color="brand" target="_blank" />
                    <Text size="xsmall"> I'm not sure what this means.</Text>
                  </Box>
                </Box>
              </Box>}

            { account && layerView === 'HISTORY' &&      
              <Box pad="medium" gap="large"> 
                <Box direction='row' justify='evenly'>
                  <FlatButton 
                    onClick={()=> setHistOpen('BORROW')}
                    label='Borrowing History'
                    selected={histOpen==='BORROW'}
                  />
                  <FlatButton 
                    onClick={()=> setHistOpen('LEND')}
                    label='Lending History'
                    selected={histOpen==='LEND'}
                  />
                  <FlatButton 
                    onClick={()=> setHistOpen('POOL')}
                    label='Pool History'
                    selected={histOpen==='POOL'}
                  />
                </Box>
                <Box>
                  {histOpen === 'BORROW' && <TxHistory filterTerms={['Borrowed', 'Repaid', 'Deposited', 'Withdrew']} series={null} />}
                  {histOpen === 'LEND' && <TxHistory filterTerms={['Closed', 'Lent' ]} series={null} />}
                  {histOpen === 'POOL' && <TxHistory filterTerms={['Added', 'Removed' ]} series={null} />}
                </Box>
              </Box> }

            <Footer direction="row-responsive" justify='between' pad="medium" margin={{ top:'medium' }}>
              <FlatButton 
                onClick={() => {
                  if (view === 'ACCOUNT' && layerView !== 'ACCOUNT') { 
                    setLayerView('ACCOUNT');
                  } else {
                    closeLayer();
                  }
                }}
                label={
                  <Box direction='row' gap='medium' align='center'>
                    <ArrowLeft color='text-weak' />                    
                    <Text size='xsmall' color='text-weak'> go back  </Text>
                  </Box>
                  }
              />
              {layerView !== 'ACCOUNT' &&  <FlatButton
                label={<Text size='xsmall' color='text-weak'>Close</Text>}
                onClick={()=>closeLayer()}
              />}
            </Footer>
          </Box>
        </Layer>
      )}

    </>
  );
};

export default ConnectLayer;
