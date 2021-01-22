import React, { useState, useContext } from 'react';
import { Anchor, Footer, Text, Box } from 'grommet';
import { FaDiscord as Discord } from 'react-icons/fa';
import {
  FiGithub as Github,
  FiFileText as Docs,
  FiSun as Sun,
  FiMoon as Moon,
  FiClock as Clock,
} from 'react-icons/fi';
import { CgSleep as Moodlight } from 'react-icons/cg';

import { logEvent } from '../utils/analytics';

import { UserContext } from '../contexts/UserContext';
import { useMaker } from '../hooks/makerHook';

const handleExternal = (destination: string) => {
  logEvent('external_link', {
    action: destination
  });
};

const cycleOptions = (option:string) => {
  if ( option === 'auto') { return 'light'; }
  if ( option === 'light' ) { return 'dark'; }
  if ( option  === 'dark' ) { return 'auto'; }
};

const resetApp = () => {
  localStorage.clear();
  // eslint-disable-next-line no-restricted-globals
  location.reload();
};


const YieldFooter = (props: any) => {
  const {
    themeMode,
    moodLight, 
    toggleMoodLight,
  } = props;

  const { state: { preferences, authorization }, actions: { updatePreferences } } = useContext(UserContext);

  const { genVault } = useMaker();

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
        align='center'
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

        <Box margin={{ left:'small' }}>
          <Text size='xxsmall' color='grey'>
            This software is v0.4.0
          </Text>
          <Text size='xxsmall' color='grey'> Having issues? Try an app <Anchor onClick={()=>resetApp()}>RESET</Anchor>, or get hold of us via <Anchor href='https://discord.gg/JAFfDj5' target="_blank" onClick={() => handleExternal('Discord')}>discord</Anchor>. </Text>
        </Box>

      </Box>
      <Box
        direction="row"
        gap={IconGap}
        style={{
          position: 'relative',
          top: '2px',
        }}
      >
        <Box>
          <Text size='xxsmall' color='grey'>
            Current theme: 
          </Text>
        </Box>
        <Anchor
          onClick={()=>updatePreferences({ ...preferences, themeMode: cycleOptions(themeMode) })}
        >
          { themeMode === 'dark'  && <Box align='center' direction='row' gap='xsmall'><Moon /> <Text size='xxsmall'>Dark</Text></Box>}
          { themeMode === 'light'  && <Box align='center' direction='row' gap='xsmall'><Sun /> <Text size='xxsmall'>Light</Text></Box> }
          { themeMode === 'auto'  && <Box align='center' direction='row' gap='xsmall'><Clock /> <Text size='xxsmall'>Auto</Text></Box> }         
        </Anchor>
        {
          themeMode === 'light' && 
          false &&
          <Anchor
            onClick={()=>toggleMoodLight()}
            color={moodLight? 'pink':'grey'}
          >
            <Moodlight />
          </Anchor>
        }
      </Box>
      {/* <Box onClick={()=>genVault(authorization.dsProxyAddress)}>test</Box> */}
    </Footer>
  );
};

export default YieldFooter;
