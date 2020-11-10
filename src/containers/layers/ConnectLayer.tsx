import React, { useEffect, useState, useContext } from 'react';
import {
  Layer,
  Image,
  Footer,
  Box,
  Text,
  ResponsiveContext,
} from 'grommet';
import { 
  FiArrowLeft as ArrowLeft,
  FiRefreshCcw as Refresh,

} from 'react-icons/fi';
import { useConnection, useSignerAccount, useWeb3React } from '../../hooks';
import { injected, walletconnect } from '../../connectors';
import metamaskImage from '../../assets/images/providers/metamask.png';
import walletConnectImage from '../../assets/images/providers/walletconnect.png';
import { UserContext } from '../../contexts/UserContext';
import RaisedButton from '../../components/RaisedButton';
import FlatButton from '../../components/FlatButton';
import TxHistory from '../../components/TxHistory';
import YieldSettings from '../../components/YieldSettings';
import ExperimentWrap from '../../components/ExperimentWrap';
import HashWrap from '../../components/HashWrap';
import TxRecent from '../../components/TxRecent';

const ConnectLayer = ({ view, target, closeLayer }: any) => {

  const { state: { position }, actions } = useContext(UserContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  
  const { handleSelectConnector } = useConnection();

  const { account, provider, chainId } = useSignerAccount();
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
            // height={!mobile?{ min:'750px', max:'750px' }: undefined}
            background="background"
            fill="vertical"
            style={{
              borderRadius: '0.5rem',
              padding: '2rem',
            }}
          >
            <Box
              flex
              overflow='auto'      
            > 
              { account && layerView === 'ACCOUNT' &&
              <Box gap='medium' flex={false}>
                <Box pad="small" gap="small">
                  <Box direction='row' justify='between'>
                    <Text alignSelf='center' size='large' weight='bold'>Connected Wallet</Text>   
                    <Box direction='row' gap='small'>
                      <RaisedButton
                        onClick={()=>setLayerView('CONNECT')}
                        label={<Box pad={{ vertical:'xsmall', horizontal:'xsmall' }}><Text size='xxsmall'>Change Wallet Provider</Text></Box>}
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
                      <Text size='xsmall'> <HashWrap hash={account}>{account}</HashWrap> </Text>                   
                    </Box>               

                    {/* <Box direction='row' justify='between' > */}
                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>ETH balance:</Text>
                      <Text size='xsmall'>{ position?.ethBalance_ || '' }</Text>
                    </Box>
                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>DAI balance:</Text>
                      <Text size='xsmall'>{ position?.daiBalance_ || '' }</Text>
                    </Box>
                    {/* </Box> */}
                  </Box>
                </Box>

                <TxRecent setView={()=>setLayerView('HISTORY')} />
                <YieldSettings />

                <Box pad="small" gap="small" border='all' round='xsmall'>
                  <Box direction='row' justify='between'>
                    <Text alignSelf='start' size='small' weight='bold'>Diagnostics Info</Text> 
                    <RaisedButton 
                      label={<Box pad='xsmall'><Text size='xxsmall'>Factory Reset</Text></Box>}
                    // eslint-disable-next-line no-restricted-globals
                      onClick={()=>{localStorage.clear(); location.reload();}}
                    /> 

                  </Box>
                  <Text size='xxsmall'>App Version: Beta 0.2.2</Text>
                  <Text size='xxsmall'>Connected Network: { provider?.network?.name }</Text>
                  <Text size='xxsmall'>Yield protocol ref contract: {process.env[`REACT_APP_MIGRATION_${chainId}`]} </Text>       
                </Box>
              </Box> }

              { layerView === 'CONNECT' &&      
              <Box pad="medium" gap="large">
                <Box align='center'>
                  <Text size='large' weight='bold'>Connect a wallet</Text>
                </Box>
                <Box align="center" pad="medium" gap="small">
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
                      return <ExperimentWrap key={x.name}><ConnectButton /></ExperimentWrap>;
                      // eslint-disable-next-line react/jsx-key
                    } return <ConnectButton key={x.name} />;
                  }
                  )}
                  {/* <Box align='end'>
                    <FlatButton 
                      label={<Text size='xxsmall'>Disconnect current wallet</Text>}
                      onClick={()=>web3React.deactivate()}
                    /> 
                  </Box> */}
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
                  <FlatButton
                    label={<Text textAlign='center' size='xsmall' color='text-weak'> <Refresh /></Text>}
                    onClick={()=>actions.rebuildHistory()}
                  />
                </Box>

                <Box>
                  {histOpen === 'BORROW' && <TxHistory filterTerms={['Borrowed', 'Repaid', 'Deposited', 'Withdrew']} series={null} />}
                  {histOpen === 'LEND' && <TxHistory filterTerms={['Closed', 'Lent' ]} series={null} />}
                  {histOpen === 'POOL' && <TxHistory filterTerms={['Added', 'Removed' ]} series={null} />}
                </Box>
              </Box> }

              { !account && layerView === 'ACCOUNT' &&
              <Box pad='medium' align='center'>  
                <Text weight='bold'>Your wallet has been disconnected.</Text>
              </Box>}
            </Box>
            
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
              <FlatButton
                label={<Text size='xsmall' color='text-weak'> {layerView !== 'ACCOUNT'? 'Close' : 'Done'}</Text>}
                onClick={()=>closeLayer()}
              />
            </Footer>

          </Box>
        </Layer>
      )}

    </>
  );
};

export default ConnectLayer;
