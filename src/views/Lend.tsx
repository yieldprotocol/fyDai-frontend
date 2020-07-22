import React from 'react';
import moment from 'moment';
import { Box, Button, Heading, Text } from 'grommet';
import RotateLoader from 'react-spinners/RotateLoader';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';
import { IYieldSeries } from '../types';

import BuySell from '../components/x_BuySell';
import Redeem from '../components/Redeem';
import LendAction from '../components/LendAction';
import TipButtons from '../components/TipButtons';

interface LendProps {
  setShowSeriesLayer: any,
  activeView?:string,
}

const Lend = ({ setShowSeriesLayer, activeView: viewFromProp  }:LendProps) => {

  const { state: yieldState, yieldActions } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);

  const [ depositWithdrawActive ] = React.useState<boolean>(true);
  const { isLoading: positionsLoading, seriesData, activeSeries } = seriesState; 


  return (

    <Box gap='small' pad={{ vertical:'large', horizontal:'small' }} fill='horizontal' justify='between'>
      <Box direction='row' fill='horizontal' pad={{ bottom:'large', horizontal:'none' }} justify='between' align='center'>
        <Box>
          <Box direction='row' gap='small'>
            <Heading level='3' margin='none' color='text-strong'>Lend</Heading>
            {/* <Heading level='3' margin='none' onClick={()=>(activeView==='borrow')? setActiveView('lend'):setActiveView('borrow')}><a>{activeView}</a></Heading> */}
            {/* <Heading level='3' margin='none'>yDai</Heading> */}
          </Box>
          <Box direction='row'> 
            <Text size='xsmall' color='text-weak'>
              Description of Lend · Learn more
            </Text>
          </Box>
        </Box>

        <Box direction='row' gap='small' pad='small'>
          <TipButtons text="Tip: Convert your Maker Vault" />
        </Box>
      </Box>

      <Box
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
        pad='large'
      >
        <LendAction maxValue={12} borrowFn={(x:any)=>console.log(x)} />
      </Box>
    </Box>

  );
};

export default Lend;