import React from 'react';
import { Box, Button, Image, TextInput, Text } from 'grommet';
import { FiInfo as Info } from 'react-icons/fi'; 

import ethLogo from '../assets/images/tokens/eth.svg'; 

interface DepositProps {
  deposit:any
  convert?:any
  maxValue:number
  disabled?:boolean
}

const DepositAction = ({ disabled, deposit, convert, maxValue }:DepositProps) => {

  const [inputValue, setInputValue] = React.useState<any>();
  const [depositDisabled, setDepositDisabled] = React.useState<boolean>(false);

  return (
    <Box align='center' flex='grow' justify='between'>
      <Box margin={{ vertical:'medium' }} gap='xsmall' align='center' fill='horizontal'>
        <Text alignSelf='start' size='xsmall'> Amount to deposit </Text>
        <Box 
          round='small' 
          border={{ color:'secondary' }}
          direction='row'
          fill='horizontal'
          pad={{ horizontal:'small' }}
        >
          {/* <Box width='15px' height='15px'>
            <Image src={ethLogo} fit='contain' />
          </Box> */}
          <TextInput
            type="number"
            placeholder="0"
            value={inputValue}
            disabled={depositDisabled}
            plain
            onChange={(event:any) => setInputValue(event.target.value)}
            icon={<Text alignSelf='start' size='xsmall'>Eth</Text>}
            reverse
          />
        </Box>
        <Box
          round
          onClick={()=>setInputValue(maxValue)}
          hoverIndicator='secondaryTransparent'
          border='all'
          pad={{ horizontal:'small', vertical:'none' }}
        >
          <Text alignSelf='start' size='xsmall'>Use max</Text>
        </Box>
      </Box>

      <Box
        round='small'
        onClick={()=>console.log('maker vault clickced')}
        hoverIndicator='secondaryTransparent'
        border='all'
        fill='horizontal'
        pad={{ horizontal:'xsmall', vertical:'xsmall' }}
        align='center'
      >
        <Text size='xsmall'>Convert a Maker vault</Text>
      </Box>

      <Box pad='xsmall'>
        <Text alignSelf='start' size='xxsmall'>
          <Info /> You need to deposit collateral in order to Borrow yDai or Dai. 
        </Text>
      </Box>

      <Box fill='horizontal'>
        <Button
          fill='horizontal'
          primary
          disabled={!(inputValue>0) || depositDisabled}
          color='secondary'
          onClick={()=> deposit(inputValue)}
          label={`Deposit ${inputValue || ''} Eth`}
        />
      </Box>
    </Box>
  );
};

export default DepositAction;
