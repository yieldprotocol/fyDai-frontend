import React from 'react';
import { Box, Button, ResponsiveContext } from 'grommet';

interface TipProps {
  secondary?: string;
  text?: string;
}

const TipButtons = (props: TipProps) => {
  const { secondary, text } = props;
  const screenSize = React.useContext(ResponsiveContext);

  return (
    <Box
      direction={screenSize === 'small' ? 'column' : 'row'}
      width={{
        min: screenSize === 'small' ? '100%' : '0',
      }}
      gap={screenSize === 'small' ? 'medium' : 'small'}
    >
      {text ? (
        <Button
          primary
          label={text}
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
  text: null,
};

export default TipButtons;
