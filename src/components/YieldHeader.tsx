import React, { useState, useEffect } from 'react';

import { useWeb3React } from '@web3-react/core';

import {
  Text,
  Image,
  Header,
  Button,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';
import { FiSettings as Gear } from 'react-icons/fi';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';
import ProfileButton from './ProfileButton';

import { NotifyContext } from '../contexts/NotifyContext';

interface LinkProps {
  link: string;
  text: string;
  disabled: boolean;
}

const YieldHeader = (props: any) => {

  const { account } = useWeb3React();

  const {
    openConnectLayer,
    openAccountLayer,
    activeView,
    setActiveView,
  } = props;
  
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
      disabled: false,
    },
    {
      link: 'BORROW',
      text: 'Borrow',
      id: 1,
      disabled: false,
    },
    {
      link: 'LEND',
      text: 'Lend',
      id: 2,
      disabled: false,
    },
    {
      link: 'AMM',
      text: 'Pool',
      id: 3,
      disabled: true,
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

  const CloseButton = () => (
    <Box direction="row" fill="horizontal">
      <Button
        onClick={closeMenu}
        alignSelf="center"
        fill="horizontal"
        style={{
          textAlign: 'center',
        }}
      >
        Close
      </Button>
    </Box>
  );

  const MenuButton = () => (
    <Button
      onClick={toggleMenu}
      fill="horizontal"
      style={{
        textAlign: 'right',
      }}
    >
      Menu
    </Button>
  );

  const Logo = () => (
    <Box
      onClick={() => setActiveView('DASHBOARD')}
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
      pad={{
        horizontal: 'large',
        vertical: 'large',
      }}
      fill
      wrap
    >
      <Text
        textAlign="center"
        color="text-weak"
        margin="large"
        size="xlarge"
        style={{
          width: screenSize === 'small' ? '100%' : 'auto',
        }}
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

  const NavLink = ({ link, text, disabled }: LinkProps) => (
    <Box
      direction="row"
      onClick={() => {
        !disabled && setActiveView(link);
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
        // TODO undo this when pages are ready
        // eslint-disable-next-line no-nested-ternary
        color={disabled? 'lightgrey' : (activeView === link ? 'brand' : 'text-weak')}
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
      fill={screenSize === 'small' ? 'horizontal' : false}
    >
      {navLinks &&
        navLinks.map((item) => (
          <NavLink link={item.link} text={item.text} key={`nav-${item.id}`} disabled={item.disabled} />
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
      <Box direction="row" fill="horizontal">
        <Button
          onClick={() => openConnectLayer()}
          label="Connect to a wallet"
          color="border"
          fill="horizontal"
          style={{
            minWidth: '160px',
            fontWeight: 600,
            height: screenSize === 'small' ? '2.25rem' : 'auto',
          }}
        />
      </Box>
    );
  };

  const Settings = () => (
    <Button
      style={{
        textAlign: 'center',
      }}
      fill={screenSize === 'small' ? 'horizontal' : false}
      icon={<Gear />}
    />
  );

  return (
    <Header
      background={{
        color: 'background-front',
      }}
      pad={{
        horizontal: 'small',
        vertical: 'none',
      }}
    >
      <Box
        direction="row"
        justify="between"
        align="center"
        flex
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
        <Box direction="row" align="center" gap="small" justify="end" flex>
          {screenSize === 'small' ? (
            <MenuButton />
          ) : (
            <Box direction="row" align="center" gap="small">
              <PendingTxs />
              <Account />
              <Settings />
            </Box>
          )}
        </Box>
      </Box>
    </Header>
  );
};

export default YieldHeader;
