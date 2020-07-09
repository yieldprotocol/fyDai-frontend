import React from 'react';
import { Box, Button, Select, Image, TextInput, Text, CheckBox, Collapsible, RangeInput } from 'grommet';
import { 
  FiCheckCircle, 
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiAlertTriangle as Warning,
} from 'react-icons/fi';


import ethLogo from '../assets/images/tokens/eth.svg';

import { IYieldSeries } from '../types';

interface BorrowActionProps {
  borrowFn:any
  // activeSeries?:IYieldSeries,
  maxValue?:number
}

const BorrowAction = ({ borrowFn, maxValue }:BorrowActionProps) => {

  const [ inputValue, setInputValue ] = React.useState<any>();
  const [borrowDisabled, setBorrowDisabled] = React.useState<boolean>(false);

  const [ borrowType, setBorrowType ] = React.useState<string>('yDai');

  return (
    <Box flex='grow' justify='between'>
      <Box gap='medium' align='center' fill='horizontal'>
        <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Choose a series</Text>
        <Box
          direction='row-responsive'
          fill='horizontal'
          gap='small'
          align='center'
        >
          <Box 
            round='medium'
            background='brand-transparent'
            direction='row'
            fill='horizontal'
            pad='small'
            flex
          >
            {/* <Box width='15px' height='15px'>
              <Image src={ethLogo} fit='contain' />
            </Box> */}
            <TextInput
              type="number"
              placeholder='December 2000 @ 3.54%'
              // value={inputValue}
              // disabled={depositDisabled}
              plain
              // onChange={(event:any) => setInputValue(event.target.value)}
            />
          </Box>

          <Box justify='center'>
            <Box
              round
              onClick={()=>setInputValue(maxValue)}
              hoverIndicator='brand-transparent'
              border='all'
              // border={{ color:'brand' }}
              pad={{ horizontal:'small', vertical:'small' }}
              justify='center'
            >
              <Text size='xsmall'>Change series</Text>
            </Box>
          </Box>
        </Box>

        {/* <Box fill gap='small' pad={{ horizontal:'medium' }}>
          <Box fill direction='row-responsive' justify='between'>

            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Estimated APR</Text>
                <Help />
              </Box>
              <Text color='brand' weight='bold' size='large'> 3.5% </Text>
              { false && 
              <Box pad='xsmall'>
                <Text alignSelf='start' size='xxsmall'>
                  <Info /> You need to deposit collateral in order to Borrow Dai.
                </Text>
              </Box>}
            </Box>

            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Expected Dai at maturity</Text>
                <Help />
              </Box>
              <Text color='brand' weight='bold' size='large'> 15 Dai on 23 December 2020</Text>
              { false && 
              <Box pad='xsmall'>
                <Text alignSelf='start' size='xxsmall'>
                  <Info /> Collateral value should be well above 150% to be safe from liquidation. Either increase your collateral amount or repay some existing debt. 
                </Text>
              </Box>}
            </Box>
          </Box>
          <Box gap='small'>

            <Box direction='row' gap='small'>
              <Text color='text-weak' size='xsmall'>Borrowing Power</Text>
              <Help />
            </Box>
            <Box direction='row' gap='small'>
              <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='large'> 24 Dai </Text>
            </Box>
          </Box>
        </Box> */}

        <Box fill gap='medium' margin={{ vertical:'large' }}>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to borrow</Text>
          <Box 
            round='medium'
            background='brand-transparent'
            direction='row'
            fill='horizontal'
            pad='small'
            flex
          >
            {/* <Box width='15px' height='15px'>
              <Image src={ethLogo} fit='contain' />
            </Box> */}
            <TextInput
              type="number"
              placeholder='Enter the amount of Dai to borrow'
              value={inputValue}
            // disabled={depositDisabled}
              plain
              onChange={(event:any) => setInputValue(event.target.value)}
            />
          </Box>

          <Box fill gap='small' pad={{ horizontal:'medium' }}>
            <Box fill direction='row-responsive' justify='between'>
            
              <Box gap='small'>
                <Box direction='row' gap='small'>
                  <Text color='text-weak' size='xsmall'>Estimated APR</Text>
                  <Help />
                </Box>
                <Text color='brand' weight='bold' size='large'> 3.5% </Text>
                { false && 
                <Box pad='xsmall'>
                  <Text alignSelf='start' size='xxsmall'>
                    <Info /> You need to deposit collateral in order to Borrow Dai.
                  </Text>
                </Box>}
              </Box>

              <Box gap='small'>
                <Box direction='row' gap='small'>
                  <Text color='text-weak' size='xsmall'>Expected Dai at maturity</Text>
                  <Help />
                </Box>
                <Text color='brand' weight='bold' size='large'> 15 Dai on 23 December 2020</Text>
                { false && 
                <Box pad='xsmall'>
                  <Text alignSelf='start' size='xxsmall'>
                    <Info /> Collateral value should be well above 150% to be safe from liquidation. Either increase your collateral amount or repay some existing debt. 
                  </Text>
                </Box>}
              </Box>
            </Box>
            <Box gap='small'>

              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Borrowing Power</Text>
                <Help />
              </Box>
              <Box direction='row' gap='small'>
                <Text color={!inputValue? 'brand-transparent':'brand'} weight='bold' size='large'> 24 Dai </Text>
              </Box>
              {/* <Text color='text-weak' size='xxsmall'>if you deposit {inputValue||0} Eth</Text> */}
            </Box>
          </Box>

          {inputValue > 150 &&
            <Box direction='row' border={{ color:'red' }} pad='small' margin={{ vertical:'small' }}> 
              <Text size='xsmall' color='red'>
                <Warning /> 
                {' Wooah. If you borrow that much there is a good chance you\'ll get liquidated soon. Proceed with caution!'}
              </Text>
            </Box>}

        </Box>

        <Box
          fill='horizontal'
          round='medium'
          background={( !(inputValue>0) || borrowDisabled) ? 'brand-transparent' : 'brand'}
          onClick={(!(inputValue>0) || borrowDisabled)? ()=>{}:()=>borrowFn(inputValue)}
          align='center'
          pad='medium'
        >
          <Text 
            weight='bold'
            size='large'
            color={( !(inputValue>0) || borrowDisabled) ? 'text-xweak' : 'text'}
          >
            {`Borrow ${inputValue || ''} Dai`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default BorrowAction;
