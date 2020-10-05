import React, { useContext } from 'react';
import { Box } from 'grommet';
import { SeriesContext } from '../contexts/SeriesContext';

import Lend from '../containers/Lend';
import Redeem from '../containers/Redeem';
import RaisedBox from '../components/RaisedBox';

// const Lend = lazy(() => import('../containers/Lend'));
// const Redeem = lazy(() => import('../containers/Redeem'));

interface LendProps {
  openConnectLayer:any;
  activeView?: string;
}

const LendView = ({ openConnectLayer, activeView }:LendProps) => {

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  return (
    <>
      <RaisedBox> 
        <Lend openConnectLayer={openConnectLayer} />
      </RaisedBox>
    </>
  );
};

LendView.defaultProps = {
  activeView: 'lend',
};

export default LendView;
