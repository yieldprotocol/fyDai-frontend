import React from 'react';
import { Layer, Box, DropButton, Button, TextInput, Header, Text, Heading, Footer, Collapsible, ThemeContext } from 'grommet';
import moment from 'moment';
import {
  FaCaretDown as CaretDown,
  FaTimes as Close,
} from 'react-icons/fa';

import SlideConfirm from './SlideConfirm';
import { IYieldSeries } from '../types';

type LendConfirmLayerProps = {
  series: IYieldSeries,
  closeLayer: any,
};

function LendLayer({ series, closeLayer }:LendConfirmLayerProps) {
  const [inputValue, setInputValue] = React.useState<any>();
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const theme = React.useContext<any>(ThemeContext);
  const {
    maturityDate:date,
    interestRate:interest,
    currentValue:value,
    balance,
    debt
  } = series;

  return (
    <Layer>
      <Box
        pad='none'
        round='medium'
        background='background-front'
        fill
        // style={{ maxWidth:'600px' }}
      >
        <Collapsible direction='vertical' open={!confirmOpen}>
          <Header 
            round
            fill='horizontal'
            background='background-frontheader'
          // justify='center'
            pad={{ horizontal: 'medium', vertical:'xsmall' }}
            align='center'
            direction='column'
          >
            <Heading level='4' margin={{ bottom:'none' }}> yDai-{moment(date).format('MMYY')}</Heading>
            <Box gap='xsmall' margin='small' align='center'>
              <Text size='xsmall'> {`Maturation date: ${moment(date).format('MMM YYYY')}`} </Text>
              <Text size='xsmall'> {`Est. Price: ${value} DAI`} </Text>
            </Box>
          </Header>

          <Box margin='large' gap='large' direction='column' align='center'>

            <Box direction='row' justify='end' align='baseline' fill='horizontal'>
              {/* <Text> Price: </Text> */}
              <Box>
                <DropButton
                  color='background-front'
                  label={
                    <Box 
                    // pad='xsmall'
                      direction='row'
                      gap='xsmall'
                    >
                      <Text color='#FF007F'>🦄 Uniswap</Text>
                      <CaretDown />
                    </Box>
                }
                  dropAlign={{ top: 'bottom', right: 'right' }}
                  dropContent={
                    <Box pad="medium" background="light-2" round="xsmall">
                      <Text size='xsmall'>More providers coming soon!</Text> 
                    </Box>
                  }
                />
              </Box>
            </Box>

            <Box gap='xsmall' direction='row' justify='between' align='baseline' fill='horizontal'>
              {/* <Text> Buy  </Text> */}
              <Box>
                <TextInput
                  size='medium'
                  type="number"
                  placeholder="Amount"
                  value={inputValue}
                  onChange={event => setInputValue(event.target.value)}
                  icon={<Text>yDai</Text>}
                  reverse
                />
              </Box>
            </Box>

            <Box pad='small' round='small' direction='row' justify='between' fill='horizontal' background='lightgrey'>
              <Box direction='column'>
                <Text size='xsmall'>Interest @ maturity </Text>
                <Text size='8px'> (includes Uniswap fee) </Text>
              </Box>
              <Box>
                <Text size='xsmall'>{interest}%</Text>
              </Box>
            </Box>
          </Box>

          <Footer direction='row' justify='evenly' pad='medium'>
            <Button label='Cancel' color='border' onClick={()=>closeLayer()} /> 
            <Button primary label='Buy' onClick={()=>setConfirmOpen(true)} /> 
          </Footer>
        </Collapsible>

        <Collapsible direction='vertical' open={confirmOpen}>
          <Header 
            round
            fill='horizontal'
            background='background-frontheader'
            pad={{ horizontal: 'medium', vertical:'xsmall' }}
            align='baseline'
            justify='center'
            direction='row'
          >
            
            <Heading level='4' margin={{ bottom:'none' }}> Confirm transaction</Heading>
            <Button icon={<Close />} color='border' onClick={()=>closeLayer()} /> 
          </Header>

          <Box margin='large' gap='large' direction='column' align='center'>
            {/* <Box border='all' elevation='xsmall'>
              <Text>Buy {inputValue} yDai from the 'yDai-{moment(date).format('MMYY')}' series.</Text>
              <Text>Maturation date is in {moment(date).format('mmmm YYYY')}.</Text>
              <Text>On maturity Interest rate will be set at {interest}.</Text>
              <Text>The current value is approxiamtely: {inputValue*value} Dai.</Text>
            </Box> */}
            <Footer direction='row' justify='evenly' pad='medium'>
              <SlideConfirm brandColor={theme.global.colors.brand.light} onConfirm={()=>closeLayer()} />
            </Footer>
          </Box>

        </Collapsible>

      </Box>
    </Layer>
  );
}

export default LendLayer;
