import React from 'react';
import { Box, Button } from 'grommet';

interface TipProps {
  text: string;
}

const TipButton = (props: TipProps) => {
  const { text } = props;
  return (
    <Box direction="row">
      <Button
        primary
        label={text}
        margin={{
          right: 'small',
        }}
        style={{
          fontWeight: 600,
        }}
      />
      <Button label="View more tips" />
    </Box>
  );
};

export default TipButton;
