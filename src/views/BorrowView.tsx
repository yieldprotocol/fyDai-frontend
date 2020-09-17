import React, { useState  } from 'react';
import { Box } from 'grommet';
import PageHeader from '../components/PageHeader';
import ActionSelector from '../components/ActionSelector';

import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';

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
    <>
      <PageHeader
        title="Borrow"
        subtitle="Description of borrowing"
        tipPrimary="Tip: Convert your Maker vault"
        tipSecondary="View more tips"
      />
      <Box 
        background="brand-transparent"
        round='small'
        alignSelf="center"
        width={{ max: '750px' }}
        fill
      >
        <ActionSelector activeView={activeView} setActiveView={setActiveView} />    
        <Box
          width={{ max: '750px' }}
          alignSelf="center"
          fill
          background="background-front"
          round='small'
        > 
          {activeView === 0 && <Deposit setActiveView={setActiveView} /> }  
          {activeView === 1 && <Borrow setActiveView={setActiveView} /> }
          {activeView === 2 && <Repay setActiveView={setActiveView} />}
        </Box>
      </Box>    
    </>
  );
};

BorrowView.defaultProps = {
  activeView: 1,
};

export default BorrowView;
