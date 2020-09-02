import React from 'react';
import { Box, Heading, Text, ThemeContext, ResponsiveContext, Image } from 'grommet';

import TipsButton from './TipButtons';

import { SeriesContext } from '../contexts/SeriesContext';
import { UserContext } from '../contexts/UserContext';
import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';
import Authorization from './Authorization';

interface PageHeaderProps {
  tipSecondary?: string;
  tipPrimary?: string;
  subtitle?: string;
  title?: string;
}

const PageHeader = (props: PageHeaderProps) => {

  const { state: { authorizations } } = React.useContext(UserContext);
  const { hasDelegatedProxy } = authorizations;

  const { state:{ activeSeries } } = React.useContext(SeriesContext);
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
      fill="horizontal"
      gap="small"
      pad={screenSize === 'small'? 'small' : { bottom: 'large', horizontal: 'small' }}
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
        {hasDelegatedProxy && screenSize !== 'small' && <TipsButton primary={tipPrimary} secondary={tipSecondary} /> }
        {!hasDelegatedProxy && activeSeries && <Authorization buttonOnly />}
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
