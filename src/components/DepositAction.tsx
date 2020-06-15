import React from 'react';
import { Box, Button, Image, TextInput, Text } from 'grommet';
import { FiInfo as Info } from 'react-icons/fi'; 

import ethLogo from '../assets/images/tokens/eth.svg'; 

const DepositAction = ({ close }:any) => {

  const [inputValue, setInputValue] = React.useState<number>();

  return (
    <Box align='center' gap='small'>
      <Box margin={{ vertical:'medium' }} gap='xsmall' align='center' fill='horizontal'>
        <Text alignSelf='start' size='xsmall'> Amount to deposit </Text>
        <Box round='small' border={{ color:'secondary' }} direction='row' fill='horizontal'>
          <Box width='15px' height='15px'>
            <Image src={ethLogo} fit='contain' />
          </Box>
          <TextInput
            type="number"
            placeholder="0"
            value={inputValue}
            plain
            onChange={(event:any) => setInputValue(event.target.value)}
            icon={<Text alignSelf='start' size='xsmall'>Eth</Text>}
            reverse
          />
        </Box>
        <Box
          round
          onClick={()=>console.log('max button clicked')}
          hoverIndicator='secondaryTransparent'
          border='all'
          pad={{ horizontal:'small', vertical:'none' }}
        >
          <Text alignSelf='start' size='xsmall'>Use max</Text>
        </Box>
      </Box>

      <Box
        round
        onClick={()=>console.log('max button clicked')}
        hoverIndicator='secondaryTransparent'
        border='all'
        fill='vertical'
        pad={{ horizontal:'small', vertical:'none' }}
      >
        <Text alignSelf='start' size='xsmall'>Convert a Maker vault</Text>
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
          color='secondary'
          onClick={()=>console.log({ inputValue })}
          label={`Deposit ${inputValue || ''} Eth`}
        />
      </Box>
    </Box>
  );
};

export default DepositAction;
