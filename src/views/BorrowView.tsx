import React, { useState, Suspense, lazy } from 'react';
import { Box } from 'grommet';
import PageHeader from '../components/PageHeader';
import ActionSelector from '../components/ActionSelector';

const Deposit = lazy(() => import('../containers/Deposit'));
const Borrow = lazy(() => import('../containers/Borrow'));
const Repay = lazy(() => import('../containers/Repay'));

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
          {activeView === 0 && 
          <Suspense fallback={<Box>Loading...</Box>}>
            <Deposit setActiveView={setActiveView} />
          </Suspense>}
          
          {activeView === 1 && (
            <Suspense fallback={<Box>Loading...</Box>}>
              <Borrow setActiveView={setActiveView} />
            </Suspense>

          )}
          {activeView === 2 && (
            <Suspense fallback={<Box>Loading...</Box>}>
              <Repay setActiveView={setActiveView} />
            </Suspense>
          )}
        </Box>
      </Box>    
    </>
  );
};

BorrowView.defaultProps = {
  activeView: 1,
};

export default BorrowView;
