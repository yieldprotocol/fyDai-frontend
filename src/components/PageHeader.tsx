import React from 'react';
import { Box, Heading, Text, ThemeContext, ResponsiveContext, Image } from 'grommet';

import TipsButton from './TipButtons';
import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

interface PageHeaderProps {
  tipSecondary?: string;
  tipPrimary?: string;
  subtitle?: string;
  title?: string;
}


const PageHeader = (props: PageHeaderProps) => {
  const { title, subtitle, tipPrimary, tipSecondary } = props;
  const screenSize = React.useContext(ResponsiveContext);
  const theme = React.useContext<any>(ThemeContext);

  const Logo = () => (
    <Box
      direction="row"
      margin={{
        right: 'xsmall',
      }}
      style={{
        width: '4.5rem',
      }}
    >
      <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
    </Box>
  );

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
        <Box direction='row' justify='between'>
          { false && screenSize === 'small' && <Logo /> }
          <Box>
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
        </Box>
      </Box>
      <Box
        width={{
          min: screenSize === 'small' ? '100%' : '0',
        }}
      >
        { screenSize !== 'small' && <TipsButton primary={tipPrimary} secondary={tipSecondary} /> } 
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
