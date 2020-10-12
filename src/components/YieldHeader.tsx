import React, { useContext } from 'react';
import {
  Image,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';
import { VscTelescope as Telescope } from 'react-icons/vsc';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

import AccountButton from './AccountButton';
import FlatButton from './FlatButton';

const YieldHeader = (props: any) => {

  const screenSize = useContext(ResponsiveContext);
  const theme = useContext<any>(ThemeContext);

  return (
    <Box fill>
      <Box
        direction='row'
        pad={{ horizontal:'small', top:'large' }}
        justify='between'
        fill='horizontal'
      >
        <Box width={screenSize==='small'? '20%':undefined} pad='xxsmall'>
          <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
        </Box>

        <Box direction='row' gap='small'>
          {screenSize !== 'small' &&
            <Box direction="row" align="center" gap="small">
              <AccountButton {...props} />
            </Box>}
          <FlatButton 
            onClick={()=>console.log('xys')}
            label={<Box pad={{ horizontal:'small' }}><Telescope /></Box>}
          /> 
        </Box>
      </Box>
    </Box>
  );
};

export default YieldHeader;
