import React, { useContext } from 'react';
import { Box, Button, ResponsiveContext } from 'grommet';

interface TipProps {
  secondary?: string;
  primary?: string;
}

const TipButtons = (props: TipProps) => {
  const { secondary, primary } = props;
  const screenSize = useContext(ResponsiveContext);

  return (
    <Box
      direction={screenSize === 'small' ? 'column' : 'row'}
      width={{
        min: screenSize === 'small' ? '100%' : '0',
      }}
      gap={screenSize === 'small' ? 'medium' : 'small'}
    >
      {primary ? (
        <Button
          primary
          label={primary}
          style={{
            fontWeight: 600,
          }}
        />
      ) : null}
      {secondary ? <Button label={secondary} /> : null}
    </Box>
  );
};

TipButtons.defaultProps = {
  secondary: null,
  primary: null,
};

export default TipButtons;
