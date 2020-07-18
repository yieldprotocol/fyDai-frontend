import React from 'react';
import { Box, Heading, Text, ResponsiveContext } from 'grommet';

import TipsButton from './TipButtons';

interface PageHeaderProps {
  tipSecondary?: string;
  tipPrimary?: string;
  subtitle?: string;
  title?: string;
}

const PageHeader = (props: PageHeaderProps) => {
  const { title, subtitle, tipPrimary, tipSecondary } = props;
  const screenSize = React.useContext(ResponsiveContext);

  return (
    <Box
      direction="row"
      justify="between"
      align="center"
      width={{
        min: '100%',
      }}
      fill="horizontal"
      gap="small"
      flex
      wrap
    >
      <Box
        width={{
          min: screenSize === 'small' ? '100%' : '0',
        }}
      >
        <Heading
          level="1"
          margin={{
            bottom: 'small',
            top: 'none',
          }}
          size="medium"
        >
          {title}
        </Heading>
        <Text
          margin={{
            bottom: screenSize === 'small' ? 'medium' : 'none',
          }}
          color="text-weak"
        >
          {subtitle}
        </Text>
      </Box>
      <Box
        width={{
          min: screenSize === 'small' ? '100%' : '0',
        }}
      >
        <TipsButton text={tipPrimary} secondary={tipSecondary} />
      </Box>
    </Box>
  );
};

PageHeader.defaultProps = {
  tipSecondary: null,
  tipPrimary: null,
  subtitle: null,
  title: null,
};

export default PageHeader;
