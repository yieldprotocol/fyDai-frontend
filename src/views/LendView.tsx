import React, { useState, useContext } from 'react';
import { Box } from 'grommet';

import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';

import Redeem from '../containers/Redeem';
import Lend from '../containers/Lend';

import PageHeader from '../components/PageHeader';


interface LendProps {
  activeView?: string;
}

const LendView = ({ activeView: activeViewFromProp  }:LendProps) => {

  const [ activeView, setActiveView ] = useState<string|undefined>( activeViewFromProp );

  const { state: yieldState, yieldActions } = React.useContext(YieldContext);
  const { state: seriesState, actions: seriesActions } = React.useContext(SeriesContext);

  const { isLoading: positionsLoading, seriesData, activeSeries } = seriesState; 

  return (
    <Box gap='small' pad={{ vertical:'large', horizontal:'small' }} fill='horizontal' justify='between'>
      <Box
        direction="row"
        fill="horizontal"
        pad={{ bottom: 'large', horizontal: 'none' }}
        justify="between"
        align="center"
      >
        <PageHeader
          title="Lend"
          subtitle="Description of lending"
          tipPrimary="Tip: Convert your Maker vault"
          tipSecondary="View more tips"
        />
      </Box>    
      <Box
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
        pad='large'
      >
        <Lend />
        {false && <Redeem /> }
      </Box>
    </Box>
  );
};

LendView.defaultProps = {
  activeView: 'lend',
};

export default LendView;
