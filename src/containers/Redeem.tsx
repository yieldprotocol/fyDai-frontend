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

interface RedeemActionProps {
  activeSeries?:IYieldSeries,
  fixedOpen?:boolean,
  close?:any,
  daiRate?: number,
  ydaiAmount?: number,
}

const Redeem  = ({ close }:RedeemActionProps)  => {

  const [daiValue, setDaiValue] = React.useState<any>();

  return (

    <Box flex='grow' justify='between' pad='small'>
      <Box margin={{ top:'medium' }} gap='xsmall' align='start' fill='horizontal'>
        <Text color='secondary' size='small' weight='bold'> 
          You're ready to redeem your yDai for Dai!
        </Text>
      </Box>

      <Box fill='horizontal' margin={{ vertical:'medium' }}>
        <Box pad='xsmall'>
          <Box direction='row' gap='small' justify='between'>
            <Text size='xsmall'>
              Current value per yDai:
            </Text>
            <Help />
          </Box>
          <Text weight='bold' size='xsmall'>
            1.01 Dai
          </Text>
        </Box>

        <Box pad='xsmall'>
          <Box direction='row' gap='small' justify='between'>
            <Text size='xsmall'>
              Total Dai value you will recieve:
            </Text>
            <Help />
          </Box>
          <Text weight='bold' size='xsmall'>
            12.12 Dai
          </Text>
        </Box>
      </Box>

      {/* 
      <Box direction='row' gap='small' margin={{ bottom:'medium' }}>
         
        <Text size='xxsmall'>
          <SettingsGear /> Advanced Options
        </Text>
      </Box> */}

      <Box fill='horizontal' alignSelf='end'>
        <Button
          fill='horizontal'
          primary
          // disabled={!(daiValue>0)}
          disabled={false}
          color='secondary'
          onClick={()=>console.log(daiValue)}
          label={`Redeem your ${daiValue} Dai`}
        />
      </Box>
    </Box>
  );
}

export default Redeem;
