import React, { useContext } from 'react';
import { Box } from 'grommet';
import { SeriesContext } from '../contexts/SeriesContext';
import PageHeader from '../components/PageHeader';

import Lend from '../containers/Lend';
import Redeem from '../containers/Redeem';
import RaisedBox from '../components/RaisedBox';

// const Lend = lazy(() => import('../containers/Lend'));
// const Redeem = lazy(() => import('../containers/Redeem'));

interface LendProps {
  activeView?: string;
}

const LendView = ({ activeView }:LendProps) => {

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  return (
    <>
      {/* <PageHeader
        title="Lend"
        subtitle="Description of lending"
        tipPrimary="Tip: Convert your Maker vault"
        tipSecondary="View more tips"
      /> */}
      <RaisedBox> 
        <Lend />
      </RaisedBox>
    </>
  );
};

LendView.defaultProps = {
  activeView: 'lend',
};

export default LendView;
