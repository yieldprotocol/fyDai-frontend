import React from 'react';
import { Anchor, Footer, Text, Box } from 'grommet';
import {
  FiGithub as Github,
  FiInfo as Info,
  FiFileText as Docs,
  FiCodesandbox as Test,
} from 'react-icons/fi';

import { CgSleep as Moodlight } from 'react-icons/cg';

// TODO: use theming context properly - no cheating :)
import { yieldTheme } from '../themes';

const YieldFooter = (props: any) => {
  const {
    setShowTestLayer,
    showTestLayer,
    moodLight, 
    toggleMoodLight,
    // setDarkMode,
    // darkMode,
    // openConnectLayer,
  } = props;

  const IconSize = '1.15rem';
  const IconGap = 'small';

  return (
    <Footer
      align="center"
      fill="horizontal"
      pad={{ horizontal: 'none', vertical: 'medium' }}
      background='#ffffff00'
    >
      <Box
        direction="row"
        gap={IconGap}
        style={{
          position: 'relative',
          top: '2px',
        }}
      >
        <Anchor color="grey">
          <Github size={IconSize} />
        </Anchor>
        <Anchor color="grey">
          <Docs size={IconSize} />
        </Anchor>
        <Anchor color="grey">
          <Info size={IconSize} />
        </Anchor>
      </Box>
      <Box
        direction="row"
        gap={IconGap}
        style={{
          position: 'relative',
          top: '2px',
        }}
      >
        <Text size='xsmall' color='text-weak'>
          This software is in ALPHA v0.1
        </Text>
        <Anchor
          onClick={() => setShowTestLayer(!showTestLayer)}
          color={showTestLayer ? yieldTheme.global.colors.brand.light : 'grey'}
        >
          <Test size={IconSize} />
        </Anchor>
        <Anchor
          onClick={()=>toggleMoodLight()}
          color={moodLight? 'grey': 'pink'}
        >
          <Moodlight />
        </Anchor>
      </Box>
    </Footer>
  );
};

export default YieldFooter;
