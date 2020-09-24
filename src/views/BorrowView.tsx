import React, { useState  } from 'react';
import { Box, Collapsible, Stack } from 'grommet';




import RaisedBox from '../components/RaisedBox';
import PageHeader from '../components/PageHeader';
import BorrowSelector from '../components/BorrowSelector';

import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';

import CollateralSummary from '../components/CollateralSummary';

// const Deposit = lazy(() => import('../containers/Deposit'));
// const Borrow = lazy(() => import('../containers/Borrow'));
// const Repay = lazy(() => import('../containers/Repay'));

interface BorrowProps {
  activeView?: number;
}

const BorrowView = ({
  activeView: activeViewFromProps,
}: BorrowProps) => {
  
  const [ activeView, setActiveView ] = useState<number>( 
    activeViewFromProps || 1
  );

  return (
    <Box 
      gap='small'
      width={{ max:'600px' }}
      alignSelf='center'
      fill='horizontal'
      round='small'
    >
      {/* <PageHeader
        title="Borrow"
        subtitle="Description of borrowing"
        tipPrimary="Tip: Convert your Maker vault"
        tipSecondary="View more tips"
      /> */}

      <BorrowSelector activeView={activeView} setActiveView={setActiveView} />
      <RaisedBox>
        <Box
          width={{ max: '600px' }}
          alignSelf="center"
          fill
          background="background-front"
          round='small'
        > 
          {activeView === 0 && <Deposit setActiveView={setActiveView} /> }  
          {activeView === 1 && <Borrow setActiveView={setActiveView} /> }
          {activeView === 2 && <Repay setActiveView={setActiveView} />}
        </Box>
      </RaisedBox>
    </Box>
  );
};

BorrowView.defaultProps = {
  activeView: 1,
};

export default BorrowView;
