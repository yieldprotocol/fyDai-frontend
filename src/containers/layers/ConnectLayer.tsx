import React, { useEffect, useState, useContext } from 'react';

import {
  Anchor,
  Layer,
  Image,
  Header,
  Heading,
  Footer,
  Button,
  Box,
  Text,
  ResponsiveContext,
  Paragraph,
  Collapsible,
} from 'grommet';

import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import { FaCaretDown } from 'react-icons/fa';
import {
  useConnection,
  useSignerAccount,
} from '../../hooks';

import { injected, torus, walletconnect } from '../../connectors';
import metamaskImage from '../../assets/images/providers/metamask.png';
import torusImage from '../../assets/images/providers/torus.png';

import walletConnectImage from '../../assets/images/providers/walletconnect.png';

import { UserContext } from '../../contexts/UserContext';

import RaisedButton from '../../components/RaisedButton';
import FlatButton from '../../components/FlatButton';
import TxHistory from '../../components/TxHistory';

const ConnectLayer = ({ view, target, closeLayer }: any) => {

  const { state: { position } } = useContext(UserContext);
  const screenSize = useContext(ResponsiveContext);
  const { account, provider } = useSignerAccount();
  const [ layerView, setLayerView] = useState<string>(view);
  const { handleSelectConnector } = useConnection();

  const [ histOpen, setHistOpen] = useState<string>('BORROW');

  const connectorList = [
    { name: 'Metamask', image: metamaskImage, connection: injected },
    { name: 'Wallet Connect', image: walletConnectImage, connection: walletconnect },
    { name: 'Torus', image: torusImage, connection: torus },
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
            width={screenSize!=='small'?{ min:'600px', max:'600px' }: undefined}
            background="background-front"
            direction="column"
            fill="vertical"
            style={{
              borderRadius: '0.5rem',
              padding: '2rem',
            }}
          >

            { account && layerView === 'ACCOUNT' &&
              <>
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
                    {/* <ProfileButton /> */}
                    {account}
                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>Network:</Text> 
                      <Text weight="bold"> { provider.network.name } </Text>                   
                    </Box> 

                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>ETH balance:</Text>
                      <Text>{ position.ethBalance_ && position.ethBalance_ || '' }</Text>
                    </Box>

                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>DAI balance:</Text>
                      <Text>{ position.daiBalance_ && position.daiBalance_ || '' }</Text>
                    </Box>
                    {/* <Button fill='horizontal' label='Connect to another wallet' onClick={()=>setShowConnectLayer(true)} /> */}
                  </Box>
                </Box>

                <Box pad="small" gap="small">
                  <Box direction='row' justify='between'>
                    <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Transactions</Text>   
                    <Box round>
                      <FlatButton
                        onClick={()=>setLayerView('HISTORY')}
                        label={<Text size='xsmall'>View history</Text>}
                      /> 
                    </Box>
                  </Box>  
                  <Box
                    pad={{ vertical:'small' }}
                    justify="center"
                    gap='small'
                  >
                    <Text size='xsmall'>Last complete transaction: txhashofsomething </Text>
                    <Text size='xsmall'>Pending transactions: txhashofsomething </Text>    
                  </Box>
                </Box>

                <Box pad="small" gap="small">
                  <Box direction='row' justify='between'>
                    <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Account Settings</Text> 
                    <Box round>
                      <FlatButton
                        onClick={()=>console.log('STILL TO DO!')}
                        label={<Text size='xsmall'>More settings</Text>}
                      /> 
                    </Box>
                  </Box>  
                  <Box
                    pad={{ vertical:'small' }}
                    justify="center"
                    gap='small'
                  >
                    <Text size='xsmall'>Slippage value: 0.05% </Text> 
                  </Box>
                </Box>

              </> }

            { layerView === 'CONNECT' &&      
              <Box pad="medium" gap="small">

                <Box align="center" pad="medium" gap="small">
                  <Text size='xxlarge' color='brand' weight='bold'>Connect a wallet</Text>

                  <Paragraph>Try connecting with:</Paragraph>
                  {connectorList.map((x) => (
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
                    />
                  ))}

                  <Box gap="xsmall" direction="row">
                    <Anchor href="#" label="Help!" size="xsmall" color="brand" />
                    <Text size="xsmall"> I'm not sure what this means.</Text>
                  </Box>
                </Box>

              </Box>}

            { account && layerView === 'HISTORY' &&      
              <Box pad="medium" gap="small"> 
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
                  {histOpen === 'BORROW' && <TxHistory filterTerms={['Bought', 'Repaid', 'Deposited', 'Withdrew']} view='borrow' />}
                  {histOpen === 'LEND' && <TxHistory filterTerms={['Bought', 'Sold' ]} view='lend' />}
                  {histOpen === 'POOL' && <TxHistory filterTerms={['Bought', 'Sold' ]} view='pool' />}
                </Box>
              </Box> }

            <Footer direction="row-responsive" justify='between' pad="medium" margin={{top:'medium'}}>
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
