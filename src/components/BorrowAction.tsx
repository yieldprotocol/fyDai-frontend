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
  const [ borrowType, setBorrowType ] = React.useState<string>('yDai');

  const TokenSelector = () => {
    return (
      <Box justify='center'>
        <Box round background='border' justify='center' pad={{ horizontal:'small' }}>
          <Select
            id="select"
            name="select"
            plain
            value={borrowType}
            options={['yDai', 'Dai']}
            valueLabel={
              <Box width='xsmall' direction='row' align='baseline' justify='center' gap='xsmall'>
                <Text color='brand' size='xsmall'>{ borrowType }</Text>
                <Text color='brand' size='xsmall'><CaretDown /></Text>
              </Box>
          }
            icon={false}
            onChange={({ option }) => setBorrowType(option)}
          />
        </Box>
      </Box>
    );
  };
  
  return (
    <Box flex='grow' justify='between'>
      <Box margin={{ top:'medium' }} gap='xsmall' align='center' fill='horizontal'>
        <Text alignSelf='start' size='xsmall'> Amount to borrow </Text>
        <Box 
          round='small'
          border={{ color:'brand' }}
          direction='row'
          fill='horizontal'
          align='baseline'
          pad={{ horizontal:'small' }}
        >
          {/* <Box width='60px' height='60px' margin='none'>
            <Image src={ethLogo} fit='contain' />
          </Box> */}

          <TextInput
            type="number"
            placeholder="0"
            value={inputValue}
            plain
            onChange={(event:any) => setInputValue(event.target.value)}
            // icon={<TokenSelector />}
            reverse
          />
          <TokenSelector />
        </Box>

        <Box direction='row' fill='horizontal' margin={{ top:'small' }}>
          <Box pad='xsmall' width='50%'>
            <Box direction='row' gap='small'>
              <Text size='xsmall'>
                Est. APR 
              </Text>
              <Help />
            </Box>
            <Text weight='bold' size='xsmall'>
              3.45%
            </Text>
          </Box>
          <Box pad='xsmall'>
            <Box direction='row' gap='small'>
              <Text size='xsmall'>
                Expected Dai
              </Text>
              <Help />
            </Box>
            <Text weight='bold' size='xsmall'>
              0 Dai
            </Text>
          </Box>
        </Box>
      </Box>

      {inputValue > 150 &&
      <Box direction='row' border={{ color:'red' }} pad='small' margin={{ vertical:'small' }}> 
        <Text size='xsmall' color='red'>
          <Warning /> 
          {' Wooah. If you borrow that much there is a good chance you\'ll get liquidated soon. Proceed with caution!'}
        </Text>
      </Box>}



      <Box fill='horizontal' alignSelf='end'>
        <Button
          fill='horizontal'
          primary
          disabled={!(inputValue>0)}
          color='brand'
          onClick={()=>borrowFn(inputValue)}
          label={`Borrow ${inputValue || ''} ${borrowType}`}
        />
      </Box>
    </Box>

  );
};

export default BorrowAction;