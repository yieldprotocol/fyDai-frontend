import React, { useState, useEffect, useContext } from 'react';

import { useWeb3React } from '@web3-react/core';

import {
  Text,
  Image,
  Header,
  Button,
  Box,
  ThemeContext,
  ResponsiveContext,
  Layer,
  Menu,
} from 'grommet';

import { FiSettings as Gear } from 'react-icons/fi';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';
import YieldLogo from './logos/YieldLogo';

import { NotifyContext } from '../contexts/NotifyContext';
import { YieldContext } from '../contexts/YieldContext';
import TxStatus from  './TxStatus';
import FlatButton from './FlatButton';
import Authorization from './Authorization';

interface LinkProps {
  link: string;
  text: string;
  disabled: boolean;
}

const YieldHeader = (props: any) => {
  const { account } = useWeb3React();
  const {
    openConnectLayer,
    activeView,
    setActiveView,
  } = props;

  const { state: { pendingTxs } } = useContext(NotifyContext);
  const { state: { yieldLoading } } = useContext(YieldContext);
  const screenSize = useContext(ResponsiveContext);

  // Menu state for mobile later
  const [menuOpen, setMenuOpen] = useState(false);

  const [navLinks] = useState([
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
      link: 'POOL',
      text: 'Pool',
      id: 3,
      disabled: false,
    },
  ]);

  const theme = useContext<any>(ThemeContext);

  useEffect(() => {
    // (async () => activate(injected, console.log))();
  }, []);

  function toggleMenu() {
    setMenuOpen((prevMenu) => !prevMenu);
  }

  const CloseButton = () => (
    <Box direction="row" fill="horizontal">
      <Button
        onClick={()=> setMenuOpen(false)}
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

  const MobileNav = () => {
    return (
      <>
        { menuOpen &&
        <Layer full>
          <Box background='background' fill>
            <Nav />
          </Box>        
        </Layer>}
      </>
    );
  };

  const NavLink = ({ link, text, disabled }: LinkProps) => (
    <Box
      direction="row-responsive"
      onClick={() => {
        !disabled && setActiveView(link);
        setMenuOpen(false);
      }}
      gap="small"
    >
      <Text
        weight='bold'
        // eslint-disable-next-line no-nested-ternary
        color={disabled ? 'lightgrey' : activeView === link ? 'brand' : 'text-weak'}
        size={screenSize === 'small' ? 'medium' : 'xlarge'}
        style={{ textDecoration: activeView === link ? 'underline' : 'none', width: screenSize === 'small' ? '100%' : 'auto' }}
      >
        {text}
      </Text>
    </Box>
  );

  const Nav = () => (
    <Box
      direction={screenSize === 'small' ? 'column' : 'row'}
      fill={screenSize === 'small' ? 'horizontal' : false}
      gap='medium'
    >
      {navLinks.map((item) => (
        <NavLink
          link={item.link}
          text={item.text}
          key={`nav-${item.id}`}
          disabled={item.disabled}
        />
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
    return (
      <> 
        { account?
          <FlatButton
            onClick={()=>openConnectLayer('ACCOUNT')}
            label={<Text size='small'>{`${account?.substring(0, 4)}...${account?.substring(account.length - 4)}`} </Text>}
          /> : 
          <FlatButton 
            onClick={() => {
              setMenuOpen(false);
              openConnectLayer('CONNECT');
            }}
            label={<Text size='small'>Connect a wallet</Text>}
          />}

        {/* { !account && 
        <Box direction="row" fill="horizontal">
          <Button
            onClick={() => {
              setMenuOpen(false);
              openConnectLayer('CONNECT');
            }}
            label="Connect to a wallet"
            color="border"
            fill="horizontal"
            style={{
              fontWeight: 600,
              height: screenSize === 'small' ? '2.25rem' : 'auto',
            }}
          />
        </Box>} */}
      </>
    );
  };

  return (
    <Box
      background='background-front'
      direction='row'
      pad={{ horizontal:'medium', vertical:'large' }}
      justify='between'
      fill='horizontal'
    >
      <Box direction='row' fill='horizontal' gap='medium'>
        <Box basis='1/4'>
          <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
        </Box>
        
        { screenSize === 'small' ? 
          <MobileNav /> 
          : 
          <Box direction='row' align='center' width={{ min:'600px', max:'600px'}}> 
            <Nav />
            {/* <Menu
            label={<Text size='xxlarge' weight='bold'>Borrow</Text>}
            items={[
              { label: <Text size='xxlarge' weight='bold'>Lend</Text>, onClick: () => {} },
              { label: <Text size='xxlarge' weight='bold'>Pool</Text>, onClick: () => {} },
            ]}
          />    */}
          </Box>}
      </Box>
      
      <Box basis='auto'>
        {screenSize === 'small' ? (
          <MenuButton />
        ) : (
          <Box direction="row" align="center" gap="small">
            <TxStatus />
            <Account />
            {/* <Box> 
              <Gear />
            </Box> */}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default YieldHeader;
