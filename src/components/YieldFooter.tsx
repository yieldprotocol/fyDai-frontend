import React from 'react';
import { Anchor, Footer, Text, Box } from 'grommet';
import { FaDiscord as Discord } from 'react-icons/fa';
import {
  FiGithub as Github,
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
        <Anchor color="grey" href='https://github.com/yieldprotocol' target="_blank">
          <Github size={IconSize} />
        </Anchor>
        <Anchor color="grey" href='http://docs.yield.is' target="_blank">
          <Docs size={IconSize} />
        </Anchor>
        <Anchor color="grey" href='https://discord.gg/JAFfDj5' target="_blank">
          <Discord size={IconSize} />
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
          color={moodLight? 'pink':'grey'}
        >
          <Moodlight />
        </Anchor>
      </Box>
    </Footer>
  );
};

export default YieldFooter;
