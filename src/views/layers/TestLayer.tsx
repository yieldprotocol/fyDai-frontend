import React from 'react';

import { ethers } from 'ethers';

import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

// import { BigNumber.from } from 'ethers';
import * as utils from '../../utils';

import { getNetworkName }  from '../../hooks/connectionHooks';
import ProfileButton from '../../components/ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

import { useSendTx, useCallTx, useDealer, useBalances, useEthProxy } from '../../hooks';

import { YieldContext } from '../../contexts/YieldContext';
import { SeriesContext } from '../../contexts/SeriesContext';
import { ConnectionContext } from '../../contexts/ConnectionContext';

const TestLayer = (props:any) => {
  // const { chainId, account } = useWeb3React();
  const { state: { chainId, account } } = React.useContext(ConnectionContext);


  // const web3 = useWeb3React();
  const { state: yieldState, actions: yieldActions } = React.useContext( YieldContext );
  const { state: seriesState, actions: seriesActions } = React.useContext( SeriesContext );
  const [ flow, setFlow ] = React.useState<string|null>('WETH');

  const { seriesData } = seriesState;
  const { yieldData, deployedContracts, deployedSeries, userData } = yieldState;
  

  // const [ wethBalance, setWethBalance ] = React.useState<string|null|number>(0);
  // const [ chaiBalance, setChaiBalance ] = React.useState<string|null|number>(0);
  // const [ daiBalance, setDaiBalance ] = React.useState<string|null|number>(0);

  const [daiDebt, setDaiDebt] = React.useState<ethers.BigNumber>();
  const [daiTokens, setDaiTokens] = React.useState<ethers.BigNumber>();
  const [wethTokens, setWethTokens] = React.useState<ethers.BigNumber>();
  const [chaiTokens, setChaiTokens] = React.useState<ethers.BigNumber>();

  const { closeLayer, changeWallet } = props;
  // const [ connectMakerVault ] = useMakerVault();
  const { dispatch } = React.useContext<any>(NotifyContext);

  const [ sendTx ]  = useSendTx();
  const [ callTx ]  = useCallTx();
  
  const { 
    post,
    withdraw,
    approveDealer,
    borrow,
    repay,
    repayActive,
    borrowActive,
    postActive,
    withdrawActive,
  }  = useDealer();

  const { 
    postEth, 
    withdrawEth,
    postEthActive,
    withdrawEthActive,
  }  = useEthProxy();

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

  // React.useEffect(() => {
  //   // (async () => setBalance( await getEthBalance()) )();
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

            {/* <Text weight="bold">{chainId && getNetworkName(chainId) }</Text>
            <Text weight="bold">{chainId && chainId }</Text> */}

            <Box direction='row' gap='small'>
              <Text size='xsmall'>ETH balance:</Text>
              <Text size='xsmall'>{ userData.ethBalance_ || '' }</Text>
            </Box>
            {/* <Box direction='row' gap='small'>
            <Text size='xsmall'>WEI balance:</Text>
            <Text size='xsmall'>{ weiBalance }</Text>
          </Box> */}
            {/* <Box direction='row' gap='small'>
              <Text size='xsmall'>WETH balance:</Text>
              <Text size='xsmall'>{ extBalances.wethBalance_ || '' }</Text>
            </Box>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>CHAI balance:</Text>
              <Text size='xsmall'>{ extBalances.chaiBalance_ || '' }</Text>

            </Box>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>DAI balance:</Text>
              <Text size='xsmall'>{ extBalances.daiBalance_ || '' }</Text>
            </Box> */}

            <Box direction='column' gap='small'>
              <Text size='small'>Ilk: </Text>
              <Text size='xsmall'> spot: { yieldState.makerData?.ilks?.spot_ }</Text>
              <Text size='xsmall'> rate: { yieldState.makerData?.ilks?.rate_  }</Text>
              <Text size='xsmall'> line: { yieldState.makerData?.ilks?.line_ }</Text>
            </Box>

            <Box direction='column' gap='small'>
              <Text size='small'>Urn: </Text>
              <Text size='xsmall'>ink: { yieldState.makerData?.urns?.ink_ }</Text>
              <Text size='xsmall'>art: { yieldState.makerData?.urns?.art_ }</Text>
            </Box>

          </Box>
          <Box 
            align='center'
            gap='small'
            overflow='auto'
            margin='small'
          >
            <Box direction='row'>
              <Button primary={flow==='WETH'} label='WETH flow' onClick={()=>setFlow('WETH')} style={{ borderRadius:'24px 0px 0px 24px' }} />
              <Button primary={flow==='CHAI'} label='CHAI flow' onClick={()=>setFlow('CHAI')} style={{ borderRadius:'0px 0px 0px 0px' }} />
              <Button primary={flow==='MATURITY'} label='Maturity' onClick={()=>setFlow('MATURITY')} style={{ borderRadius:'0px 24px 24px 0px' }} />
            </Box>

            { flow === 'WETH' && 
            <Box gap='small'>

              New ETH direct deposit/withdraw: 
              <Button label='Post ETH Collateral direct 1.5' disabled={postActive} onClick={()=> postEth(deployedContracts.EthProxy, 1.5)} />
              <Button label='(addProxy once-off) ' onClick={()=> sendTx(deployedContracts.Dealer, 'Dealer', 'addDelegate', [deployedContracts.EthProxy], utils.toWei('0'))} />
              <Button label='(Withdraw ETH 1.5)' onClick={()=> withdrawEth(deployedContracts.EthProxy, 1.5 )} />

              get WETH: 
              {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
              <Button label='1. wrap 10 eth to weth' onClick={()=> sendTx(deployedContracts.Weth, 'Weth', 'deposit', [], utils.toWei('10'))} />
              WETH deposit and borrow: 
              <Button label='2. Weth approve YieldDealer for 1.5' onClick={()=> approveDealer(deployedContracts.Weth, deployedContracts.Dealer, 1.5 )} />
              <Button label='3. Post Collateral 1.5' disabled={postActive} onClick={()=> post(deployedContracts.Dealer, 'WETH', 1.5)} />
              <Button label='(4. Withdraw 1.5)' onClick={()=> withdraw(deployedContracts.Dealer, 'WETH', 1.5 )} />
              <Button label='5.Borrow 0.5' onClick={()=> borrow(deployedContracts.Dealer, 'WETH', yieldState.deployedSeries[0].maturity, 0.5 )} />
              WETH repay:
              <Button label='6.1 Repay 0.5 eth/weth debt in yDai' onClick={()=> repay(deployedContracts.Dealer, 'WETH', yieldState.deployedSeries[0].maturity, 0.5, 'YDAI' )} />
              <Button label='( 6.2 Repay 0.5 eth/weth debt in Dai) ' onClick={()=> repay(deployedContracts.Dealer, 'WETH', yieldState.deployedSeries[0].maturity, 0.5, 'DAI' )} />
            </Box>}

            { flow === 'CHAI' && 
            <Box gap='small'>
              
              Get Dai:
              
              <Button label='1. Approve Wethjoin for 1weth' onClick={()=> sendTx(deployedContracts.Weth, 'Weth', 'approve', [deployedContracts.WethJoin, wethTokens], ethers.BigNumber.from(0) )} />
                            
              <Button label='2. wethJoin join (take 1weth)' onClick={()=> sendTx(deployedContracts.WethJoin, 'WethJoin', 'join', [account, wethTokens], ethers.BigNumber.from(0) )} />
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
              {/* <Button label='5. Chai approve chaiDealer Alt' onClick={()=> sendTx(deployedContracts.Dealer, 'Chai', 'approve', [deployedContracts.DealerDealer, utils.divRay(daiTokens, chi) ] )} /> */}
              <Button label='2. Chai approve chaiDealer 0.5' onClick={()=> approveDealer(deployedContracts.Chai, deployedContracts.Dealer, 0.5 )} />
              <Button label='3. Post Chai Collateral 0.5' disabled={postActive} onClick={()=> post(deployedContracts.Dealer, 'CHAI', 0.5 )} />
              <Button label='(4. Withdraw 0.5 chai)' onClick={()=> withdraw(deployedContracts.Dealer, 'CHAI', 0.5 )} />
              <Button label='5.Borrow 0.5 with chai' onClick={()=> borrow(deployedContracts.Dealer, 'CHAI', deployedSeries[0].maturity, 0.5 )} />

              Chai repay; 
              <Button label='(6.1 Repay 0.5 chaidebt in yDai)' onClick={()=> repay(deployedContracts.Dealer, 'CHAI', deployedSeries[0].maturity, 0.5, 'YDAI' )} />
              <Button label=' 6.2 Repay 0.5 chaidebt in Dai ' onClick={()=> repay(deployedContracts.Dealer, 'CHAI', deployedSeries[0].maturity, 0.5, 'DAI' )} />
            </Box>}

            { flow === 'MATURITY' && 
            <Box gap='small'>
              {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
              <Button label='Mature yDai' onClick={()=> account && console.log('not mature')} />
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
                  <Text weight='bold'>yDai[0]: {seriesData.get('yDai-2020-09-30').symbol}</Text>
                </Box>
                <Box gap='small'>
                  <Text weight='bold'>Posted collateral:</Text>
                  <Text>weth posted: { userData.ethPosted_ }</Text>
                  {/* <Text>chai posted: { yieldData.chaiPosted_ }</Text> */}
                  <Text weight='bold'>yDai balance:</Text>
                  <Text>yDai Balance: { seriesData.get('yDai-2020-09-30').yDaiBalance_ }</Text>
                  <Text weight='bold'>Weth Dealer:</Text>
                  {/* <Text>weth Debt Dai: { seriesData.get('yDai-2020-09-30').wethDebtDai_ }</Text> */}
                  <Text>weth Debt YDai: { seriesData.get('yDai-2020-09-30').ethDebtYDai_ }</Text>
                  {/* <Text>weth Total Debt Dai { yieldData.wethTotalDebtDai_ }</Text> */}
                  <Text> weth Total Debt YDai: { userData.ethTotalDebtYDai_ }</Text>
                  <Text weight='bold'>ChaiDealer:</Text>
                  {/* <Text>chai Debt Dai : { seriesData.get('yDai-2020-09-30').chaiDebtDai_}</Text> */}
                  <Text>chai Debt yDai : { seriesData.get('yDai-2020-09-30').chaiDebtYDai_}</Text>
                  {/* <Text>chai Total Debt Dai: { yieldData.chaiTotalDebtDai_ }</Text> */}
                  <Text>chai Total Debt YDai: { userData.chaiTotalDebtYDai_ }</Text>
                </Box>
              </Box>
              :
              <Box pad='small' fill align='center' justify='center'> 
                <Text>Loading... </Text>
              </Box>}
          </Box>
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
            label='refresh' 
            onClick={
            ()=> {
              seriesActions.refreshSeries([yieldState.deployedSeries[0]]);
              yieldActions.updateYieldBalances(yieldState.deployedContracts);
              yieldActions.updateUserData(yieldState.deployedContracts);
            }
          }
          />

        </Footer>
      </Box>
    </Layer>
  );
};

export default TestLayer;
