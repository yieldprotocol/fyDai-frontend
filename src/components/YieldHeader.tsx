import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import { Grid, Text, Image, Header, Button, Box, ThemeContext } from 'grommet';
import { FaSeedling as YieldLeaf } from 'react-icons/fa';
import { FiSettings as Gear } from 'react-icons/fi';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';
import ProfileButton from './ProfileButton';

import { ConnectionContext } from '../contexts/ConnectionContext';
import { NotifyContext } from '../contexts/NotifyContext';

interface LinkProps {
  link: string;
  text: string;
}

const YieldHeader = (props: any) => {
  const {
    openConnectLayer,
    openAccountLayer,
    activeView,
    setActiveView,
  } = props;

  const {
    state: { account },
  } = React.useContext(ConnectionContext);
  const {
    state: { pendingTxs },
  } = React.useContext(NotifyContext);

  // Menu state for mobile later
  // const [menuOpen] = useState<any>(false);

  const [navLinks] = useState([
    {
      link: 'DASHBOARD',
      text: 'Dashboard',
      id: 0,
    },
    {
      link: 'BORROW',
      text: 'Borrow',
      id: 1,
    },
    {
      link: 'LEND',
      text: 'Lend',
      id: 2,
    },
    {
      link: 'AMM',
      text: 'Market',
      id: 3,
    },
  ]);

  // const { account } = useWeb3React();

  const theme = React.useContext<any>(ThemeContext);

  useEffect(() => {
    // (async () => activate(injected, console.log))();
  }, []);

  const NavLink = ({ link, text }: LinkProps) => (
    <Box
      onClick={() => setActiveView(link)}
      pad={{
        horizontal: 'xsmall',
        vertical: 'xsmall',
      }}
      responsive={true}
      gap="small"
    >
      <Text color={activeView === link ? 'brand' : 'text'}>{text}</Text>
    </Box>
  );

  return (
    <Header
      background={{
        color: 'background-front',
      }}
      justify="between"
      pad={{
        horizontal: 'small',
        vertical: 'none',
      }}
    >
      <Box
        direction="row"
        justify="between"
        align="center"
        flex={true}
        gap="small"
        pad={{
          vertical: 'small',
        }}
      >
        {/* Logo and nav */}
        <Box direction="row" align="center" gap="small">
          {/* Logo */}
          <Box
            onClick={() => setActiveView('DASHBOARD')}
            direction="row"
            margin={{
              right: 'xsmall',
            }}
            responsive
          >
            <Image
              style={{
                height: '1.5rem',
              }}
              src={theme.dark ? logoLight : logoDark}
              fit="contain"
            />
          </Box>
          {/* Left nav */}
          <Box direction="row">
            {navLinks &&
              navLinks.map((item) => (
                <NavLink
                  link={item.link}
                  text={item.text}
                  key={`nav-${item.id}`}
                />
              ))}
          </Box>
        </Box>
        {/* Right nav */}
        <Box direction="row" align="center" gap="small">
          {pendingTxs && pendingTxs.length > 0 && (
            <Box>{pendingTxs.length} transaction pending...</Box>
          )}
          {account ? (
            <Box>
              <ProfileButton
                action={() => openAccountLayer()}
                account={account || ''}
              />
            </Box>
          ) : (
            <Box>
              <Button
                color="border"
                style={{ minWidth: '160px' }}
                label="Connect to a wallet"
                onClick={() => openConnectLayer()}
              />
            </Box>
          )}
          <Box
            direction="row"
            margin={{
              left: 'xsmall',
            }}
          >
            <Gear />
          </Box>
        </Box>
      </Box>
    </Header>
  );
};

export default YieldHeader;
