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
} from 'grommet';

import { 
  FiArrowLeft as ArrowLeft,
} from 'react-icons/fi';

import {
  useConnection,
  useSignerAccount,
} from '../../hooks';

import { injected, torus } from '../../connectors';
import metamaskImage from '../../assets/images/providers/metamask.png';
import torusImage from '../../assets/images/providers/torus.png';

import { UserContext } from '../../contexts/UserContext';

import ProfileButton from '../../components/ProfileButton';

const ConnectLayer = ({ view, target, closeLayer }: any) => {

  const { state: { position } } = useContext(UserContext);
  const screenSize = useContext(ResponsiveContext);
  const { account, provider } = useSignerAccount();
  const [ layerView, setLayerView] = useState<string>(view);
  const { handleSelectConnector } = useConnection();

  const connectorList = [
    { name: 'Metamask', image: metamaskImage, connection: injected },
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
            width={screenSize!=='small'?{ min:'600px', max:'750px' }: undefined}
            background="background-front"
            direction="column"
            fill="vertical"
            style={{
              borderRadius: '0.5rem',
              padding: '2rem',
            }}
          >
            { account && layerView !== 'CONNECT' &&

              <>
                <Box pad="medium" gap="small">
                  <Box direction='row' justify='between'>

                    <Text alignSelf='start' size='xxlarge' color='brand' weight='bold'>Connected Wallet</Text>   
                    <Box round>
                      <Button 
                        fill='horizontal'
                        size='small' 
                        onClick={()=>setLayerView('CONNECT')}
                        color='background-front'
                        label='Change wallet'
                        hoverIndicator='background'
                      /> 
                    </Box>

                  </Box>
                   
                  <Box
                    pad={{ vertical:'medium' }}
                    justify="center"
                    gap='small'
                  >
                    {/* <ProfileButton /> */}
                    {account}
                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>Connected Network:</Text> 
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

                <Box pad="medium" gap="small">
                  <Text alignSelf='start' size='xxlarge' color='brand' weight='bold'>Account Settings</Text>    
                  <Box
                    pad={{ vertical:'medium' }}
                    justify="center"
                    gap='small'
                  >
                    <Text size='xsmall'>Slippage value: 0.05% </Text> 
                  </Box>
                </Box>





                <Footer pad='medium' gap='xsmall' direction='row' justify='start' align='center'>
                  <Box alignSelf='start'>
                    <Box
                      round
                      onClick={()=>closeLayer()}
                      hoverIndicator='brand-transparent'
                      pad={{ horizontal:'small', vertical:'small' }}
                      justify='center'
                    >
                      <Box direction='row' gap='small' align='center'>
                        <ArrowLeft color='text-weak' />
                        <Text size='xsmall' color='text-weak'> go back  </Text>
                      </Box>
                    </Box>
                  </Box>
                </Footer>
              </> }

            { layerView === 'CONNECT' &&      
              <Box pad="medium" gap="small">

                <Box align="center" pad="medium" gap="small">
                  <Text size='xxlarge' color='brand' weight='bold'>Connect a wallet</Text>

                  <Paragraph>Try connecting with:</Paragraph>
                  {connectorList.map((x) => (
                    <Button
                      hoverIndicator="border"
                      onClick={() => { handleSelectConnector(x.connection); closeLayer();}}
                      label={x.name}
                      color="border"
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
                <Footer direction="row-responsive" justify='between' pad="medium">

                  <Box alignSelf='start'>
                    <Box
                      round
                      hoverIndicator='brand-transparent'
                      pad={{ horizontal:'small', vertical:'small' }}
                      justify='center'
                      onClick={() => {
                        if (view === 'ACCOUNT') { 
                          setLayerView('ACCOUNT');
                        } else {
                          closeLayer();
                        }
                      }}
                    >
                      <Box direction='row' gap='small' align='center'>
                        <ArrowLeft color='text-weak' />
                        <Text size='xsmall' color='text-weak'> go back  </Text>
                      </Box>
                    </Box>
                  </Box>

                  <Box direction="row">
                    <Button
                      label="Close"
                      fill="horizontal"
                      color="border"
                      style={{
                        fontWeight: 600,
                        height: screenSize === 'small' ? '2.25rem' : 'auto',
                      }}
                      onClick={()=>closeLayer()}
                    />
                  </Box>
                </Footer>
              </Box>}
          </Box>
        </Layer>
      )}
    </>
  );
};

export default ConnectLayer;
