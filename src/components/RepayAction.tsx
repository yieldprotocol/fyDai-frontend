import React from 'react';
import { Box, Button, Image, Select, TextInput, Text, Heading, Collapsible } from 'grommet';
import { 
  FiCheckCircle, 
  FiInfo as Info,
  FiHelpCircle as Help,
  FiChevronDown as CaretDown,
  FiSettings as SettingsGear,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';
import ethLogo from '../assets/images/tokens/eth.svg';

interface RepayActionProps {
  repayFn:any
  maxValue:number

  // activeSeries?:IYieldSeries,
  // fixedOpen?:boolean,
  // close?:any,
}

function PaybackAction({ repayFn, maxValue }:RepayActionProps) {

  const [inputValue, setInputValue] = React.useState<any>();
  const [repayDisabled, setRepayDisabled] = React.useState<boolean>(false);

  const [repayType, setRepayType] = React.useState<string>('yDai');

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

        <Box fill gap='small' pad={{ horizontal:'medium' }}>
          <Box fill direction='row-responsive' justify='between'>
            <Box gap='small'>
              <Box direction='row' gap='small'>
                <Text color='text-weak' size='xsmall'>Current Debt</Text>
                <Help />
              </Box>
              <Text color='brand' weight='bold' size='large'> 12 Dai </Text>
            </Box>
          </Box>
        </Box>

        <Box fill gap='medium' margin={{ vertical:'large' }}>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Amount to Repay</Text>
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
              <TextInput
                type="number"
                placeholder='Enter the amount of Dai to Repay'
                value={inputValue}
                disabled={repayDisabled}
                plain
                onChange={(event:any) => setInputValue(event.target.value)}
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
                <Text size='xsmall'>Use max</Text>
              </Box>
            </Box>
          </Box>

        </Box>

        <Box
          fill='horizontal'
          round='medium'
          background={( !(inputValue>0) || repayDisabled) ? 'brand-transparent' : 'brand'}
          onClick={(!(inputValue>0) || repayDisabled)? ()=>{}:()=>repayFn(inputValue, repayType)}
          align='center'
          pad='medium'
        >
          <Text 
            weight='bold'
            size='large'
            color={( !(inputValue>0) || repayDisabled) ? 'text-weak' : 'text'}
          >
            {`Repay ${inputValue || ''} ${repayType}`}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default PaybackAction;
