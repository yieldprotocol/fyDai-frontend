import React from 'react';

import { ethers } from 'ethers';

import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

import * as utils from '../../helpers/utils';

import { getNetworkName, useMakerVault }  from '../../hooks/connectionHooks';
import ProfileButton from '../../components/ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

import { useSendTx, useCallTx, useDealer, useGetBalance } from '../../hooks/yieldHooks';

import { YieldContext } from '../../contexts/YieldContext';
import { PositionsContext } from '../../contexts/PositionsContext';

const TestLayer = (props:any) => {
  const { chainId, account } = useWeb3React();

  console.log(utils);

  const web3 = useWeb3React();
  const { state: seriesState } = React.useContext( YieldContext );
  const { state: positionsState, actions: positionsActions } = React.useContext( PositionsContext );
  const [ balance, setBalance ] = React.useState<string|null>('-');
  const [ flow, setFlow ] = React.useState<string|null>('WETH');

  const [ wethBalance, setWethBalance ] = React.useState<string|null>('-');
  const [ chaiBalance, setChaiBalance ] = React.useState<string|null>('-');
  const [ daiBalance, setDaiBalance ] = React.useState<string|null>('-');

  const { closeLayer, changeWallet } = props;
  const [ connectMakerVault ] = useMakerVault();
  const { dispatch } = React.useContext<any>(NotifyContext);

  const [ sendTx ]  = useSendTx();
  const [ callTx ]  = useCallTx();
  
  const { 
    post, 
    approveDealer,
    withdraw,
    borrow,
    repayYDai,
    repayDai,
    postActive,
    withdrawActive,
    repayActive,
    borrowActive,
  }  = useDealer();

  const { getBalance, getChaiBalance, getWethBalance, getDaiBalance }  = useGetBalance();

  const { positionsData } = positionsState;
  const { deployedCore } = seriesState;

  React.useEffect(()=>{
    (async () => setWethBalance( await getWethBalance(seriesState.deployedCore.Weth)) )();
    (async () => setChaiBalance( await getChaiBalance(seriesState.deployedCore.Chai)) )();
    (async () => setDaiBalance( await getDaiBalance(seriesState.deployedCore.Dai)) )();

  }, [seriesState.deployedCore.Weth, postActive, withdrawActive]);

  React.useEffect(() => {
    (async () => setBalance( await getBalance()) )();
    // (async () => setWeiBalance( await getWeiBalance()) )();
    // (async () => activate(injected, console.log))();
  }, [chainId, account]);

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
          background='background-frontheader'
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
            <Text weight="bold">{chainId && getNetworkName(chainId) }</Text>
            <Text weight="bold">{chainId && chainId }</Text>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>ETH balance:</Text>
              <Text size='xsmall'>{ balance }</Text>
            </Box>
            {/* <Box direction='row' gap='small'>
            <Text size='xsmall'>WEI balance:</Text>
            <Text size='xsmall'>{ weiBalance }</Text>
          </Box> */}
            <Box direction='row' gap='small'>
              <Text size='xsmall'>WETH balance:</Text>
              <Text size='xsmall'>{ wethBalance && ethers.utils.formatEther(wethBalance.toString()) }</Text>
            </Box>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>CHAI balance:</Text>
              <Text size='xsmall'>{ chaiBalance && ethers.utils.formatEther(chaiBalance.toString()) }</Text>
            </Box>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>DAI balance:</Text>
              <Text size='xsmall'>{ daiBalance && ethers.utils.formatEther(daiBalance.toString()) }</Text>
            </Box>

            <Box direction='column' gap='small'>
              <Text size='small'>Ilk: </Text>
              <Text size='xsmall'> spot: { seriesState.vatData?.ilks?.spot }</Text>
              <Text size='xsmall'> rate: { seriesState.vatData?.ilks?.rate }</Text>
              <Text size='xsmall'> line: { seriesState.vatData?.ilks?.line }</Text>
            </Box>

            <Box direction='column' gap='small'>
              <Text size='small'>Urn: </Text>
              <Text size='xsmall'>ink: { seriesState.vatData?.urns?.ink }</Text>
              <Text size='xsmall'>art: { seriesState.vatData?.urns?.art }</Text>
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
              {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
              <Button label='1. Add (100 weth)- DEV' onClick={()=> sendTx(seriesState.deployedCore.Weth, 'Weth', 'mint', [account, ethers.utils.parseEther('100').toString()] )} />
             
              <Button label='2. Weth approve dealer 1.5' onClick={()=> approveDealer(seriesState.deployedCore.Weth, seriesState.deployedCore.WethDealer, 1.5)} />
              <Button label='3. Post Collateral 1.5' disabled={postActive} onClick={()=> account && post(seriesState.deployedCore.WethDealer, account, 1.5 )} />
              <Button label='(4. Withdraw 1.5)' onClick={()=> account && withdraw(seriesState.deployedCore.WethDealer, account, 1.5 )} />
              
              <Button label='5.Borrow 0.5' onClick={()=> account && borrow(seriesState.deployedCore.WethDealer, seriesState.seriesData[0].maturity, account, 0.5 )} />
              <Button label='6.1 Repay 0.5 in yDai' onClick={()=> account && repayYDai(seriesState.deployedCore.WethDealer, seriesState.seriesData[0].maturity, account, 0.5 )} />
              <Button label='( 6.2 Repay 0.5 in Dai) ' onClick={()=> account && repayDai(seriesState.deployedCore.WethDealer, seriesState.seriesData[0].maturity, account, 0.5 )} />
            </Box>}

            { flow === 'CHAI' && 
            <Box gap='small'>
              
              Get Dai:
              <Button label='1. Approve Wethjoin for 50' onClick={()=> sendTx(seriesState.deployedCore.Weth, 'Weth', 'approve', [seriesState.deployedCore.WethJoin, ethers.utils.parseEther('50').toString()] )} />
              <Button label='2. wethJoin join' onClick={()=> sendTx(seriesState.deployedCore.WethJoin, 'WethJoin', 'join', [account, ethers.utils.parseEther('50').toString()] )} />
              
              <Button label='3. Vat hope' onClick={()=> sendTx(seriesState.deployedCore.Vat, 'Vat', 'hope', [seriesState.deployedCore.DaiJoin])} />
              
              <Button 
                label='3. Vat frob'
                onClick={()=> sendTx(seriesState.deployedCore.Vat, 'Vat', 'frob', 
                  [
                    ethers.utils.formatBytes32String('ETH-A'),
                    account,
                    account,
                    account,
                    ethers.utils.parseEther('1').toString(),
                    5,
                  ] 
                )}
              />

              <Button label='4. daiJoin EXit' onClick={()=> sendTx(seriesState.deployedCore.DaiJoin, 'DaiJoin', 'exit', [account, '3'] )} />
              
              Convert Dai to Chai:
              <Button label='5. Approve chai' onClick={()=> sendTx(seriesState.deployedCore.Dai, 'Dai', 'approve', [seriesState.deployedCore.Chai, '2'] )} />
              <Button label='6. Chai join ' onClick={()=> sendTx(seriesState.deployedCore.Chai, 'Chai', 'join', [account, '2'] )} />

              {/* <Button label='2. CHAI approve dealer 1.5' onClick={()=> approveDealer(seriesState.deployedCore.Weth, seriesState.seriesData[0].Dealer, 1.5)} />
              <Button label='3. Post CHAI Collateral 1.5' disabled={postActive} onClick={()=> account && post(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
              <Button label='(4. Withdraw 1.5 CHAI)' onClick={()=> account && withdraw(seriesState.seriesData[0].Dealer, 'WETH', account, 1.5 )} />
              <Button label='5.Borrow 0.5' onClick={()=> account && borrow(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
              <Button label='( 6.1 Repay 0.5 in yDai )' onClick={()=> account && repayYDai(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} />
              <Button label='6.2 Repay 0.5 in Dai' onClick={()=> account && repayDai(seriesState.seriesData[0].Dealer, 'WETH', account, 0.5 )} /> */}
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
          > 
            { positionsData.length > 0 && !positionsState.isLoading ? 
              <Box pad='small' gap='medium' fill>
                <Box direction='row'>
                  <Text weight='bold'>yDai[0]: {positionsData[0].symbol}</Text>
                </Box>
                <Box gap='small'>
                  <Text>weth posted: { positionsData[0].wethPosted }</Text>
                  {/* <Text>chai posted: { positionsData[0].chaiPosted }</Text> */}
                  <Text> yDai Balance: { positionsData[0].yDaiBalance }</Text>
                  <Text>yDai Debt (WETH): { positionsData[0].debtYDai }</Text>
                  {/* <Text>yDai Debt (CHAI): { positionsData[0].yDaiDebtChai }</Text> */}
                  <Text>Dai Debt: { positionsData[0].debtDai }</Text>

                  <Text>Total Debt Weth: { positionsData[0].totalDebtWeth }</Text>
                  <Text>Total Debt Dai: { positionsData[0].totalDebtDai }</Text>
                </Box>
                <Button label='refresh' onClick={()=>positionsActions.getPositions([seriesState.seriesData[0]])} />
              </Box>
              :
              <Box pad='small' fill align='center' justify='center'> 
                <Text>Loading... </Text>
              </Box>}
          </Box>
        </Box>

        <Footer pad='medium' gap='xsmall' direction='row' justify='center' align='center'>
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
        </Footer>
      </Box>
    </Layer>
  );
};

export default TestLayer;
