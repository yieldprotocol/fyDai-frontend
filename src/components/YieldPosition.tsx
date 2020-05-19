import React from 'react';
import { Box, DropButton, Stack, Text, Collapsible } from 'grommet';
import moment from 'moment';

function YieldPosition({ position }: any) {
  const [open, setOpen] = React.useState<boolean>(false);
  return (
    <Box direction='row' justify='between'>
      <Box>{position.type}</Box>
      <Box>{position.value}</Box>
      <Box>{position.debt}</Box>
      <Box>{position.balance}</Box>
    </Box>
  );
}

export default YieldPosition;
