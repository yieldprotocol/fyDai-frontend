import React, { useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import {
  Text,
  Image,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';
import { VscTelescope as Telescope } from 'react-icons/vsc';
import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

import AccountButton from './AccountButton';
import FlatButton from './FlatButton';
import YieldNav from './YieldNav';

const YieldHeader = (props: any) => {
  const screenSize = useContext(ResponsiveContext);
  const theme = useContext<any>(ThemeContext);
  const location = useLocation();
  const history = useHistory();

  return (
    <>
      <Box
        direction='row'
        pad={screenSize==='small'? { horizontal:'medium', top:'medium' }: { horizontal:'small', top:'large' }}
        justify='between'
        fill
      >
        {screenSize !=='small' &&
        <Box width={screenSize==='small'? '20%':undefined}>
          <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
        </Box>}

        { screenSize==='small' && 
        ['borrow', 'lend', 'pool'].includes(location.pathname.split('/')[1]) && 
        <Box direction='row' gap='medium' align='center'>
          {/* <Box width={screenSize==='small'? '30%':undefined}>
            <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
          </Box>    */}
          {/* <Text weight='bold' size='medium' style={{ textTransform:'capitalize' }}> {location.pathname.split('/')[1]} </Text> */}
          <YieldNav />
        </Box>}

        { screenSize==='small' && 
        ['post', 'withdraw'].includes(location.pathname.split('/')[1])&&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/borrow/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium' style={{ textTransform:'capitalize' }}> {location.pathname.split('/')[1]} Collateral</Text>
        </Box>}
        
        { screenSize==='small' && 
        location.pathname.split('/')[1]==='repay' &&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/borrow/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium'>Repay Dai</Text>
        </Box>}
        { screenSize==='small' && 
        location.pathname.split('/')[1]==='close' &&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/borrow/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium'>Close Position</Text>
        </Box>}

        { screenSize==='small' && 
        location.pathname.split('/')[1]==='remove' &&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/borrow/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium'> Remove Liquidity</Text>
        </Box>}


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
    </>
  );
};

export default YieldHeader;
