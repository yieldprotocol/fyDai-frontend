import React, { useContext, lazy, Suspense } from 'react';
import { Box } from 'grommet';
import { SeriesContext } from '../contexts/SeriesContext';
import PageHeader from '../components/PageHeader';

const Lend = lazy(() => import('../containers/Lend'));
const Redeem = lazy(() => import('../containers/Redeem'));

interface LendProps {
  activeView?: string;
}

const LendView = ({ activeView }:LendProps) => {

  const { state: seriesState } = useContext(SeriesContext);
  const { activeSeries } = seriesState;
  return (
    <>
      <PageHeader
        title="Lend"
        subtitle="Description of lending"
        tipPrimary="Tip: Convert your Maker vault"
        tipSecondary="View more tips"
      />
      <Box
        width={{ max:'750px' }}
        alignSelf='center'
        fill='horizontal'
        background='background-front'
        round='small'
      >

        { activeSeries?.isMature() === false  && 
        <Suspense fallback={<Box>Loading...</Box>}>
          <Lend /> 
        </Suspense>}

        { activeSeries?.isMature() === true && 
        <Suspense fallback={<Box>Loading...</Box>}>
          <Redeem /> 
        </Suspense>}
        
      </Box>
    </>
  );
};

LendView.defaultProps = {
  activeView: 'lend',
};

export default LendView;
