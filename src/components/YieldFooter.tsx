import React from 'react';
import { useWeb3React } from '@web3-react/core';

import { Anchor, Footer, Button, Box } from 'grommet';

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

// import { ConnectionContext } from '../contexts/ConnectionContext';

const YieldFooter = (props: any) => {
  const {
    setShowTestLayer,
    showTestLayer,
    setDarkmode,
    darkmode,
    changeConnection,
  } = props;
  const { account } = useSignerAccount();

  const IconSize = '1.15rem';
  const IconGap = 'small';

  return (
    <Footer
      align="center"
      fill="horizontal"
      pad={{ horizontal: 'none', vertical: 'medium' }}
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
      <Box>
        {!account && (
          <Button
            label="Connect wallet"
            onClick={() => changeConnection()}
            style={{
              fontWeight: 600,
            }}
          />
        )}
      </Box>
      <Box
        direction="row"
        gap={IconGap}
        style={{
          position: 'relative',
          top: '2px',
        }}
      >
        <Test
          onClick={() => setShowTestLayer(!showTestLayer)}
          size={IconSize}
          color={showTestLayer ? yieldTheme.global.colors.brand.light : 'grey'}
        />
        <Box direction="row">
          {darkmode ? (
            <Sun
              onClick={() => setDarkmode(!darkmode)}
              size={IconSize}
              color={yieldTheme.global.colors.brand.light}
            />
          ) : (
            <Moon onClick={() => setDarkmode(!darkmode)} size={IconSize} />
          )}
        </Box>
      </Box>
    </Footer>
  );
};

export default YieldFooter;
