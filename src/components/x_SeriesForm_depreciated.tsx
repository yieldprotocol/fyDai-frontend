import React from 'react';
import { Anchor, Box, DropButton, Button, TextInput, Menu, Text, Heading, Footer, Collapsible, ThemeContext } from 'grommet';
import moment from 'moment';
import {
  FaCaretDown as CaretDown,
  FaTimes as Close,
} from 'react-icons/fa';

import { IYieldSeries } from '../types';
import SlideConfirm from './SlideConfirm';
import YieldPosition from './YieldPosition';

import { NotifyContext } from '../contexts/NotifyContext';
import { PositionsContext } from '../contexts/PositionsContext';

type BorrowConfirmLayerProps = {
  series: IYieldSeries,
  closeLayer: any,
};

// TODO: split this all out

const SeriesForm = ({ series, closeLayer }:BorrowConfirmLayerProps) => {

  const [inputValue, setInputValue] = React.useState<number>();
  const [formReady, setFormReady] = React.useState<boolean>(false);
  const [collateralMethod, setCollateralMethod ]= React.useState<string | null>(null);

  const [collateralType, setCollateralType] = React.useState<any>('ETH');

  const [ seriesPosition, setSeriesPosition] = React.useState<any>();

  const { state: positionsState, dispatch: positionsDispatch } = React.useContext(PositionsContext);

  const theme = React.useContext<any>(ThemeContext);
  const { state, dispatch } = React.useContext(NotifyContext);

  const [stepperIndex, setStepperIndex ] = React.useState<number>(0);
  
  const {
    maturityDate:date,
    interestRate:interest,
    currentValue:value,
  } = series;

  const handleConfirm = async () => {
    if (stepperIndex < 1) {
      setStepperIndex(stepperIndex+1);
    } else {
      closeLayer();
      dispatch({ type: 'notify', payload:{ message:'Transaction pending....', type:'info', showFor:4000 } } );
      await setTimeout(() => {
        dispatch({ type: 'notify', payload:{ message:'Transaction processed', type:'success' } } );
        setStepperIndex(0);
      }, 3000);
    }
  };

  const handleDeposit = async () => {
    dispatch({ type: 'notify', payload:{ message:'Transaction pending....', type:'info', showFor:4000 } } );
    await setTimeout(() => {
      dispatch({ type: 'notify', payload:{ message:'Transaction processed', type:'success' } } );
      setStepperIndex(stepperIndex+1);
    }, 3000);
  };

  React.useEffect(()=>{
    setSeriesPosition(positionsState.positionsData.find((x:any)=> x.series_id === series.id ));
  }, [positionsState]);

  React.useEffect(()=>{
    if( inputValue && inputValue > 0) {
      setFormReady(true);
    } else setFormReady(false);
  }, [inputValue]);

  return (
    <Box
      round='medium'
      background='background-front'
      fill
    >
      <Box margin={{ vertical:'none' }} gap='small'>
        { seriesPosition ?
          seriesPosition.collateral.map((x:any)=>{
            return (
              <Box key={x.type}>
                <YieldPosition position={x} input={false} selectPositionFn={(e:any)=>console.log(e)} />
              </Box>
            );
          })
          : <Box color='border' pad='small' align='center' round> No collateralization yet.</Box> }
      </Box>

      {/* <Box pad='medium' elevation={collateralMethod?'xsmall':'none'} round='small'> */}
      <Box pad='small' background='backgroundFront'>
        {!seriesPosition || collateralMethod !== null ? 
          <Box direction='row' fill='horizontal' justify='center'>
            <Button 
              primary={collateralMethod === 'DEPOSIT'}
              label='Deposit Collateral'
              style={{ borderRadius:'24px 0px 0px 24px' }}
              hoverIndicator='background'
              color='border'
              onClick={()=>setCollateralMethod('DEPOSIT')}
            />
            <Button 
              primary={collateralMethod === 'MAKER'}
              label='Convert a Maker Vault'
              hoverIndicator='background'
              color='border'
              style={{ borderRadius:'0px 24px 24px 0px' }}
              onClick={()=>setCollateralMethod('MAKER')}
            />
          </Box>
          :
          <Box direction='row' justify='end' gap='small'>
            <Anchor onClick={()=>setCollateralMethod('DEPOSIT')}><Text size='10px'>Deposit more collateral</Text></Anchor>
            <Box border='left' />
            <Anchor onClick={()=>setCollateralMethod('MAKER')}><Text size='10px'> Convert a Maker Vault</Text></Anchor>
          </Box>}

        <Box direction='column' pad='medium'>
          { collateralMethod === 'DEPOSIT' && 
            <>
              <Box gap='none' direction='row' justify='end' align='baseline' fill='horizontal'>
                <TextInput
                  size='small'
                  type="number"
                  placeholder="Deposit Amount"
                  value={inputValue}
                  // style={{ borderRadius:'24px 0px 0px 24px' }}
                  onChange={event => setInputValue(Number(event.target.value))}
                  icon={<Text>ETH</Text>}
                  reverse
                />
              </Box>
              <Box alignSelf='end' margin={{ horizontal:'small' }}>
                <Text size='10px'> <Anchor onClick={()=>setCollateralMethod('MAKER')}> or convert a Maker vault  </Anchor> </Text>
              </Box>
              <Box pad='small' round='small' direction='row' justify='between' fill='horizontal' />
              <Footer direction='row-responsive' justify='evenly' pad='medium'>
                <Button label='Cancel' color='border' onClick={()=>setCollateralMethod(null)} />
                <SlideConfirm 
                  label='Slide to deposit'
                  disabled={!formReady}
                  brandColor={theme.global.colors.brand.light}
                  onConfirm={()=>handleDeposit()}
                />
              </Footer>
            </>}
          { collateralMethod === 'MAKER'  &&
            <>
              <Box fill='horizontal'>
                <Box pad='xsmall' align='center' round>
                  <Text>Unfortunately, no Maker Vaults were found.</Text>
                </Box>
                <Box alignSelf='end' margin={{ horizontal:'small' }}>
                  <Text size='10px'> <Anchor onClick={()=>setCollateralMethod('DEPOSIT')}> Alternatively, deposit collateral </Anchor> </Text>
                </Box>
              </Box>
              <Footer direction='row-responsive' justify='evenly' pad='medium'>
                <Button label='Cancel' color='border' onClick={()=>setCollateralMethod(null)} />
                <SlideConfirm 
                  label='Slide to confirm'
                  disabled={!formReady}
                  brandColor={theme.global.colors.brand.light}
                  onConfirm={()=>handleDeposit()}
                />
              </Footer>
            </>}
        </Box>
      </Box>
    </Box>
  );
};

export default SeriesForm;