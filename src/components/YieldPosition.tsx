import React from 'react';
import { Box, TextInput, DropButton, Stack, Text, Collapsible } from 'grommet';
import moment from 'moment';

function YieldPosition({ position, input }: any) {
  const [open, setOpen] = React.useState<boolean>(false);
  const [inputValue, setInputValue]= React.useState<any>();

  return (
    <Box 
      direction='row' 
      justify='between' 
      align='baseline' 
      round 
      color='border' 
      elevation='xsmall'
      pad='small'
    >
      <Box>{position.type}</Box>
      <Box>{position.value}</Box>
      <Box>{position.debt}</Box>
      <Box>{position.balance}</Box>
      {input &&
      <Box>
        <TextInput
          size='small'
          type="number"
          placeholder="Borrow"
          value={inputValue}
          // style={{ borderRadius:'24px 0px 0px 24px' }}
          onChange={event => setInputValue(event.target.value)}
          icon={<Text>yDai</Text>}
          reverse
        />
      </Box>}

    </Box>
  );
}

export default YieldPosition;
