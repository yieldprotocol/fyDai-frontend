import React, { useEffect, useState, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';

import { Anchor, Footer, Text, Box } from 'grommet';

import {
  FiSun as Sun,
  FiMoon as Moon,
  FiGithub as Github,
  FiInfo as Info,
  FiFileText as Docs,
  FiCodesandbox as Test,
} from 'react-icons/fi';

// TODO: use theming context properly - no cheating :)
import { yieldTheme } from '../themes';
import { useSignerAccount } from '../hooks';
import FlatButton from './FlatButton';

const YieldFooter = (props: any) => {
  const {
    setShowTestLayer,
    showTestLayer,
    setDarkMode,
    darkMode,
    openConnectLayer,
  } = props;
  const { account } = useSignerAccount();

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
      {/* <Box>
        {!account && (
          <FlatButton
            label={<Text size='small'>Connect wallet</Text>}
            onClick={() => openConnectLayer()}
          />
        )}
      </Box> */}
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
        {/* <Anchor
          onClick={()=>setDarkMode(!darkMode)}
          color={yieldTheme.global.colors.brand.light}
        >
          {darkMode ? <Sun size={IconSize} /> : <Moon size={IconSize} />}
        </Anchor> */}
      </Box>
    </Footer>
  );
};

export default YieldFooter;
