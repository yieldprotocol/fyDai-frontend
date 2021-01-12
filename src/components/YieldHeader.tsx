import React, { useContext } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import {
  Text,
  Image,
  Box,
  ThemeContext,
  ResponsiveContext,
} from 'grommet';

import { FiArrowLeft as ArrowLeft } from 'react-icons/fi';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

import AccountButton from './AccountButton';
import YieldNav from './YieldNav';

const YieldHeader = (props: any) => {
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const theme = useContext<any>(ThemeContext);
  const location = useLocation();
  const history = useHistory();

  return (
    <>
      <Box
        direction='row-responsive'
        pad={mobile?{ horizontal:'small', vertical:'large' }:{ horizontal:'small', vertical:'large' }}
        justify='between'
        fill
      >
        {
          !mobile &&
          <Box width={mobile? '20%':undefined}>
            <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
          </Box>
        }

        { 
        mobile && 
        ['borrow', 'lend', 'pool', 'trade'].includes(location.pathname.split('/')[1]) && 
        <Box direction='row' gap='medium' align='center'>
          <YieldNav />
        </Box>
        }

        { mobile && 
        ['post', 'withdraw'].includes(location.pathname.split('/')[1])&&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/borrow/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium' style={{ textTransform:'capitalize' }}> {location.pathname.split('/')[1]} Collateral</Text>
        </Box>}
        
        { 
        mobile && 
        location.pathname.split('/')[1]==='repay' &&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/borrow/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium'>Repay Dai</Text>
        </Box>
        }
        
        { 
        mobile && 
        location.pathname.split('/')[1]==='close' &&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/lend/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium'>Close Position</Text>
        </Box>
        }

        { 
        mobile && 
        location.pathname.split('/')[1]==='removeLiquidity' &&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/pool/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium'>Remove Liquidity</Text>
        </Box>
        }

{ 
        mobile && 
        location.pathname.split('/')[1]==='removeLiquidity' &&
        <Box direction='row' gap='medium' align='center'>
          <Box onClick={()=>history.push('/pool/')}><ArrowLeft /></Box>
          <Text weight='bold' size='medium'>Remove Liquidity</Text>
        </Box>
        }

      </Box>

      <Box direction='row' gap='small' alignSelf={mobile?'center':undefined} fill justify='end'>
        <AccountButton {...props} />
      </Box>
    </>
  );
};

export default YieldHeader;
