import React from 'react';

import { ethers } from 'ethers';
import Moment from 'moment'; 

import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

// import { BigNumber.from } from 'ethers';
import * as utils from '../../utils';

// import { getNetworkName }  from '../../hooks/connectionHooks';
import ProfileButton from '../../components/ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

import { useSendTx, useCallTx, useController, useProxy, useAuth, useTimeTravel } from '../../hooks';

import { YieldContext } from '../../contexts/YieldContext';
import { SeriesContext } from '../../contexts/SeriesContext';
import { UserContext } from '../../contexts/UserContext';

const TestLayer = (props:any) => {
  const { chainId, account } = useWeb3React();

  // const web3 = useWeb3React();
  const { state: { position }, actions: userActions } = React.useContext( UserContext );
  const { state: yieldState, actions: yieldActions } = React.useContext( YieldContext );
  const { state: seriesState, actions: seriesActions } = React.useContext( SeriesContext );
  const [ flow, setFlow ] = React.useState<string|null>('APPROVALS');

  const { activeSeries, seriesData } = seriesState;
  const { yieldData, deployedContracts, deployedSeries } = yieldState;
  

  // const [ wethBalance, setWethBalance ] = React.useState<string|null|number>(0);
  // const [ chaiBalance, setChaiBalance ] = React.useState<string|null|number>(0);
  // const [ daiBalance, setDaiBalance ] = React.useState<string|null|number>(0);

  const [daiDebt, setDaiDebt] = React.useState<ethers.BigNumber>();
  const [daiTokens, setDaiTokens] = React.useState<ethers.BigNumber>();
  const [wethTokens, setWethTokens] = React.useState<ethers.BigNumber>();
  const [chaiTokens, setChaiTokens] = React.useState<ethers.BigNumber>();

  const [chainDate, setChainDate] = React.useState<any>(null);

  const { closeLayer, changeWallet } = props;
  // const [ connectMakerVault ] = useMakerVault();
  const { dispatch } = React.useContext<any>(NotifyContext);

  const [ sendTx ]  = useSendTx();
  const [ callTx ]  = useCallTx();

  const { advanceTimeAndBlock, takeSnapshot, revertToSnapshot, revertToT0, block, timestamp } = useTimeTravel(); 


  const { yieldAuth, poolAuth } = useAuth();
  
  const { 
    post,
    withdraw,
    borrow,
    repay,
    repayActive,
    borrowActive,
    postActive,
    withdrawActive,
  }  = useController();

  const { 
    postEth, 
    withdrawEth,
    postEthActive,
    withdrawEthActive,
  }  = useProxy();

  // const { getChaiBalance, getWethBalance, getDaiBalance }  = useBalances();

  // React.useEffect(()=>{
  //   (async () => setWethBalance( await getWethBalance(deployedContracts.Weth)) )();
  //   (async () => setChaiBalance( await getChaiBalance(deployedContracts.Chai)) )();
  //   (async () => setDaiBalance( await getDaiBalance(deployedContracts.Dai)) )();
  // }, [deployedContracts, postActive, withdrawActive]);

  React.useEffect(()=>{
    const daiD = utils.toWad(1);
    const chi  = utils.toRay(1.2);

    setDaiDebt( daiD );

    if ( yieldState?.makerData?.ilks?.rate  ) {
      console.log(yieldState.makerData);
      const daiT = utils.mulRay( daiD, yieldState.makerData.ilks.rate);
      const wethT = utils.divRay( daiT, yieldState.makerData.ilks.spot);
      const chaiT = utils.divRay(daiT, chi);
      setDaiTokens(daiT);
      setWethTokens(wethT);
      setChaiTokens(chaiT);
    }

  }, [ yieldState ] );

  React.useEffect(()=>{




  }, [chainDate]);

  // React.useEffect(() => {
  //   // (async () => setBalance( await getBalance()) )();
  //   // (async () => setWeiBalance( await getWeiBalance()) )();
  //   // (async () => activate(injected, console.log))();
  // }, [chainId, account]);

  const onClose = () => {
    closeLayer();
  };

  return (
    <Layer 
      animation='slide'
      position='center'
      full
      modal={true}
      onClickOutside={onClose}
      onEsc={()=>closeLayer()}
    >
      <Box 
        direction='column'
        fill='vertical'
        background='background-front'
         // alignContent='center'
        style={{ minWidth: '240px' }}
        gap='small'
      >
        <Header 
          round={{ corner:'bottom', size:'medium' }}
          fill='horizontal'
          background='background-mid'
          pad={{ horizontal: 'small', vertical:'medium' }}
        >
          <Heading level='6'> FOR TESTING ONLY</Heading>
          {/* <Anchor color='brand' onClick={()=>onClose()} size='xsmall' label='close' /> */}
        </Header>

        <Box direction='row' justify='evenly'>
          <Box
            pad="medium"
            align="center"
            justify="center"
            gap='small'
          >
            <ProfileButton />
            <Text size='xsmall'>Connected to:</Text>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>ETH balance:</Text>
              <Text size='xsmall'>{ position.ethBalance_ || '' }</Text>
            </Box>
          </Box>

          <Box 
            align='center'
            gap='small'
            overflow='auto'
            margin='small'
          >
            <Box direction='row'>
              <Button primary={flow==='APPROVALS'} label='Approvals' onClick={()=>setFlow('APPROVALS')} style={{ borderRadius:'24px 0px 0px 24px' }} />
              <Button primary={flow==='MARKET'} label='Pool' onClick={()=>setFlow('MARKET')} style={{ borderRadius:'0px 0px 0px 0px' }} />    
              <Button primary={flow==='MATURITY'} label='Maturity' onClick={()=>setFlow('MATURITY')} style={{ borderRadius:'0px 24px 24px 0px' }} />  

              <Button primary={flow==='ADD'} label='Add' onClick={()=>setFlow('ADD')} style={{ borderRadius:'0px 24px 24px 0px' }} /> 
            </Box>

            {
              flow === 'APPROVALS' &&
              <Box gap='small'>
                Test Approvals (not all reqd.):

                <Button primary label='controller addDelegate:EthProxy' onClick={()=> sendTx(deployedContracts.Controller, 'Controller', 'addDelegate', [deployedContracts.YieldProxy], utils.toWei('0'))} />             
                <Button primary label='controller addDelegate:DaiProxy[0]' onClick={()=> sendTx(deployedContracts.Controller, 'Controller', 'addDelegate', [deployedSeries[0].yieldProxyAddress], utils.toWei('0'))} />

                <Button primary label='pool[0] addDelegate: eDai[0]' onClick={()=> sendTx(deployedSeries[0].poolAddress, 'Pool', 'addDelegate', [deployedSeries[0].eDaiAddress], utils.toWei('0'))} />
                <Button primary label='pool[0] addDelegate: yieldProxy[0]' onClick={()=> sendTx(deployedSeries[0].poolAddress, 'Pool', 'addDelegate', [deployedContracts.YieldProxy], utils.toWei('0'))} />
                <Button primary label='Pool[0] addDelegate: yieldProxy[0]' onClick={()=> sendTx(deployedSeries[0].poolAddress, 'Pool', 'addDelegate', [deployedSeries[0].yieldProxyAddress], utils.toWei('0'))} />

              </Box>
            }

            {
            flow === 'MARKET' &&
              <Box gap='small'>
                Pool:
                <Button primary label='Check buy Rate' onClick={()=> sendTx(deployedContracts.Controller, 'Controller', 'addDelegate', [deployedContracts.YieldProxy], utils.toWei('0'))} />
                <Button primary label='Pool (for each market)' onClick={()=> sendTx(deployedContracts.Pool, 'Controller', 'addDelegate', [deployedContracts.YieldProxy], utils.toWei('0'))} />
              </Box>
            }

            { flow === 'ETH-A' && 
            <Box gap='small'>

              New ETH direct deposit/withdraw: 
              <Button label='Post ETH Collateral via proxy 1.5' disabled={postActive} onClick={()=> postEth(1.5)} />
              <Button primary label='controller addDelegate:EthProxy' onClick={()=> sendTx(deployedContracts.Controller, 'Controller', 'addDelegate', [deployedContracts.YieldProxy], utils.toWei('0'))} />             
              <Button label='Withdraw ETH via proxy 1.5)' onClick={()=> withdrawEth(1.5 )} />
              <Button label='6.1 Repay 0.5 eth/weth debt in eDai' onClick={()=> repay('ETH-A', yieldState.deployedSeries[0].maturity, 0.5, 'YDAI' )} />
              <Button label='( 6.2 Repay 0.5 eth/weth debt in Dai) ' onClick={()=> repay('ETH-A', yieldState.deployedSeries[0].maturity, 0.5, 'DAI' )} />
            
            </Box>}

            { flow === 'ADD' && 
            <Box gap='small'>

              WETH CHAI deposit/withdraw: 

              <Button label='1. Approve Wethjoin for 1weth' onClick={()=> sendTx(deployedContracts.Weth, 'Weth', 'approve', [deployedContracts.WethJoin, ethers.BigNumber.from('1')], ethers.BigNumber.from(0) )} />
              <Button label='2. wethJoin join (take 1weth)' onClick={()=> sendTx(deployedContracts.WethJoin, 'WethJoin', 'join', [account, ethers.BigNumber.from('1')], ethers.BigNumber.from(0) )} />

              <Button label='3. post 0.5 to controller' onClick={()=> sendTx(deployedContracts.Controller, 'Controller', 'post', [ ethers.utils.formatBytes32String('ETH-A'), account, account, ethers.BigNumber.from('0.5')], utils.toWei('0'))} />

            </Box>}

            { flow === 'CHAI' && 
            <Box gap='small'>
              
              Get Dai:
              
              <Button label='1. Approve Wethjoin for 1weth' onClick={()=> sendTx(deployedContracts.WETH9, 'WETH9', 'approve', [deployedContracts.WethJoin, wethTokens], ethers.BigNumber.from(0) )} />
              <Button label='2. wethJoin join (take 1weth)' onClick={()=> sendTx(deployedContracts.WethJoin, 'WethJoin', 'join', [account, wethTokens], ethers.BigNumber.from(1) )} />
              <Button label='( x. wethJoin EXit 1weth)' onClick={()=> sendTx(deployedContracts.WethJoin, 'WethJoin', 'exit', [account, wethTokens ], ethers.BigNumber.from(0) )} />

              <Button
                label='3. Vat frob (open vault?)'
                onClick={()=> sendTx(deployedContracts.Vat, 'Vat', 'frob', 
                  [
                    ethers.utils.formatBytes32String('ETH-A'),
                    account,
                    account,
                    account,
                    wethTokens,
                    daiDebt,
                  ],
                  ethers.BigNumber.from(0)
                )}
              />
              <Button label='(x. Vat hope daiJoin)' onClick={()=> sendTx(deployedContracts.Vat, 'Vat', 'hope', [deployedContracts.DaiJoin], ethers.BigNumber.from(0))} />
             
              <Button label='4. daiJoin EXit (daiDebt = 1)' onClick={()=> sendTx(deployedContracts.DaiJoin, 'DaiJoin', 'exit', [account, daiTokens ], ethers.BigNumber.from(0) )} />
              
              Convert Dai to Chai:
              <Button label='5. Approve chai (approx. 1)' onClick={()=> sendTx(deployedContracts.Dai, 'Dai', 'approve', [deployedContracts.Chai, daiTokens ], ethers.BigNumber.from(0) )} />
              <Button label='6. Chai join (approx. 1)' onClick={()=> sendTx(deployedContracts.Chai, 'Chai', 'join', [account, daiTokens ], ethers.BigNumber.from(0) )} />

  
              Chai deposit and borrow:
              <Button label='3. Post Chai Collateral 0.5' disabled={postActive} onClick={()=> post('CHAI', 0.5 )} />
              <Button label='(4. Withdraw 0.5 chai)' onClick={()=> withdraw('CHAI', 0.5 )} />
              <Button label='5.Borrow 0.5 with chai' onClick={()=> borrow('CHAI', deployedSeries[0].maturity, 0.5 )} />

              Chai repay; 
              <Button label='(6.1 Repay 0.5 chaidebt in eDai)' onClick={()=> repay('CHAI', deployedSeries[0].maturity, 0.5, 'YDAI' )} />
              <Button label=' 6.2 Repay 0.5 chaidebt in Dai ' onClick={()=> repay('CHAI', deployedSeries[0].maturity, 0.5, 'DAI' )} />
            </Box>}

            { flow === 'MATURITY' && 
            <Box gap='small'>
              <Button label='Mature eDai' onClick={()=> account && console.log('not mature')} />
              <Button label='Redeem Dai' onClick={()=> account && console.log('not mature')} />
            </Box>}
          </Box>

          <Box
            pad="medium"
            align="center"
            justify="center"
            gap='small'
            overflow='auto'
          > 
            { seriesData.size > 0 && !seriesState.isLoading ? 
              <Box pad='small' gap='medium' fill>
                <Box direction='row'>
                  {/* <Text weight='bold'>eDai[0]: {seriesData.get('eDai-2020-09-30').name}</Text> */}
                </Box>
                <Box gap='small'>
                  <Text weight='bold'>Posted collateral:</Text>
                  <Text>weth posted: { position.ethPosted_ || '' }</Text>
                </Box>
              </Box>
              :
              <Box pad='small' fill align='center' justify='center'> 
                <Text>Loading... </Text>
              </Box>}
          </Box>
        </Box>

        <Box direction='row' justify='between' border='all' pad='small' gap='small'>
          Time-travelling: 
          <Button 
            primary
            label='Jump forward a month' 
            onClick={async ()=> {
              await advanceTimeAndBlock('2592000');
            }}
          />

          blockchain date: {timestamp && Moment(timestamp*1000).format('DD MMM YYYY') }

          <Button 
            label='mature Active series' 
            onClick={()=> sendTx(activeSeries.eDaiAddress, 'EDai', 'mature', [], ethers.BigNumber.from(0) )}
          />

        </Box>

        <Box direction='row' justify='between' border='all' pad='small' gap='small'>
          SnapShot and revert : 
          <Button 
            label='take snapshot' 
            primary
            onClick={async ()=> {
              await takeSnapshot();
            }}
          />
          <Button 
            label='revert to last snapshot' 
            onClick={async ()=> {
              await revertToSnapshot();
            }}
          />
          <Button 
            label='revert to first snapshot' 
            onClick={async ()=> {
              await revertToT0();
            }}
          />
        </Box>




        NB: dont forget to reset metamask after any timetravelling!!


        <Box direction='row' justify='between' border='all' pad='small' gap='small'>
          Permit sign testing : 
          <Button 
            label='yieldAuth' 
            primary
            onClick={async ()=> {
              await yieldAuth();
            }}
          />

          <Button 
            label='poolAuth' 
            primary
            onClick={async ()=> {
              await poolAuth(deployedSeries[0].eDaiAddress, deployedSeries[0].poolAddress);
            }}
          />


        </Box>

        <Footer pad='medium' gap='xsmall' direction='row' justify='between' align='center'>
          <Box round>
            <Button
              fill='horizontal'
              size='small' 
              onClick={()=>changeWallet()}
              color='background-front'
              label='Change wallet'
              hoverIndicator='background'
            />
          </Box>
          <Button
            alignSelf='end'
            label='soft refresh data' 
            onClick={
            async ()=> {
              await Promise.all([
                seriesActions.updateSeries(yieldState.deployedSeries),
                userActions.updatePosition(),
                seriesActions.updateActiveSeries(),
              ]);
            }
          }
          />

          <Button
            alignSelf='end'
            label='clear cache' 
            onClick={
            async ()=> {
              window.localStorage.clear();
            }
          }
          />

          <Button
            alignSelf='end'
            label='reload app' 
            onClick={
            async ()=> {
              window.location.reload();
            }
          }
          />

        </Footer>
      </Box>
    </Layer>
  );
};

export default TestLayer;
