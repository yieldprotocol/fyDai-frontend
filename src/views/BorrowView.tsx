import React, { useState  } from 'react';
import { Box, Collapsible, Stack } from 'grommet';




import RaisedBox from '../components/RaisedBox';
import BorrowSelector from '../components/BorrowSelector';

import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';

import CollateralSummary from '../components/CollateralSummary';
import FlatButton from '../components/FlatButton';

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
      align='center'
    >
      <RaisedBox>
        <Box
          width={{ max: '600px' }}
          alignSelf="center"
          fill
          background="background-front"
          round='small'
        > 
          {/* <ReactCardFlip isFlipped={activeView === 0}>
            <Borrow setActiveView={setActiveView} />
            <Deposit setActiveView={setActiveView} />
          </ReactCardFlip> */}

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
