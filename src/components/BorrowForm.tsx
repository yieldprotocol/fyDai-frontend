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
  collateralMethod: string,
  setCollateralMethod: any, 
};

// TODO: split this all out

const BorrowForm = ({ series, closeLayer, collateralMethod, setCollateralMethod }:BorrowConfirmLayerProps) => {

  const [inputValue, setInputValue] = React.useState<any>();
  const [formReady, setFormReady] = React.useState<boolean>(false);
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
    if( inputValue > 0) {
      setFormReady(true);
    } else setFormReady(false);
  }, [inputValue]);

  return (
    <Box
      pad='none'
      round='medium'
      background='background-front'
      fill
    >
      { stepperIndex === 0 &&
      <>
        <Box margin='medium' direction='column'> Current Position: </Box>
        <Box margin={{ vertical:'none', horizontal:'medium' }}>

          {seriesPosition ?
            seriesPosition.collateral.map((x:any)=>{
              return (
                <Box key={x.type}>
                  <YieldPosition position={x} />
                </Box>
              );
            })
            : <Box background='accent-4' pad='small' align='center' round> No collateralization yet.</Box> }

        </Box>
        <Box margin='medium' direction='column' align='center'>
          { collateralMethod === 'DEPOSIT' && 
          <>
            <Text alignSelf='start' margin='small'> Deposit collateral: </Text>
            <Box gap='none' direction='row' justify='end' align='baseline' fill='horizontal'>
              <Box fill>
                <TextInput
                  size='small'
                  type="number"
                  placeholder="Deposit Amount"
                  value={inputValue}
                  style={{ borderRadius:'24px 0px 0px 24px' }}
                  onChange={event => setInputValue(event.target.value)}
                  reverse
                />
              </Box>

              <DropButton
                size='small'
                style={{ zIndex:2000, borderRadius:'0px 24px 24px 0px' }}
                label={
                  <Box 
                    direction='row'
                    gap='small'
                    align='center'
                  >
                    <Text>{collateralType}</Text>
                    <CaretDown />
                  </Box>
                }
                dropAlign={{ top: 'bottom', right: 'right' }}
                dropContent={
                  <Box pad="medium" background="light-2" round="xsmall" style={{ zIndex:2000 }}>
                    <Text size='xsmall'>something</Text>
                  </Box>
              }
              />
            </Box>
            <Box alignSelf='end' margin={{ horizontal:'small' }}>
              <Text size='8px'> <Anchor onClick={()=>setCollateralMethod('MAKER')}> or convert a Maker vault  </Anchor> </Text>
            </Box>
            <Box pad='small' round='small' direction='row' justify='between' fill='horizontal'>
              {/* <Box>
            <Text size='xsmall'>{interest}%</Text>
          </Box> */}
            </Box>
          </>}
          { collateralMethod === 'MAKER'  && 
          <>
            <Box>
              MAKER SECTION
            </Box> 
          </>}

          <Footer direction='row' justify='evenly' pad='medium'>
            <Button label='Cancel' color='border' onClick={()=>closeLayer()} />
            <SlideConfirm 
              label='Slide to deposit'
              disabled={!formReady}
              brandColor={theme.global.colors.brand.light}
              onConfirm={()=>handleDeposit()}
            />
            <Button label='Skip' color='none' onClick={()=>setStepperIndex(stepperIndex+1)} />
          </Footer>
        </Box>
      </>}

      {stepperIndex === 1 &&
      <>
        <Box margin='medium'>
          { seriesPosition ? 
            seriesPosition.collateral.map((x:any)=>{
              return (
                <Box key={x.type}>
                  <YieldPosition position={x} />
                </Box>
              );
            })
            :
            <Box gap='small'>
              <Box background='accent-4' pad='small' align='center' round> No collateralization yet.</Box>
              <Anchor alignSelf='end' onClick={()=>setStepperIndex(0)}> <Text size='small'> Deposit Collateral </Text></Anchor>
            </Box>}
        </Box>

        <Footer direction='row' justify='evenly' pad='medium'>
          <Button label='Cancel' color='border' onClick={()=>closeLayer()} />
          <Button label='Back' color='border' onClick={()=>setStepperIndex(stepperIndex-1)} />
          <SlideConfirm 
            label='Slide to borrow'
            disabled={!formReady} 
            brandColor={theme.global.colors.brand.light} 
            onConfirm={()=>handleConfirm()}
          />
          {/* <Button primary label='Buy' onClick={()=>setConfirmOpen(true)} />  */}
        </Footer>
      </>}

    </Box>
  );
};

export default BorrowForm;