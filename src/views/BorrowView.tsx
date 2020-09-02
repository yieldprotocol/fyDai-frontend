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
  activeView?: string;
}

const BorrowView = ({
  activeView: activeViewFromProps,
}: BorrowProps) => {
  
  const [ activeView, setActiveView ] = React.useState<string>( 
    activeViewFromProps || 'COLLATERAL'
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
          pad="large"
        >
          {activeView === 'COLLATERAL' && <Deposit setActiveView={(x:string)=>setActiveView(x.toUpperCase())} />}
          {activeView === 'BORROW' && (
            <Borrow />
          )}
          {activeView === 'REPAY' && (
            <Repay />
          )}
        </Box>
      </Box>    
    </>
  );
};

BorrowView.defaultProps = {
  activeView: null,
};

export default BorrowView;
