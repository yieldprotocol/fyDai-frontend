import React, { useState } from 'react';
import { Anchor, Footer, Text, Box } from 'grommet';
import { FaDiscord as Discord } from 'react-icons/fa';
import {
  FiGithub as Github,
  FiFileText as Docs,
  FiSun as Sun,
  FiMoon as Moon,
} from 'react-icons/fi';
import { CgSleep as Moodlight } from 'react-icons/cg';

import YieldDisclaimer from './YieldDisclaimer';
import { logEvent } from '../utils/analytics';

const handleExternal = (destination: string) => {
  logEvent({
    category: 'External Link',
    action: destination
  });
};

const YieldFooter = (props: any) => {
  const {
    darkMode,
    setDarkMode,
    moodLight, 
    toggleMoodLight,
  } = props;

  const [ showDisclaimer, setShowDisclaimer] = useState<boolean>(false);

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
        <Anchor color="grey" href='https://github.com/yieldprotocol' target="_blank" onClick={() => handleExternal('Github')}>
          <Github size={IconSize} />
        </Anchor>
        <Anchor color="grey" href='http://docs.yield.is' target="_blank" onClick={() => handleExternal('Docs')}>
          <Docs size={IconSize} />
        </Anchor>
        <Anchor color="grey" href='https://discord.gg/JAFfDj5' target="_blank" onClick={() => handleExternal('Discord')}>
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
        <Box onClick={()=> setShowDisclaimer(true)}>
          <Text size='xxsmall' color='grey'>
            This software is in BETA v0.2
          </Text>
          {/* {showDisclaimer && <YieldDisclaimer forceShow={true} />} */}
        </Box>
        <Anchor
          onClick={()=>toggleMoodLight()}
          color={moodLight? 'pink':'grey'}
        >
          <Moodlight />
        </Anchor>
        <Anchor
          onClick={()=>setDarkMode(!darkMode)}
          color={moodLight? 'pink':'grey'}
        >
          { darkMode? <Sun /> : <Moon />}
        </Anchor>
      </Box>
    </Footer>
  );
};

export default YieldFooter;
