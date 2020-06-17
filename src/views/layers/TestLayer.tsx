import React from 'react';

import { ethers } from 'ethers';

import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

import { bigNumberify } from 'ethers/utils';
import * as utils from '../../utils';

import { getNetworkName, useMakerVault }  from '../../hooks/connectionHooks';
import ProfileButton from '../../components/ProfileButton';
import { NotifyContext } from '../../contexts/NotifyContext';

import { useSendTx, useCallTx, useDealer, useGetBalance } from '../../hooks/yieldHooks';

import { YieldContext } from '../../contexts/YieldContext';
import { PositionsContext } from '../../contexts/PositionsContext';

const TestLayer = (props:any) => {
  const { chainId, account } = useWeb3React();

  // const web3 = useWeb3React();
  const { state: yieldState } = React.useContext( YieldContext );
  const { state: positionsState, actions: positionsActions } = React.useContext( PositionsContext );
  const [ balance, setBalance ] = React.useState<string|null>('-');
  const [ flow, setFlow ] = React.useState<string|null>('WETH');

  const [ wethBalance, setWethBalance ] = React.useState<string|null>('-');
  const [ chaiBalance, setChaiBalance ] = React.useState<string|null>('-');
  const [ daiBalance, setDaiBalance ] = React.useState<string|null>('-');

  const [daiDebt, setDaiDebt] = React.useState<any>();
  const [daiTokens, setDaiTokens] = React.useState<any>();
  const [wethTokens, setWethTokens] = React.useState<any>();
  const [chaiTokens, setChaiTokens] = React.useState<any>();

  const [selectedSeries, setSelectedSeries] = React.useState<any>();

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
    repay,
    postActive,
    withdrawActive,
    repayActive,
    borrowActive,
  }  = useDealer();

  const { getBalance, getChaiBalance, getWethBalance, getDaiBalance }  = useGetBalance();

  const { positionsData } = positionsState;
  const { deployedCore, deployedSeries } = yieldState;

  React.useEffect(()=>{
    (async () => setWethBalance( await getWethBalance(deployedCore.Weth)) )();
    (async () => setChaiBalance( await getChaiBalance(deployedCore.Chai)) )();
    (async () => setDaiBalance( await getDaiBalance(deployedCore.Dai)) )();

  }, [deployedCore.Weth, postActive, withdrawActive]);

  React.useEffect(()=>{
    const daiD = utils.toWad(12);
    const chi  = utils.toRay(1.25);

    setDaiDebt(daiD);
    if ( yieldState?.makerData?.ilks?.rate  ) {
      console.log(yieldState.makerData);
      const daiT = utils.mulRay( daiD, yieldState.makerData.ilks.rate );
      const wethT = utils.divRay( daiT, yieldState.makerData.ilks.spot);
      const chaiT = utils.divRay(daiT, chi);
      setDaiTokens(daiT);
      setWethTokens(wethT);
      setChaiTokens(wethT);
      console.log(chaiT.toString()); 
    }
    
  }, [ yieldState ] );


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
              {/* <Text size='xsmall'>{ chaiBalance && ethers.utils.formatEther(chaiBalance.toString()) }</Text> */}
              <Text size='xsmall'>{ chaiBalance && chaiBalance.toString() }</Text>

            </Box>

            <Box direction='row' gap='small'>
              <Text size='xsmall'>DAI balance:</Text>
              {/* <Text size='xsmall'>{ daiBalance && ethers.utils.formatEther(daiBalance.toString()) }</Text> */}
              <Text size='xsmall'>{ daiBalance && daiBalance.toString() }</Text>
            </Box>

            <Box direction='column' gap='small'>
              <Text size='small'>Ilk: </Text>
              <Text size='xsmall'> spot: { yieldState.makerData?.ilks?.spot_p }</Text>
              <Text size='xsmall'> rate: { yieldState.makerData?.ilks?.rate_p  }</Text>
              <Text size='xsmall'> line: { yieldState.makerData?.ilks?.line_p }</Text>
            </Box>

            <Box direction='column' gap='small'>
              <Text size='small'>Urn: </Text>
              <Text size='xsmall'>ink: { yieldState.makerData?.urns?.ink_p }</Text>
              <Text size='xsmall'>art: { yieldState.makerData?.urns?.art_p }</Text>
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

              get WETH: 
              {/* <Button label='useNotify_info' onClick={()=>dispatch( { type: 'notify', payload: { message:'Something is happening!.. ', type:'info', showFor:500 } } )} /> */}
              <Button label='1. Add (90 weth)- DEV' onClick={()=> sendTx(deployedCore.Weth, 'Weth', 'deposit', [], utils.toWei('90'))} />

              WETH deposit and borrow: 
              <Button label='2. Weth approve dealer 1.5' onClick={()=> approveDealer(deployedCore.Weth, deployedCore.WethDealer, utils.toWei(1.5) )} />
              <Button label='3. Post Collateral 1.5' disabled={postActive} onClick={()=> account && post(deployedCore.WethDealer, account, utils.toWei(1.5) )} />
              <Button label='(4. Withdraw 1.5)' onClick={()=> account && withdraw(deployedCore.WethDealer, account, utils.toWei(1.5) )} />
              <Button label='5.Borrow 0.5' onClick={()=> account && borrow(deployedCore.WethDealer, yieldState.deployedSeries[0].maturity, account, utils.toWad(0.5) )} />
              WETH repay:
              <Button label='6.1 Repay 0.5 in yDai' onClick={()=> account && repay(deployedCore.WethDealer, yieldState.deployedSeries[0].maturity, account, utils.toWad(0.5), 'YDAI' )} />
              <Button label='( 6.2 Repay 0.5 in Dai) ' onClick={()=> account && repay(deployedCore.WethDealer, yieldState.deployedSeries[0].maturity, account, utils.toWad(0.5), 'DAI' )} />
            </Box>}

            { flow === 'CHAI' && 
            <Box gap='small'>
              
              Get Dai:
              
              <Button label='1. Approve Wethjoin for 10' onClick={()=> sendTx(deployedCore.Weth, 'Weth', 'approve', [deployedCore.WethJoin, utils.toWei(10).toString()], bigNumberify(0) )} />
              <Button label='2. wethJoin join (take 10)' onClick={()=> sendTx(deployedCore.WethJoin, 'WethJoin', 'join', [account, utils.toWei(10).toString()], bigNumberify(0) )} />

              <Button 
                label='3. Vat frob'
                onClick={()=> sendTx(deployedCore.Vat, 'Vat', 'frob', 
                  [
                    ethers.utils.formatBytes32String('ETH-A'),
                    account,
                    account,
                    account,
                    wethTokens,
                    daiDebt, 
                  ], 
                  bigNumberify(0)
                )}
              />
              <Button label='x. Vat hope daiJoin' onClick={()=> sendTx(deployedCore.Vat, 'Vat', 'hope', [deployedCore.DaiJoin], bigNumberify(0))} />

              <Button label='4. daiJoin EXit' onClick={()=> sendTx(deployedCore.DaiJoin, 'DaiJoin', 'exit', [account, daiTokens ], bigNumberify(0) )} />
              
              Convert Dai to Chai:
              <Button label='5. Approve chai' onClick={()=> sendTx(deployedCore.Dai, 'Dai', 'approve', [deployedCore.Chai, daiTokens ], bigNumberify(0) )} />
              <Button label='6. Chai join ' onClick={()=> sendTx(deployedCore.Chai, 'Chai', 'join', [account, daiTokens ], bigNumberify(0) )} />

  
              Chai deposit and borrow:

              {/* <Button label='5. Chai approve chaiDealer Alt' onClick={()=> sendTx(deployedCore.Chai, 'Chai', 'approve', [deployedCore.ChaiDealer, utils.divRay(daiTokens, chi) ] )} /> */}
              <Button label='2. Chai approve chaiDealer' onClick={()=> approveDealer(deployedCore.Chai, deployedCore.ChaiDealer, chaiTokens )} />
              <Button label='3. Post Chai Collateral' disabled={postActive} onClick={()=> account && post(deployedCore.ChaiDealer, account, chaiTokens )} />
              <Button label='(4. Withdraw 0.1 chai)' onClick={()=> account && withdraw(deployedCore.ChaiDealer, account, utils.toWad(0.1) )} />
              <Button label='5.Borrow 0.1 with chai' onClick={()=> account && borrow(deployedCore.ChaiDealer, yieldState.deployedSeries[0].maturity, account, utils.toWad(0.1) )} />

              Chai repay; 
              <Button label='(6.1 Repay 0.1 in yDai)' onClick={()=> account && repay(deployedCore.ChaiDealer, yieldState.deployedSeries[0].maturity, account, utils.toWad(0.1), 'YDAI' )} />
              <Button label=' 6.2 Repay 0.01 in Dai ' onClick={()=> account && repay(deployedCore.ChaiDealer, yieldState.deployedSeries[0].maturity, account, utils.toWad(0.01), 'DAI' )} />
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
            { positionsData.size > 0 && !positionsState.isLoading ? 
              <Box pad='small' gap='medium' fill>
                <Box direction='row'>
                  <Text weight='bold'>yDai[0]: {positionsData.get('yDai-2020-09-30').symbol}</Text>
                </Box>
                <Box gap='small'>
                  <Text weight='bold'>Posted collateral:</Text>
                  <Text>weth posted: { positionsData.get('yDai-2020-09-30').wethPosted_p }</Text>
                  <Text>chai posted: { positionsData.get('yDai-2020-09-30').chaiPosted_p }</Text>
                  <Text weight='bold'>yDai balance:</Text>
                  <Text>yDai Balance: { positionsData.get('yDai-2020-09-30').yDaiBalance_p }</Text>
                  <Text weight='bold'>Weth Dealer:</Text>
                  <Text>weth Debt Dai: { positionsData.get('yDai-2020-09-30').wethDebtDai_p }</Text>
                  <Text>weth Debt YDai: { positionsData.get('yDai-2020-09-30').wethDebtYDai_p }</Text>
                  <Text>weth Total Debt Dai { positionsData.get('yDai-2020-09-30').wethTotalDebtDai_p }</Text>
                  <Text> weth Total Debt YDai: { positionsData.get('yDai-2020-09-30').wethTotalDebtYDai_p }</Text>
                  <Text weight='bold'>ChaiDealer:</Text>
                  <Text>chai Debt Dai : { positionsData.get('yDai-2020-09-30').chaiDebtDai_p}</Text>
                  <Text>chai Debt yDai : { positionsData.get('yDai-2020-09-30').chaiDebtYDai_p}</Text>
                  <Text>chai Total Debt Dai: { positionsData.get('yDai-2020-09-30').chaiTotalDebtDai_p }</Text>
                  <Text>chai Total Debt YDai: { positionsData.get('yDai-2020-09-30').chaiTotalDebtYDai_p }</Text>
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
          <Button alignSelf='end' label='refresh' onClick={()=>positionsActions.getPositions([yieldState.deployedSeries[0]])} />

        </Footer>
      </Box>
    </Layer>
  );
};

export default TestLayer;
