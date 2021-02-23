import React, { useEffect, useState, useContext } from 'react';
import {
  Layer,
  Image,
  Footer,
  Box,
  Text,
  ResponsiveContext,
  Collapsible,
} from 'grommet';
import { 
  FiArrowLeft as ArrowLeft,
  FiRefreshCcw as Refresh,
  FiChevronUp as ArrowUp,
  FiChevronDown as ArrowDown, 
} from 'react-icons/fi';


import { UserContext } from '../contexts/UserContext';
import { YieldContext } from '../contexts/YieldContext';
import { HistoryContext } from '../contexts/HistoryContext';

import { useSignerAccount, useConnection } from '../hooks/connectionHooks';
import { injected, walletconnect } from '../connectors';
import metamaskImage from '../assets/images/providers/metamask.png';
import walletConnectImage from '../assets/images/providers/walletconnect.png';


import History from '../containers/History';

import RaisedButton from '../components/RaisedButton';
import FlatButton from '../components/FlatButton';
import YieldSettings from '../components/YieldSettings';
import ExperimentWrap from '../components/ExperimentWrap';
import HashWrap from '../components/HashWrap';
import TxRecent from '../components/TxRecent';
import EthMark from '../components/logos/EthMark';
import DaiMark from '../components/logos/DaiMark';
import USDCMark from '../components/logos/USDCMark';

const ConnectLayer = ({ view, target, closeLayer }: any) => {

  const { state: { yieldData } } = useContext(YieldContext);
  const { state: { position } } = useContext(UserContext);
  const { actions } = useContext(HistoryContext);

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const { handleSelectConnector } = useConnection();
  const { account, provider, chainId } = useSignerAccount();

  const [ layerView, setLayerView] = useState<string>(view);
  const [ histOpen, setHistOpen] = useState<string>('BORROW');
  const [ diagnosticsOpen, setDiagnosticsOpen] = useState<boolean>(false);

  const connectorList = [
    { name: 'Metamask', image: metamaskImage, connection: injected, trial: false },
    { name: 'Wallet Connect', image: walletConnectImage, connection: walletconnect, trial: false },
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
                    <Text alignSelf='center' size='small' weight='bold'>Connected Wallet</Text>   
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
                    <Box direction='row' gap='small' justify='between'>
                      <Text size='xxsmall'>Address:</Text> 
                      <Text size='xsmall'> <HashWrap hash={account}>{account}</HashWrap> </Text>                   
                    </Box>               

                    <Box direction='row' justify='between'>
                      <Text size='xxsmall'>Balances:</Text> 
                      <Box direction='row' gap='small'>
                        <Box direction='row' gap='small'>
                          {/* <Text size='xxsmall'>ETH:</Text> */}
                          <EthMark />
                          <Text size='xxsmall'>{ position?.ethBalance_ || '' }</Text>
                        </Box>
                        <Box direction='row' gap='small'>
                          {/* <Text size='xxsmall'>DAI:</Text> */}
                          <DaiMark />
                          <Text size='xxsmall'>{ position?.daiBalance_ || '' }</Text>
                        </Box>
                        <Box direction='row' gap='small'>
                          {/* <Text size='xxsmall'>USDC:</Text> */}
                          <USDCMark />
                          <Text size='xxsmall'>{ position?.usdcBalance_ || '' }</Text>
                        </Box>
                      </Box>

                    </Box>
                  </Box>

                </Box>

                <TxRecent setView={()=>setLayerView('HISTORY')} />
                <YieldSettings />

                <Box pad={{ horizontal:'small', top:'small', bottom:undefined }} gap="small" border='all' round='xsmall'>

                  <Box direction='row' justify='between' onClick={()=>setDiagnosticsOpen(!diagnosticsOpen)}>
                    <Text alignSelf='start' size='small' weight='bold'>Diagnostics Info</Text> 
                    { diagnosticsOpen ? <ArrowUp /> : <ArrowDown /> }
                  </Box>
                  <Collapsible open={diagnosticsOpen}>
                    <Box gap='small' pad={{ bottom:'small' }}>
                      <Text size='xxsmall'>App Version: { yieldData.appVersion }</Text>
                      <Text size='xxsmall'>Connected Network: { provider?.network?.name }</Text>
                      <Text size='xxsmall'>Yield Version: { yieldData.contractsVersion }</Text>
                      <Text size='xxsmall'>Yield protocol Ref contract: {process.env[`REACT_APP_MIGRATION_${chainId}`]} </Text> 

                      <Box direction='row' justify='between'>
                        <Box />
                        <RaisedButton 
                          label={<Box pad='xsmall'><Text size='xxsmall'>Factory Reset</Text></Box>}
                          // eslint-disable-next-line no-restricted-globals
                          onClick={()=>{localStorage.clear(); location.reload();}}
                        /> 
                      </Box>
                    </Box>
                  </Collapsible>     
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
                            height="1.5rem"
                            width="1.5rem"
                            // style={{
                            //   position: 'absolute',
                            //   left: '1rem',
                            // }}
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
                </Box>
              </Box>}

              { 
              
              account && 
              layerView === 'HISTORY' &&
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
                  {histOpen === 'BORROW' && <History filterTerms={['Borrowed', 'Repaid', 'Deposited', 'Withdrew', 'Imported', 'Rolled', 'Borrowed for USDC']} series={null} />}
                  {histOpen === 'LEND' && <History filterTerms={['Closed', 'Lent' ]} series={null} />}
                  {histOpen === 'POOL' && <History filterTerms={['Added', 'Removed' ]} series={null} />}
                </Box>
              </Box> 
}

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
