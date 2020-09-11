import React from 'react';
import { Box, Layer } from 'grommet';
import { FiCheckCircle as CheckCircle } from 'react-icons/fi';

import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';


import { useSignerAccount } from '../hooks';

import PageHeader from '../components/PageHeader';
import ActionSelector from '../components/ActionSelector';

interface BorrowProps {
  activeView?: number;
}

const BorrowView = ({
  activeView: activeViewFromProps,
}: BorrowProps) => {
  
  const [ activeView, setActiveView ] = React.useState<number>( 
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
          {activeView === 0 && <Deposit setActiveView={setActiveView} />}
          {activeView === 1 && (
            <Borrow setActiveView={setActiveView} />
          )}
          {activeView === 2 && (
            <Repay setActiveView={setActiveView} />
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
