import React from 'react';
import { useWeb3React } from '@web3-react/core';

import { 
  Anchor, 
  Grommet, 
  base, 
  Tabs, 
  Tab, 
  Grid,
  Main,
  Footer,
  Button,
  Box,
  Text 
} from 'grommet';
import { 
  FaSun as Sun,
  FaMoon as Moon,
  FaGithub as Github,
  FaInfo as Info,
  FaFileAlt as Docs,
  FaVial as Test,
} from 'react-icons/fa';

// TODO: use theming context properly - no cheating :)
import { yieldTheme } from '../themes';
import { ConnectionContext } from '../contexts/ConnectionContext';
  
const YieldFooter = (props: any) => {


  const { setShowTestLayer, showTestLayer, setDarkmode, darkmode, changeConnection } = props;
  const {state:{ account }} = React.useContext(ConnectionContext);
  // const { account } = useWeb3React();

  return (
    <Footer
      gap="xlarge"
      fill='horizontal'
      pad={{ horizontal: 'large', vertical:'medium' }}
    >
      <Box direction='row' gap='small'>
        <Anchor color='grey'><Github /></Anchor>
        <Anchor color='grey'><Docs /></Anchor>
        <Anchor color='grey'><Info /></Anchor>
      </Box>
      <Box>
        { !account && <Button style={{ minWidth:'160px' }} label='Connect to a wallet' onClick={()=>changeConnection()} />}
      </Box>
      <Box direction='row' gap='medium'>
        <Test onClick={()=>setShowTestLayer(!showTestLayer)} color={showTestLayer?yieldTheme.global.colors.brand.light:'grey'} /> 
        <Box direction='row'>
          { darkmode?
            <Sun onClick={()=>setDarkmode(!darkmode)} color={yieldTheme.global.colors.brand.light} />
            :
            <Moon onClick={()=>setDarkmode(!darkmode)} />}
        </Box>
      </Box>
    </Footer>
  );
};

export default YieldFooter;
