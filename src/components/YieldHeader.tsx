import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import {
  Grid,
  Text,
  Image,
  Header,
  Button,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';
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

  const screenSize = React.useContext(ResponsiveContext);

  // Menu state for mobile later
  const [menuOpen, setMenu] = useState(false);

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

  function toggleMenu() {
    setMenu((prevMenu) => !prevMenu);
  }

  function closeMenu() {
    setMenu(false);
  }

  const CloseButton = () => <Button onClick={closeMenu}>Close</Button>;

  const MenuButton = () => <Button onClick={toggleMenu}>Menu</Button>;

  const Logo = () => (
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
  );

  const MobileNav = () => (
    <Box
      direction="row"
      style={{
        backgroundColor: 'white',
        transition: 'all 0.15s cubic-bezier(0.075, 0.82, 0.165, 1)',
        transform: menuOpen
          ? 'translate3d(0, 0, 0)'
          : 'translate3d(0, -110%, 0)',
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'fixed',
        zIndex: 999,
        height: '100vh',
        width: '100%',
        left: 0,
        top: 0,
      }}
      fill
      wrap
    >
      <Text
        textAlign="center"
        color={theme.global.colors.text}
        margin="large"
        size="xlarge"
      >
        Menu
      </Text>
      <Nav />
      <PendingTxs />
      <Account />
      <Settings />
      <CloseButton />
    </Box>
  );

  const NavLink = ({ link, text }: LinkProps) => (
    <Box
      direction="row"
      onClick={() => {
        setActiveView(link);
        closeMenu();
      }}
      pad={{
        horizontal: screenSize === 'small' ? 'medium' : 'xsmall',
        vertical: screenSize === 'small' ? 'medium' : 'xsmall',
      }}
      responsive={true}
      gap="small"
    >
      <Text
        textAlign="center"
        weight={600}
        color={activeView === link ? 'brand' : 'text'}
        size={screenSize === 'small' ? 'xxlarge' : 'medium'}
        style={{
          textDecoration: activeView === link ? 'underline' : 'none',
          width: screenSize === 'small' ? '100%' : 'auto',
        }}
      >
        {text}
      </Text>
    </Box>
  );

  const Nav = () => (
    <Box
      direction={screenSize === 'small' ? 'column' : 'row'}
      fill="horizontal"
    >
      {navLinks &&
        navLinks.map((item) => (
          <NavLink link={item.link} text={item.text} key={`nav-${item.id}`} />
        ))}
    </Box>
  );

  const PendingTxs = () => {
    if (pendingTxs && pendingTxs.length > 0) {
      return <Box>{pendingTxs.length} transaction pending...</Box>;
    }
    return null;
  };

  const Account = () => {
    if (account) {
      return (
        <Box>
          <ProfileButton
            action={() => openAccountLayer()}
            account={account || ''}
          />
        </Box>
      );
    }
    return (
      <Box>
        <Button
          onClick={() => openConnectLayer()}
          label="Connect to a wallet"
          color="border"
          style={{ minWidth: '160px', fontWeight: 600 }}
        />
      </Box>
    );
  };

  const Settings = () => (
    <Box
      direction="row"
      margin={{
        left: 'xsmall',
      }}
    >
      <Gear />
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
          <Logo />
          {screenSize === 'small' ? <MobileNav /> : <Nav />}
        </Box>
        {/* Right nav */}
        <Box direction="row" align="center" gap="small">
          {screenSize === 'small' ? (
            <MenuButton />
          ) : (
            <>
              <PendingTxs />
              <Account />
              <Settings />
            </>
          )}
        </Box>
      </Box>
    </Header>
  );
};

export default YieldHeader;
