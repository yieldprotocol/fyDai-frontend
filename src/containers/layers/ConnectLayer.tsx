import React, { useEffect, useState, useContext } from 'react';
import styled, { css } from 'styled-components';
import {
  Anchor,
  Layer,
  Image,
  Footer,
  Box,
  Text,
  ResponsiveContext,
  CheckBox,
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
import EtherscanButton from '../../components/EtherscanButton';
import { FaAcquisitionsIncorporated } from 'react-icons/fa';

const StyledBox = styled(Box)`
  background: #f8f8f8;
  border-radius: 25px;
  border-color: #f8f8f8;
  transition: all 0.3s ease-in-out;
  ${(props:any) => !(props.border) && css`
  box-shadow: 0px 0px 0px #dfdfdf, -0px -0px 0px #ffffff;
  :active:hover {
    transform: scale(1);
    box-shadow: inset 6px 6px 11px #dfdfdf, inset -6px -6px 11px #ffffff;
    }
  :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px #dfdfdf, -6px -6px 11px #ffffff;
    }
  `}
  ${(props:any) => (props.border) && css`
  box-shadow:  inset 6px 6px 11px #dfdfdf,  
    inset -6px -6px 11px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    }
  :hover {
    /* transform: scale(1.01); */
    }
  `}
  ${(props:any) => (props.disabled) && css`
  box-shadow:  0px 0px 0px #dfdfdf, 
    -0px -0px 0px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    }
  :hover {
    transform: scale(1);
    }
  `}
`;

const slippageList = [0.001, 0.005, 0.01];

const ConnectLayer = ({ view, target, closeLayer }: any) => {

  const { state: { position, txHistory, preferences }, actions: { updatePreferences } } = useContext(UserContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  
  const { handleSelectConnector } = useConnection();

  const { account, provider } = useSignerAccount();
  const [ layerView, setLayerView] = useState<string>(view);

  const [ lastTx, setLastTx] = useState<any>(null);
  const [ histOpen, setHistOpen] = useState<string>('BORROW');

  const [ slippage, setSlippage] = useState<number>(0);
  const [ permitStrategy, setPermitStrategy] = useState<boolean>(!preferences.useTxApprovals);

  const connectorList = [
    { name: 'Metamask', image: metamaskImage, connection: injected },
    { name: 'Wallet Connect', image: walletConnectImage, connection: walletconnect },
  ];

  useEffect(()=>{
    setLayerView(view);
  }, [view]);
  
  useEffect(()=>{
    preferences.slippage && setSlippage(slippageList.indexOf(preferences.slippage));
  }, [preferences.slippage]);

  // useEffect(()=>{
  //   console.log(slippage, slippageList[slippage]);
  //   slippage && updatePreferences({ slippage: slippageList[slippage] });
  // }, [slippage]);

  useEffect(()=>{
    setPermitStrategy(!preferences.useTxApprovals);
  }, [preferences.useTxApprovals]);

  // useEffect(()=>{
  //   updatePreferences({ useTxApprovals: permitStrategy });
  // }, [permitStrategy]);

  useEffect(()=>{
    let newArr; 
    txHistory && ( newArr = txHistory.items.sort((a:any, b:any) => { return b.date-a.date;}));
    txHistory && setLastTx(newArr[0]);
  }, [txHistory]);

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
                    {/* <ProfileButton /> */}

                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>Account:</Text> 
                      <Text size='xsmall'> {account} </Text>                   
                    </Box>               

                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>ETH balance:</Text>
                      <Text size='xsmall'>{ position.ethBalance_ && position.ethBalance_ || '' }</Text>
                    </Box>

                    <Box direction='row' gap='small'>
                      <Text size='xsmall'>DAI balance:</Text>
                      <Text size='xsmall'>{ position.daiBalance_ && position.daiBalance_ || '' }</Text>
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
                        label={<Text size='xsmall'>View full history</Text>}
                      /> 
                    </Box>
                  </Box> 

                  <Box
                    pad={{ vertical:'small' }}
                    gap='small'
                    align='start'
                  >
                    <Text size='xsmall'>Last transaction: </Text>
                    <Text size='xxsmall'>{lastTx?.transactionHash} </Text>
                    <Box>
                      <EtherscanButton txHash={lastTx?.transactionHash} /> 
                    </Box>
                  </Box>

                </Box>

                <Box pad="small" gap="small">
                  <Box direction='row' justify='between'>
                    <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Settings</Text> 
                    <Box round>
                      <FlatButton
                        disabled
                        onClick={()=>console.log('STILL TO DO!')}
                        label={<Text size='xsmall'>More settings</Text>}
                      /> 
                    </Box>
                  </Box>  


                  <Box
                    pad={{ vertical:'small' }}
                    justify="between"
                    gap='small'
                    direction='row'
                    align='center'
                  >
                    <Text size='xsmall'>Slippage tolerance:  </Text>

                    { slippageList.map( (x:any, i:number) => {


                    })}

                    <Box gap='small' align='center'>
                      <StyledBox
                        pad={{ horizontal: 'large', vertical: 'xsmall' }}
                        onClick={() => updatePreferences({ slippage: slippageList[0] })}
                        border={slippageList.indexOf(preferences.slippage)!== 0 ? undefined : 'all'}
                      >
                        <Text size="small">
                          0.1 %
                        </Text>
                      </StyledBox>
                    </Box>

                    <Box gap='small' align='center'>
                      <StyledBox
                        pad={{ horizontal: 'large', vertical: 'xsmall' }}
                        onClick={() => updatePreferences({ slippage: slippageList[1] })}
                        border={slippage !== 1 ? undefined : 'all'}
                      >
                        <Text size="small">
                          0.5 %
                        </Text>
                      </StyledBox>
                    </Box>

                    <Box gap='small' align='center'>
                      <StyledBox
                        pad={{ horizontal: 'large', vertical: 'xsmall' }}
                        onClick={() => updatePreferences({ slippage: slippageList[2] })}
                        border={slippage !== 2 ? undefined : 'all'}
                      >
                        <Text size="small">
                          1 %
                        </Text>
                      </StyledBox>
                    </Box>
                  </Box>

                  <Box
                    pad={{ vertical:'small' }}
                    justify="between"
                    gap='small'
                    direction='row'
                    align='center'
                  >
                    <Text size='xsmall'>Authorisation strategy: </Text>

                    <Box gap='small' align='center'>
                      <StyledBox
                        pad={{ horizontal: 'large', vertical: 'xsmall' }}
                        onClick={() => updatePreferences({ useTxApprovals: false })}
                        border={permitStrategy ? 'all' : undefined}
                      >
                        <Text size="xxsmall">
                          Sign permits
                        </Text>
                      </StyledBox>
                    </Box>

                    <Box gap='small' align='center'>
                      <StyledBox
                        pad={{ horizontal: 'large', vertical: 'xsmall' }}
                        onClick={() => updatePreferences({ useTxApprovals: true })}
                        border={!permitStrategy?'all': undefined}
                      >
                        <Text size="xxsmall">
                          Approval transactions
                        </Text>
                      </StyledBox>
                    </Box>
                  </Box>

                </Box>

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
