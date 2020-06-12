import React from 'react';

import { ethers } from 'ethers';

import { useWeb3React } from '@web3-react/core';
import { Anchor, Layer, Header, Heading, Footer, Button, Box, Text } from 'grommet';

import { bigNumberify } from 'ethers/utils';
import * as utils from '../../helpers/utils';

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
  const { deployedCore } = yieldState;

  

  React.useEffect(()=>{
    (async () => setWethBalance( await getWethBalance(deployedCore.Weth)) )();
    (async () => setChaiBalance( await getChaiBalance(deployedCore.Chai)) )();
    (async () => setDaiBalance( await getDaiBalance(deployedCore.Dai)) )();

  }, [deployedCore.Weth, postActive, withdrawActive]);

  React.useEffect(()=>{
    const daiD = utils.toWad(12);
    const chi  = utils.toRay(1.25);

    setDaiDebt(daiD);
    if ( yieldState?.vatData?.ilks?.rate  ) {
      console.log(yieldState.vatData);
      const daiT = utils.mulRay( daiD, yieldState.vatData.ilks.rate );
      const wethT = utils.divRay( daiT, yieldState.vatData.ilks.spot);
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
              <Text size='xsmall'> spot: { yieldState.vatData?.ilks?.spot_f }</Text>
              <Text size='xsmall'> rate: { yieldState.vatData?.ilks?.rate_f  }</Text>
              <Text size='xsmall'> line: { yieldState.vatData?.ilks?.line_f }</Text>
            </Box>

            <Box direction='column' gap='small'>
              <Text size='small'>Urn: </Text>
              <Text size='xsmall'>ink: { yieldState.vatData?.urns?.ink_f }</Text>
              <Text size='xsmall'>art: { yieldState.vatData?.urns?.art_f }</Text>
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
              <Button label='5.Borrow 0.5' onClick={()=> account && borrow(deployedCore.WethDealer, yieldState.seriesData[0].maturity, account, utils.toWad(0.5) )} />
              WETH repay:
              <Button label='6.1 Repay 0.5 in yDai' onClick={()=> account && repay(deployedCore.WethDealer, yieldState.seriesData[0].maturity, account, utils.toWad(0.5), 'YDAI' )} />
              <Button label='( 6.2 Repay 0.5 in Dai) ' onClick={()=> account && repay(deployedCore.WethDealer, yieldState.seriesData[0].maturity, account, utils.toWad(0.5), 'DAI' )} />
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
              <Button label='(4. Withdraw 0.05 chai)' onClick={()=> account && withdraw(deployedCore.ChaiDealer, account, utils.toWad(0.1) )} />
              <Button label='5.Borrow 0.5 with chai' onClick={()=> account && borrow(deployedCore.ChaiDealer, yieldState.seriesData[0].maturity, account, utils.toWad(0.1) )} />

              Chai repay; 
              <Button label='(6.1 Repay 0.5 in yDai)' onClick={()=> account && repay(deployedCore.ChaiDealer, yieldState.seriesData[0].maturity, account, utils.toWad(0.1), 'YDAI' )} />
              <Button label=' 6.2 Repay 0.5 in Dai ' onClick={()=> account && repay(deployedCore.ChaiDealer, yieldState.seriesData[0].maturity, account, utils.toWad(0.1), 'DAI' )} />
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
                <Button label='refresh' onClick={()=>positionsActions.getPositions([yieldState.seriesData[0]])} />
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
