import React from 'react';
import { Box, Button, Image, TextInput, Text } from 'grommet';
import { FiInfo as Info } from 'react-icons/fi'; 

import ethLogo from '../assets/images/tokens/eth.svg'; 


interface IWithDrawActionProps {
  withdraw: any;
  maxValue: number;
}

const WithdrawAction = ({ withdraw, maxValue }:IWithDrawActionProps) => {

  const [inputValue, setInputValue] = React.useState<any>();

  return (
    <Box align='center' flex='grow' justify='between'>
      <Box margin={{ vertical:'medium' }} gap='xsmall' align='center' fill='horizontal'>
        <Text alignSelf='start' size='xsmall'> Amount to withdraw </Text>
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
            plain
            onChange={(event:any) => setInputValue(event.target.value)}
            icon={<Text alignSelf='start' size='xsmall'>Eth</Text>}
            reverse
          />
        </Box>
        <Box
          round
          // onClick={()=>console.log('max button clicked')}
          onClick={()=>setInputValue(maxValue)}
          hoverIndicator='secondaryTransparent'
          border='all'
          pad={{ horizontal:'small', vertical:'none' }}
        >
          <Text alignSelf='start' size='xsmall'>Withdraw all</Text>
        </Box>
      </Box>

      {/* <Box
        round
        onClick={()=>console.log('max button clicked')}
        hoverIndicator='secondaryTransparent'
        border='all'
        fill='vertical'
        pad={{ horizontal:'small', vertical:'none' }}
      >
        <Text alignSelf='start' size='xsmall'>Convert a Maker vault</Text>
      </Box> */}

      <Box pad='xsmall'>
        <Text alignSelf='start' size='xxsmall'>
          <Info /> Repay some debt if you want to withdraw more collateral.
        </Text>
      </Box>

      <Box fill='horizontal'>
        <Button
          fill='horizontal'
          primary
          disabled={!(inputValue>0)}
          color='secondary'
          onClick={()=>withdraw(inputValue)}
          label={`Withdraw ${inputValue || ''} Eth`}
        />
      </Box>
    </Box>
  );
};

export default WithdrawAction;
