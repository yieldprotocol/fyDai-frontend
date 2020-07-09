import React from 'react';
import { Anchor, Box, Button, TextInput, Menu, Text, Heading, Footer, Collapsible, ThemeContext } from 'grommet';

import { IYieldSeries } from '../types';
import SlideConfirm from './x_SlideConfirm';

import { NotifyContext } from '../contexts/NotifyContext';
// import { SeriesContext } from '../contexts/SeriesContext';

type BorrowConfirmLayerProps = {
  series: IYieldSeries,
  hasPosition: boolean,
};

// TODO: split this all out

const AddCollateralForm = ({ series, hasPosition }:BorrowConfirmLayerProps) => {

  const [inputValue, setInputValue] = React.useState<number>();
  const [formReady, setFormReady] = React.useState<boolean>(false);
  const [collateralMethod, setCollateralMethod ]= React.useState<string | null>(null);
  const theme = React.useContext<any>(ThemeContext);
  const { state: notifyState, dispatch: notifyDispatch } = React.useContext(NotifyContext);

  const handleDeposit = async () => {
    notifyDispatch({ type: 'notify', payload:{ message:'Transaction pending....', type:'info' } } );
    await setTimeout(() => {
      notifyDispatch({ type: 'notify', payload:{ message:'Transaction processed', type:'success' } } );
      // setStepperIndex(stepperIndex+1);
    }, 3000);
  };

  React.useEffect(()=>{
    if( inputValue && inputValue > 0) {
      setFormReady(true);
    } else setFormReady(false);
  }, [inputValue]);

  return (

    <Box>
      { !hasPosition || collateralMethod !== null ?
        <Box pad='small' direction='row' fill='horizontal' justify='center'>
          <Button 
            primary={collateralMethod === 'DEPOSIT'}
            label='Deposit Collateral'
            style={{ borderRadius:'24px 0px 0px 24px' }}
            hoverIndicator='brand'
            // color={!showForm?'border':'brand'}
            color='brand'
            onClick={()=>setCollateralMethod('DEPOSIT')}
          />
          <Button 
            primary={collateralMethod === 'MAKER'}
            label='Convert a Maker Vault'
            hoverIndicator='brand'
            // color={!showForm?'border':'brand'}
            color='brand'
            style={{ borderRadius:'0px 24px 24px 0px' }}
            onClick={()=>setCollateralMethod('MAKER')}
          />
        </Box>
        :
        <Box pad='small' direction='row' justify='end' gap='small'>
          <Anchor onClick={()=>setCollateralMethod('DEPOSIT')}><Text size='10px'>Top-up Collateral</Text></Anchor>
          <Box border='left' />
          <Anchor onClick={()=>setCollateralMethod('MAKER')}><Text size='10px'> Convert a Maker Vault</Text></Anchor>
        </Box> }

      <Box direction='column' pad='medium'>
        <Collapsible open={collateralMethod === 'DEPOSIT' || collateralMethod === 'MAKER'}>
          { (collateralMethod === 'DEPOSIT') && 
          <>
            <Box gap='none' direction='row' justify='end' align='baseline' fill='horizontal'>
              <TextInput
                size='small'
                type="number"
                placeholder="Deposit Amount"
                value={inputValue}
                onChange={event => setInputValue(Number(event.target.value))}
                icon={<Text>ETH</Text>}
                reverse
              />
            </Box>
            <Box alignSelf='end' margin={{ horizontal:'small' }}>
              <Text size='10px'> <Anchor onClick={()=>setCollateralMethod('MAKER')}> or convert a Maker vault  </Anchor> </Text>
            </Box>

            <Footer direction='row-responsive' justify='evenly' pad='medium'>
              <Button label='Cancel' color='border' onClick={()=>setCollateralMethod(null)} />

              <Button 
                label='Deposit'
                disabled={!formReady}
                onClick={()=>handleDeposit()}
              />
              {/* <SlideConfirm 
                label='Slide to deposit'
                disabled={!formReady}
                brandColor={theme.global.colors.brand.light}
                onConfirm={()=>handleDeposit()}
              /> */}
            </Footer>
          </> }

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

              <Button 
                label='Convert Vault'
                disabled
                onClick={()=>handleDeposit()}
              />

              {/* <SlideConfirm 
                label='Slide to confirm'
                disabled={!formReady}
                brandColor={theme.global.colors.brand.light}
                onConfirm={()=>handleDeposit()}
              /> */}
            </Footer>
          </>}
        </Collapsible>
      </Box>
    </Box>
  );
};

export default AddCollateralForm;